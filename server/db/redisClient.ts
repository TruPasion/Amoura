import { createClient, RedisClientType } from "redis";

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;

  constructor() {
    // Don't connect immediately, only when needed
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected && this.client) {
      return true;
    }

    if (this.isConnecting) {
      // Wait for ongoing connection attempt
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.isConnected;
    }

    if (!this.client) {
      this.client = createClient({ url: "redis://localhost:6379" });

      this.client.on("error", (err) => {
        console.error("Redis error:", err.message);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("✅ Redis connected successfully");
        this.isConnected = true;
        this.isConnecting = false;
      });

      this.client.on("end", () => {
        console.log("🔌 Redis connection closed");
        this.isConnected = false;
      });
    }

    if (!this.isConnected && !this.isConnecting) {
      this.isConnecting = true;
      try {
        await this.client.connect();
        return true;
      } catch (err) {
        console.error("❌ Failed to connect to Redis:", (err as Error).message);
        console.log(
          "⚠️  Operation will continue without Redis. Real-time features may be limited."
        );
        this.isConnecting = false;
        return false;
      }
    }

    return this.isConnected;
  }

  async xAdd(
    key: string,
    id: string,
    data: Record<string, string>
  ): Promise<string | null> {
    const connected = await this.ensureConnection();
    if (!connected || !this.client) {
      console.warn(`⚠️  Redis xAdd operation skipped - Redis not available`);
      return null;
    }

    try {
      return await this.client.xAdd(key, id, data);
    } catch (err) {
      console.error("❌ Redis xAdd failed:", (err as Error).message);
      this.isConnected = false;
      return null;
    }
  }

  async xDel(key: string, id: string): Promise<number> {
    const connected = await this.ensureConnection();
    if (!connected || !this.client) {
      console.warn(`⚠️  Redis xDel operation skipped - Redis not available`);
      return 0;
    }

    try {
      return await this.client.xDel(key, id);
    } catch (err) {
      console.error("❌ Redis xDel failed:", (err as Error).message);
      this.isConnected = false;
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        console.log("✅ Redis disconnected gracefully");
      } catch (err) {
        console.error("❌ Error disconnecting Redis:", (err as Error).message);
      }
    }
    this.isConnected = false;
    this.client = null;
  }
}

export const redis = new RedisClient();
