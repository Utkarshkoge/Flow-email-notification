import { Queue } from "bullmq";
import { getRedisConnection } from "./connection.server";

export interface ShopifyWebhookJobData {
    webhookId: string;
    shop: string;
    topic: string;
    payload: Record<string, unknown>;
    resourceType?: string | null;
}

export const SHOPIFY_WEBHOOK_QUEUE_NAME = "shopify-webhooks";

declare global {
    var webhookQueueGlobal: Queue<ShopifyWebhookJobData, void, string> | undefined;
}

/**
 * Returns or creates the singleton BullMQ Queue instance
 */
export function getWebhookQueue(): Queue<ShopifyWebhookJobData, void, string> {
    if (!global.webhookQueueGlobal) {
        global.webhookQueueGlobal = new Queue<ShopifyWebhookJobData, void, string>(
            SHOPIFY_WEBHOOK_QUEUE_NAME,
            {
                connection: getRedisConnection(),
            }
        );
    }
    return global.webhookQueueGlobal;
}

/**
 * Adds a webhook processing job to BullMQ using webhookId as jobId for deduplication
 */
export async function addWebhookJob(
    data: ShopifyWebhookJobData
): Promise<{ enqueued: boolean; duplicate?: boolean; error?: unknown }> {
    try {
        const queue = getWebhookQueue();

        // Enqueue with BullMQ's built-in jobId deduplication and retry strategy
        await queue.add("process-webhook", data, {
            jobId: data.webhookId, // Prevents duplicate jobs for the same Shopify webhook delivery ID
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
            // Keep completed jobs for 24h (or up to 5,000 jobs) so repeated deliveries are rejected by jobId
            removeOnComplete: {
                age: 86400,
                count: 5000,
            },
            removeOnFail: {
                age: 86400,
                count: 5000,
            },
        });

        console.log(`[Queue] 📥 Enqueued job to BullMQ: webhookId=${data.webhookId} shop=${data.shop} topic=${data.topic}`);
        return { enqueued: true };

    } catch (err: any) {
        // In BullMQ, if a job with the same jobId already exists or was recently added, handle gracefully
        if (err?.message?.includes("job with ID") || err?.message?.includes("already exists")) {
            console.warn(`[Queue] ⚠️ Duplicate webhook job ignored by BullMQ: webhookId=${data.webhookId}`);
            return { enqueued: false, duplicate: true };
        }

        console.error(`[Queue] ❌ Failed to enqueue BullMQ job for webhookId=${data.webhookId}:`, err);
        return { enqueued: false, error: err };
    }
}
