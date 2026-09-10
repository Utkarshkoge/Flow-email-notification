import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { resolveTopicInfo } from "app/services/topicMapper.server";
import { addWebhookJob } from "app/services/queue/webhookQueue.server";

// ─────────────────────────────────────────────────────────────────────────────
// ACTION  — Fast Ingestion to Redis + BullMQ Queue
//
// 1. Authenticate HMAC signature
// 2. Extract shop, topic, webhookId, payload
// 3. Enqueue job to BullMQ queue (idempotent via BullMQ jobId)
// 4. Return HTTP 200 OK immediately
//
// All asynchronous processing takes place in the BullMQ worker.
// ─────────────────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
    const { topic, shop, payload } = await authenticate.webhook(request);
    const webhookId =
        request.headers.get("X-Shopify-Webhook-Id") ||
        `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    console.log(`[Webhook] ═══════════════════════════════════════════════════════`);
    console.log(`[Webhook] 📬 RECEIVED  topic=${topic}  shop=${shop}  webhookId=${webhookId}`);
    console.log(`[Webhook] ═══════════════════════════════════════════════════════`);

    // Quick topic resolution for resourceType metadata if available
    const topicInfo = resolveTopicInfo(topic);

    // Enqueue job into BullMQ (using webhookId as jobId for deduplication)
    await addWebhookJob({
        webhookId,
        shop,
        topic,
        payload: (payload as Record<string, unknown>) ?? {},
        resourceType: topicInfo?.resourceType ?? null,
    });

    console.log(`[Webhook] ⚡ RESPONDING HTTP 200 OK`);
    return new Response(null, { status: 200 });
};