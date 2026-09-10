import type { ConnectionOptions } from "bullmq";

/**
 * Shared Redis connection options for BullMQ Queue and Worker
 */
export function getRedisConnection(): ConnectionOptions {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    try {
        const parsed = new URL(redisUrl);
        return {
            host: parsed.hostname || "localhost",
            port: parsed.port ? parseInt(parsed.port, 10) : 6379,
            password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
            username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
            db: parsed.pathname && parsed.pathname.length > 1
                ? parseInt(parsed.pathname.replace(/^\//, ""), 10)
                : 0,
            maxRetriesPerRequest: null, // Required by BullMQ
            enableReadyCheck: false,
        };
    } catch (err) {
        console.warn(`[Redis] ⚠️ Could not parse REDIS_URL ("${redisUrl}"), falling back to localhost:6379:`, err);
        return {
            host: "localhost",
            port: 6379,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        };
    }
}
