import { createClient } from "redis";

export const redis = createClient({ url: "redis://localhost:6380" });

redis.on("error", (err) => console.error("Redis error", err));
await redis.connect(); // make sure you connect before using it
