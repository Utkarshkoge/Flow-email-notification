import { unauthenticated } from "../shopify.server";
import { resolveTopicInfo } from "./topicMapper.server";
import { resolveWebhookActor } from "./webhookActorResolver.server";
import { extractMinimalPayload } from "../utils/extractMinimalPayload";
import { generateEmailHtml } from "../utils/emailTemplate";
import type { ShopifyWebhookJobData } from "./queue/webhookQueue.server";

export type ProcessWebhookOptions = ShopifyWebhookJobData;

/**
 * Core Webhook Processor
 * ──────────────────────
 * Executed asynchronously inside the BullMQ worker.
 * 
 * Execution Steps:
 * 1. Validate shop domain against installed store offline session.
 * 2. Resolve topic info.
 * 3. Extract resource identifiers and timestamp.
 * 4. Resolve actor (changedBy).
 * 5. Parallel execution:
 *    - Branch A: Send email via Shopify Flow (order-email-trigger).
 *    - Branch B: Write audit log to Shopify Metaobjects (WITHOUT 30-day cleanup).
 */
export async function processWebhookEvent({
    webhookId,
    shop,
    topic,
    payload,
}: ProcessWebhookOptions): Promise<void> {
    console.log(`[Processor] ═══════════════════════════════════════════════════════`);
    console.log(`[Processor] ⚙️  PROCESSING START  webhookId=${webhookId}  shop=${shop}  topic=${topic}`);
    console.log(`[Processor] ═══════════════════════════════════════════════════════`);

    // 1. Domain / Store Validation
    console.log(`[Processor] ── Validating store session for shop="${shop}"`);
    let adminContext: Awaited<ReturnType<typeof unauthenticated.admin>> | null = null;
    try {
        adminContext = await unauthenticated.admin(shop);
    } catch (authErr) {
        console.warn(`[Processor] ⚠️ Failed to acquire offline admin session for shop="${shop}":`, authErr);
    }

    if (!adminContext || !adminContext.admin) {
        const errorMsg = `Store "${shop}" is not installed or offline access token is missing/revoked.`;
        console.error(`[Processor] ❌ ${errorMsg}`);
        // Non-recoverable: store is uninstalled, exit without throwing retry error
        return;
    }

    const { admin } = adminContext;
    console.log(`[Processor] ✅ Store validated. Offline session acquired for shop="${shop}".`);

    // 2. Resolve Topic Info
    console.log(`[Processor] ── Resolving topicInfo for topic="${topic}"`);
    const topicInfo = resolveTopicInfo(topic);
    if (!topicInfo) {
        console.warn(`[Processor] ⚠️ No topicInfo mapping found for topic="${topic}". Skipping event.`);
        return;
    }

    const incomingResourceType = topicInfo.resourceType;
    const eventAction = topicInfo.eventAction;
    console.log(`[Processor] ✅ topic mapped: resourceType="${incomingResourceType}" eventAction="${eventAction}"`);

    // 3. Extract Resource Identifiers
    const adminGraphqlId = payload?.admin_graphql_api_id as string | undefined;
    const gidResourceType = incomingResourceType.replace(/\s+/g, "");
    const resourceId =
        adminGraphqlId ||
        (payload?.id
            ? `gid://shopify/${gidResourceType}/${payload.id}`
            : payload?.handle
                ? `Handle-${gidResourceType}--'${payload.handle}'`
                : "unknown");

    const rawTimestamp =
        (payload?.updated_at as string | undefined) ||
        (payload?.created_at as string | undefined) ||
        new Date().toISOString();

    const handleId = webhookId || `event-${Date.now()}`;
    console.log(`[Processor] ✅ Identifiers: resourceId="${resourceId}" timestamp="${rawTimestamp}" handleId="${handleId}"`);

    // 4. Resolve Actor (changedBy)
    let changedBy = "Don't Know";
    try {
        changedBy = await resolveWebhookActor({
            admin,
            topic,
            adminGraphqlId: resourceId,
            timestamp: rawTimestamp,
        });
        console.log(`[Processor] ✅ Actor resolved: changedBy="${changedBy}"`);
    } catch (actorErr) {
        console.warn(`[Processor] ⚠️ Actor resolution failed — defaulting to "Don't Know":`, actorErr);
    }

    // 5. Parallel Execution: Flow Email Trigger + Metaobject Log
    // Note: 30-day cleanup is completely excluded from this hot-path.
    console.log(`[Processor] ── Executing PARALLEL branches (Flow Trigger + Metaobject Log)`);
    await Promise.all([
        // Branch A: Trigger Shopify Flow
        sendEmailViaFlow({
            admin,
            incomingResourceType,
            eventAction,
            rawTimestamp,
            changedBy,
            payload,
        }),

        // Branch B: Write audit log to Shopify Metaobjects (NO 30-day cleanup)
        writeMetaobjectLog({
            admin,
            shop,
            topic,
            incomingResourceType,
            eventAction,
            resourceId,
            rawTimestamp,
            webhookId,
            handleId,
            changedBy,
            payload,
        }),
    ]);

    console.log(`[Processor] ✅ SUCCESS webhookId=${webhookId} completed.`);
    console.log(`[Processor] ═══════════════════════════════════════════════════════`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Branch A — Send email via Shopify Flow
// ─────────────────────────────────────────────────────────────────────────────

async function sendEmailViaFlow({
    admin,
    incomingResourceType,
    eventAction,
    rawTimestamp,
    changedBy,
    payload,
}: {
    admin: { graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response> };
    incomingResourceType: string;
    eventAction: string;
    rawTimestamp: string;
    changedBy: string;
    payload: Record<string, unknown>;
}) {
    console.log(`[Processor] [EMAIL] ── Building email payload`);

    let minimalPayload: Record<string, unknown> = {};
    try {
        minimalPayload = extractMinimalPayload(incomingResourceType, payload);
        console.log(`[Processor] [EMAIL] ✅ Minimal payload: keys=[${Object.keys(minimalPayload).join(", ")}]`);
    } catch (payloadErr) {
        console.error(`[Processor] [EMAIL] ❌ extractMinimalPayload threw:`, payloadErr);
    }

    let emailBody = "";
    try {
        emailBody = generateEmailHtml({
            resourceType: incomingResourceType,
            eventType: eventAction.toLowerCase(),
            createdAt: rawTimestamp,
            changedBy,
            payload: minimalPayload,
        });
        console.log(`[Processor] [EMAIL] ✅ HTML generated (${emailBody.length} chars)`);
    } catch (emailErr) {
        console.error(`[Processor] [EMAIL] ❌ generateEmailHtml threw:`, emailErr);
    }

    const flowPayload = {
        resourceType: incomingResourceType,
        eventType: eventAction.toLowerCase(),
        createdAt: rawTimestamp,
        emailBody,
    };

    console.log(`[Processor] [EMAIL] ── Calling flowTriggerReceive (handle="order-email-trigger")`);

    try {
        const flowResponse = await admin.graphql(
            `#graphql
            mutation flowTriggerReceive($handle: String!, $payload: JSON!) {
                flowTriggerReceive(handle: $handle, payload: $payload) {
                    userErrors { field message }
                }
            }`,
            {
                variables: {
                    handle: "order-email-trigger",
                    payload: flowPayload,
                },
            }
        );

        const flowJson = await flowResponse.json();

        // Check for top-level GraphQL errors (e.g. invalid scopes, internal errors)
        if (flowJson.errors && flowJson.errors.length > 0) {
            console.error(`[Processor] [EMAIL] ❌ GraphQL error in flowTriggerReceive:`, JSON.stringify(flowJson.errors, null, 2));
            throw new Error(`flowTriggerReceive GraphQL error: ${flowJson.errors.map((e: any) => e.message).join(", ")}`);
        }

        // Check for userErrors
        const flowErrors = flowJson.data?.flowTriggerReceive?.userErrors ?? [];
        if (flowErrors.length > 0) {
            console.error(`[Processor] [EMAIL] ❌ flowTriggerReceive userErrors:`);
            flowErrors.forEach((e: { field: string; message: string }) =>
                console.error(`[Processor] [EMAIL]   → field="${e.field}" message="${e.message}"`)
            );
            throw new Error(`flowTriggerReceive userErrors: ${flowErrors.map((e: any) => e.message).join(", ")}`);
        }

        console.log(`[Processor] [EMAIL] ✅ Flow trigger sent — queued by Shopify Flow!`);

    } catch (flowErr) {
        console.error(`[Processor] [EMAIL] ❌ flowTriggerReceive threw:`, flowErr);
        throw flowErr;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Branch B — Write metaobject log (NO 30-day cleanup)
// ─────────────────────────────────────────────────────────────────────────────

async function writeMetaobjectLog({
    admin,
    shop,
    topic,
    incomingResourceType,
    eventAction,
    resourceId,
    rawTimestamp,
    webhookId,
    handleId,
    changedBy,
    payload,
}: {
    admin: { graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response> };
    shop: string;
    topic: string;
    incomingResourceType: string;
    eventAction: string;
    resourceId: string;
    rawTimestamp: string;
    webhookId: string | null;
    handleId: string;
    changedBy: string;
    payload: Record<string, unknown>;
}) {
    try {
        console.log(`[Processor] [LOG] ── Checking metaobject definition "flow_email_notification__" (shop=${shop})`);
        const definitionExists = await checkMetaobjectDefinitionExists(admin, shop);

        if (!definitionExists) {
            console.warn(`[Processor] [LOG] ⚠️ Metaobject definition NOT found — skipping log.`);
            return;
        }

        await upsertMetaobjectLog({
            admin,
            topic,
            incomingResourceType,
            eventAction,
            resourceId,
            rawTimestamp,
            webhookId,
            handleId,
            changedBy,
            payload,
        });

        console.log(`[Processor] [LOG] ✅ Log write completed.`);

    } catch (logErr) {
        console.error(`[Processor] [LOG] ❌ writeMetaobjectLog threw an error:`, logErr);
    }
}

async function upsertMetaobjectLog({
    admin,
    topic,
    incomingResourceType,
    eventAction,
    resourceId,
    rawTimestamp,
    webhookId,
    handleId,
    changedBy,
    payload,
}: {
    admin: { graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response> };
    topic: string;
    incomingResourceType: string;
    eventAction: string;
    resourceId: string;
    rawTimestamp: string;
    webhookId: string | null;
    handleId: string;
    changedBy: string;
    payload: Record<string, unknown>;
}) {
    console.log(`[Processor] [LOG] ── Writing metaobject log entry handle="${handleId}"`);

    const metaResponse = await admin.graphql(
        `#graphql
        mutation metaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
          metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
            metaobject { id handle }
            userErrors { field message }
          }
        }`,
        {
            variables: {
                handle: { handle: handleId, type: "flow_email_notification__" },
                metaobject: {
                    fields: [
                        { key: "topic", value: topic },
                        { key: "resourceType", value: incomingResourceType },
                        { key: "resourceId", value: resourceId },
                        { key: "eventAction", value: eventAction },
                        { key: "payload", value: JSON.stringify(payload) },
                        { key: "webhookId", value: webhookId || "" },
                        { key: "createdAt", value: rawTimestamp },
                        { key: "changedBy", value: changedBy },
                    ],
                },
            },
        }
    );

    const metaResData = await metaResponse.json();
    const metaErrors = metaResData.data?.metaobjectUpsert?.userErrors ?? [];

    if (metaErrors.length > 0) {
        console.error(`[Processor] [LOG] ❌ metaobjectUpsert userErrors:`);
        metaErrors.forEach((e: { field: string; message: string }) =>
            console.error(`[Processor] [LOG]   → field="${e.field}" message="${e.message}"`)
        );
    } else {
        const savedId = metaResData.data?.metaobjectUpsert?.metaobject?.id ?? "?";
        console.log(`[Processor] [LOG] ✅ Log written — id=${savedId} handle=${handleId}`);
    }
}

async function checkMetaobjectDefinitionExists(
    admin: { graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response> },
    shop: string
): Promise<boolean> {
    try {
        const response = await admin.graphql(
            `#graphql
            query CheckMetaobjectDefinition($type: String!) {
                metaobjectDefinitionByType(type: $type) {
                    id
                    type
                }
            }`,
            { variables: { type: "flow_email_notification__" } }
        );

        const data = await response.json();

        if (data.errors) {
            console.error(`[Processor] [LOG] ❌ GraphQL errors checking definition:`, data.errors);
            return false;
        }

        const def = data.data?.metaobjectDefinitionByType;
        const exists = !!def?.id;
        console.log(`[Processor] [LOG] ℹ️  metaobjectDefinitionByType: exists=${exists} id=${def?.id ?? "null"} shop=${shop}`);
        return exists;

    } catch (err) {
        console.error(`[Processor] [LOG] ❌ Definition check error:`, err);
        return false;
    }
}
