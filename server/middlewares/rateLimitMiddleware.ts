import { Request, Response, NextFunction } from "express";
import { redis } from "../db/redisClient";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email?: string;
    // ...other user properties
  };
}

export const rateLimitMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(`[RateLimit] Incoming request from userId:`, req.user?.userId);
    // Skip rate limiting if user is not authenticated (should not happen with authMiddleware before this)
    if (!req.user?.userId) {
      console.warn("⚠️ Rate limiting skipped - no user ID found");
      return next();
    }

    const userId = req.user.userId.toString();
    const rateLimitKey = `rate_limit:${userId}`;
    const blockKey = `blocked:${userId}`;
    console.log(`[RateLimit] Keys:`, { rateLimitKey, blockKey });

    // Check if user is currently blocked
    const isBlocked = await redis.get(blockKey);
    console.log(`[RateLimit] Block status for userId ${userId}:`, isBlocked);
    if (isBlocked) {
      const ttl = await redis.ttl(blockKey);
      const minutesLeft = ttl ? Math.ceil(ttl / 60) : 60;
      console.log(
        `[RateLimit] User ${userId} is blocked for ${minutesLeft} minutes (TTL: ${ttl})`
      );
      res.status(429).json({
        error: "Rate limit exceeded",
        message: `API access blocked. You made too many requests. Try again in ${minutesLeft} minutes.`,
        blocked: true,
        minutesLeft,
        retryAfter: ttl || 3600,
      });
      return;
    }

    // Increment the request counter
    const requestCount = await redis.incr(rateLimitKey);
    console.log(
      `[RateLimit] Request count for userId ${userId}:`,
      requestCount
    );

    // If this is the first request in the window, set expiration
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 10); // 10 seconds window
      console.log(
        `[RateLimit] Set expiration for key ${rateLimitKey} to 10 seconds.`
      );
    }

    // Check if rate limit is exceeded (100 requests per 10 seconds)
    if (requestCount !== null && requestCount > 100) {
      console.warn(
        `🚨 Rate limit exceeded for user ${userId}: ${requestCount} requests in 10s`
      );
      // Block the user for 60 minutes (3600 seconds)
      await redis.set(blockKey, "1", { EX: 3600 });
      console.log(`[RateLimit] User ${userId} blocked for 60 minutes.`);
      // Clear the rate limit counter
      await redis.set(rateLimitKey, "0", { EX: 1 });
      console.log(`[RateLimit] Rate limit counter reset for userId ${userId}.`);
      res.status(429).json({
        error: "Rate limit exceeded",
        message:
          "You have made too many API requests (100+ in 10 seconds). Your access is blocked for 60 minutes.",
        blocked: true,
        minutesLeft: 60,
        retryAfter: 3600,
        requestCount,
      });
      return;
    }

    // Add rate limit headers for client information
    const ttl = await redis.ttl(rateLimitKey);
    const remainingRequests = Math.max(0, 100 - (requestCount || 0));
    console.log(
      `[RateLimit] Remaining requests for userId ${userId}:`,
      remainingRequests,
      `TTL: ${ttl}`
    );

    res.set({
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": remainingRequests.toString(),
      "X-RateLimit-Reset": ttl ? (Date.now() + ttl * 1000).toString() : "",
      "X-RateLimit-Window": "10",
    });

    // Log rate limiting activity for monitoring
    if (requestCount && requestCount > 80) {
      console.warn(
        `⚠️ User ${userId} approaching rate limit: ${requestCount}/100 requests in current window`
      );
    }

    next();
  } catch (error) {
    console.error("❌ Rate limiting middleware error:", error);
    // If Redis fails, allow the request to proceed (fail open)
    console.warn(
      "⚠️ Rate limiting disabled due to Redis error - allowing request"
    );
    next();
  }
};
