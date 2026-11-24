import { createClient } from "redis";

const redis = createClient({
    url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
    console.error("Redis Client Error:", err);
});

let connectionPromise: Promise<void> | null | any = null;

export async function connectRedis() {
    if (redis.isOpen) {
        return redis;
    }

    if (!connectionPromise) {
        connectionPromise = redis.connect().catch((error) => {
            connectionPromise = null;
            throw error;
        });
    }

    await connectionPromise;

    return redis;
}

export default redis;