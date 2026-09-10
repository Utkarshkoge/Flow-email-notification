import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import {
    ALL_MANAGED_TOPICS,
    type ActionDefinition,
    type ResourceWebhookConfig,
} from "../constants/webhookResources";

export { ALL_MANAGED_TOPICS, type ActionDefinition, type ResourceWebhookConfig };

export interface ExistingWebhookNode {
    id: string;
    topic: string;
    format?: string;
    endpoint?: {
        __typename: string;
        callbackUrl?: string;
    };
}

/**
 * Fetch all existing webhook subscriptions using Shopify GraphQL Admin API.
 */
export async function getActiveWebhookSubscriptions(
    admin: AdminApiContext
): Promise<Map<string, ExistingWebhookNode>> {
    const subscriptionsByTopic = new Map<string, ExistingWebhookNode>();

    const query = `#graphql
    query GetWebhookSubscriptions($cursor: String) {
      webhookSubscriptions(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            topic
            format
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    }
    `;

    try {
        let hasNextPage = true;
        let cursor: string | null = null;

        while (hasNextPage) {
            const response = await admin.graphql(query, { variables: { cursor } });
            const data: any = await response.json();

            if (data.errors) {
                console.error("[DynamicWebhookManager] GraphQL errors fetching subscriptions:", data.errors);
                break;
            }

            const edges: Array<{ node: ExistingWebhookNode }> =
                data.data?.webhookSubscriptions?.edges || [];

            for (const edge of edges) {
                if (edge?.node?.topic) {
                    subscriptionsByTopic.set(edge.node.topic, edge.node);
                }
            }

            hasNextPage = data.data?.webhookSubscriptions?.pageInfo?.hasNextPage || false;
            cursor = data.data?.webhookSubscriptions?.pageInfo?.endCursor || null;
        }
    } catch (err) {
        console.error("[DynamicWebhookManager] Failed to fetch active webhook subscriptions:", err);
    }

    return subscriptionsByTopic;
}

/**
 * Create a webhook subscription via GraphQL Admin API.
 */
export async function createWebhookSubscription(
    admin: AdminApiContext,
    topic: string,
    callbackUrl: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    const mutation = `#graphql
    mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription {
          id
          topic
        }
        userErrors {
          field
          message
        }
      }
    }
    `;

    try {
        const response = await admin.graphql(mutation, {
            variables: {
                topic,
                webhookSubscription: {
                    callbackUrl,
                    format: "JSON",
                },
            },
        });

        const data: any = await response.json();

        if (data.errors && data.errors.length > 0) {
            const msg = data.errors.map((e: any) => e.message).join(", ");
            return { success: false, error: msg };
        }

        const userErrors = data.data?.webhookSubscriptionCreate?.userErrors || [];
        if (userErrors.length > 0) {
            const msg = userErrors.map((e: any) => e.message).join(", ");
            // If already taken, consider it existing / success
            if (msg.toLowerCase().includes("address for this topic has already been taken")) {
                return { success: true };
            }
            return { success: false, error: msg };
        }

        const id = data.data?.webhookSubscriptionCreate?.webhookSubscription?.id;
        return { success: true, id };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/**
 * Delete a webhook subscription by ID via GraphQL Admin API.
 */
export async function deleteWebhookSubscription(
    admin: AdminApiContext,
    id: string
): Promise<{ success: boolean; error?: string }> {
    const mutation = `#graphql
    mutation webhookSubscriptionDelete($id: ID!) {
      webhookSubscriptionDelete(id: $id) {
        userErrors {
          field
          message
        }
        deletedWebhookSubscriptionId
      }
    }
    `;

    try {
        const response = await admin.graphql(mutation, {
            variables: { id },
        });

        const data: any = await response.json();

        if (data.errors && data.errors.length > 0) {
            const msg = data.errors.map((e: any) => e.message).join(", ");
            return { success: false, error: msg };
        }

        const userErrors = data.data?.webhookSubscriptionDelete?.userErrors || [];
        if (userErrors.length > 0) {
            const msg = userErrors.map((e: any) => e.message).join(", ");
            return { success: false, error: msg };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/**
 * Sync selected topics with Shopify:
 *  - Subscribes newly selected topics
 *  - Unsubscribes deselected topics that were previously subscribed
 */
export async function syncWebhookSubscriptions(
    admin: AdminApiContext,
    appUrl: string,
    desiredTopics: string[]
): Promise<{ created: string[]; deleted: string[]; errors: string[] }> {
    const cleanAppUrl = appUrl.trim().replace(/\/+$/, "");
    const callbackUrl = `${cleanAppUrl.replace("http://", "https://")}/webhooks/shopify`;

    const desiredSet = new Set(desiredTopics);
    const existingMap = await getActiveWebhookSubscriptions(admin);

    const created: string[] = [];
    const deleted: string[] = [];
    const errors: string[] = [];

    // 1. Identify which desired topics need to be created
    const topicsToCreate = desiredTopics.filter((t) => !existingMap.has(t));

    // 2. Identify existing subscriptions to delete:
    // Only delete topics that are part of our managed list and NOT in desiredSet.
    // (We intentionally avoid touching external app webhooks or mandatory webhooks like app/uninstalled)
    const subscriptionsToDelete: { id: string; topic: string }[] = [];
    for (const [topic, node] of existingMap.entries()) {
        if (ALL_MANAGED_TOPICS.has(topic) && !desiredSet.has(topic)) {
            subscriptionsToDelete.push({ id: node.id, topic });
        }
    }

    // Process creations in batches
    for (const topic of topicsToCreate) {
        const res = await createWebhookSubscription(admin, topic, callbackUrl);
        if (res.success) {
            created.push(topic);
        } else {
            errors.push(`Failed to subscribe ${topic}: ${res.error}`);
        }
    }

    // Process deletions
    for (const sub of subscriptionsToDelete) {
        const res = await deleteWebhookSubscription(admin, sub.id);
        if (res.success) {
            deleted.push(sub.topic);
        } else {
            errors.push(`Failed to unsubscribe ${sub.topic}: ${res.error}`);
        }
    }

    return { created, deleted, errors };
}
