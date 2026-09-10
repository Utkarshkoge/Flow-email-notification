import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { getRedisConnection } from "./app/services/queue/connection.server";
import {
    SHOPIFY_WEBHOOK_QUEUE_NAME,
    type ShopifyWebhookJobData,
} from "./app/services/queue/webhookQueue.server";
import { processWebhookEvent } from "./app/services/webhookProcessor.server";

console.log("─────────────────────────────────────────────────────────────");
console.log("📦 Shopify Webhook BullMQ Worker Service");
console.log("─────────────────────────────────────────────────────────────");

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "5", 10);
const redisConnection = getRedisConnection();
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

console.log(`[Worker] Configuration:`);
console.log(`[Worker]   Queue: ${SHOPIFY_WEBHOOK_QUEUE_NAME}`);
console.log(`[Worker]   Concurrency: ${concurrency}`);
console.log(`[Worker]   Redis URL: ${redisUrl}`);

/**
 * Instantiate BullMQ Worker
 */
const worker = new Worker<ShopifyWebhookJobData, void, string>(
    SHOPIFY_WEBHOOK_QUEUE_NAME,
    async (job: Job<ShopifyWebhookJobData>) => {
        const { webhookId, shop, topic } = job.data;
        const attempt = job.attemptsMade + 1;
        console.log(`[Worker] 🚀 Processing job #${job.id}: webhookId=${webhookId} shop=${shop} topic=${topic} (attempt ${attempt})`);

        await processWebhookEvent(job.data);
    },
    {
        connection: redisConnection,
        concurrency,
    }
);

// Worker Lifecycle Events
worker.on("completed", (job) => {
    console.log(`[Worker] ✅ Job #${job.id} COMPLETED (webhookId=${job.data.webhookId})`);
});

worker.on("failed", (job, err) => {
    if (!job) {
        console.error(`[Worker] ❌ Worker job failed without job context:`, err);
        return;
    }

    const { webhookId } = job.data;
    const maxAttempts = job.opts.attempts || 3;
    const currentAttempt = job.attemptsMade;

    console.error(`[Worker] ❌ Job #${job.id} FAILED (attempt ${currentAttempt}/${maxAttempts}) for webhookId=${webhookId}:`, err.message);

    if (currentAttempt >= maxAttempts) {
        console.error(`[Worker] 🚫 Max retry attempts exhausted for webhookId=${webhookId}.`);
    } else {
        console.log(`[Worker] 🔄 Retry scheduled by BullMQ with exponential backoff...`);
    }
});

worker.on("error", (err) => {
    console.error("[Worker] ⚠️ BullMQ Worker connection/system error:", err.message);
});

console.log("[Worker] 🟢 BullMQ Worker is active and listening for jobs.");

// Graceful Shutdown
const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}. Shutting down worker gracefully...`);
    try {
        await worker.close();
        console.log("[Worker] 🛑 Worker closed cleanly. Exiting.");
        process.exit(0);
    } catch (err) {
        console.error("[Worker] Error during shutdown:", err);
        process.exit(1);
    }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
