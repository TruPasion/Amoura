# Redis Rate Limiting Implementation

## Overview

This document describes the Redis-based rate limiting system implemented in the project. The system is designed to control API usage per user, preventing abuse and ensuring fair resource allocation.

## Approach

- **Fixed Window Counter**: Each user has a Redis key that counts API calls within a 10-second window.
- **Blocking**: If a user exceeds 100 API calls in 10 seconds, they are blocked for 60 minutes.
- **Redis Data Structures Used**: Simple string keys for counters and blocking flags.

## Redis Keys

- `rate_limit:{userId}`: Stores the number of API calls made by a user in the current 10-second window.
- `blocked:{userId}`: Indicates if a user is currently blocked due to rate limit violation.

## Workflow

1. **API Call**
   - On each API call, increment the counter for `rate_limit:{userId}`.
   - If this is the first call in the window, set the key to expire in 10 seconds.
2. **Rate Limit Check**
   - If the counter exceeds 100, set `blocked:{userId}` with a TTL of 3600 seconds (60 minutes).
   - Reset the counter to zero.
   - Respond to the user with a 429 error and block information.
3. **Blocked User**
   - If `blocked:{userId}` exists, reject all API calls for that user until the block expires.

## RedisClient Methods Used

- `incr(key)`: Increments the API call counter.
- `expire(key, seconds)`: Sets the expiration for the counter key.
- `get(key)`: Checks if the user is blocked.
- `set(key, value, { EX })`: Sets the block key with expiration.
- `ttl(key)`: Gets the remaining time for block or counter keys.

## Example

```typescript
// Increment counter
const requestCount = await redis.incr(`rate_limit:${userId}`);
if (requestCount === 1) {
  await redis.expire(`rate_limit:${userId}`, 10);
}
// Block if exceeded
if (requestCount > 100) {
  await redis.set(`blocked:${userId}`, "blocked", { EX: 3600 });
  await redis.set(`rate_limit:${userId}`, "0", { EX: 1 });
}
```

## Limitations

- **Fixed Window**: Users can burst 100 requests at the start of a window. For more accurate control, a sliding window (using Redis Sorted Sets) is recommended.
- **Fail-Open**: If Redis is unavailable, requests are allowed to proceed.

## Improvements

- **Sliding Window**: Use Redis Sorted Sets for more precise rate limiting.
- **Distributed Rate Limiting**: This approach works across multiple servers as long as they share the same Redis instance.

## References

- [Redis INCR](https://redis.io/commands/incr/)
- [Redis EXPIRE](https://redis.io/commands/expire/)
- [Redis Sorted Sets](https://redis.io/docs/data-types/sorted-sets/)

---
