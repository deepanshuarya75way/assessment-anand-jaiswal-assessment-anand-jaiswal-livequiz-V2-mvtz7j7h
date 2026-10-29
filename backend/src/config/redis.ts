import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URI || "redis://localhost:6379";

const redisClient = createClient({
  url: REDIS_URL,
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
});

export default redisClient;
