/**
 * Rate-limiting middleware template for backend routers.
 *
 * This is a lightweight, in-memory token-bucket implementation intended to
 * shield abuse-prone endpoints (auth, messaging) from automated bot spam in
 * a single-instance deployment. For multi-instance production traffic,
 * replace the in-memory `buckets` Map with a shared store (Redis, Durable
 * Objects, KV) using the same interface.
 */

export interface RateLimitConfig {
  /** Unique name for this limiter (used as key namespace). */
  name: string;
  /** Max requests allowed per window per identifier. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Preset configurations for high-risk endpoints. Tune per environment.
 */
export const RATE_LIMITS = {
  auth: { name: "auth", limit: 5, windowMs: 60_000 } satisfies RateLimitConfig,
  messaging: {
    name: "messaging",
    limit: 20,
    windowMs: 60_000,
  } satisfies RateLimitConfig,
  passwordReset: {
    name: "password-reset",
    limit: 3,
    windowMs: 15 * 60_000,
  } satisfies RateLimitConfig,
} as const;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(config: RateLimitConfig, identifier: string): RateLimitResult {
  const key = `${config.name}:${identifier}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + config.windowMs };
    buckets.set(key, fresh);
    return { allowed: true, remaining: config.limit - 1, resetAt: fresh.resetAt };
  }

  if (existing.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Extract a best-effort client identifier from a Request. Prefers the
 * caller's authenticated user id (passed in), then IP-ish headers.
 */
export function getClientIdentifier(request: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return `ip:${fwd.split(",")[0]!.trim()}`;
  const real = request.headers.get("x-real-ip");
  if (real) return `ip:${real}`;
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return `ip:${cf}`;
  return "ip:unknown";
}

/**
 * Convenience helper for router handlers. Throws a Response(429) when the
 * caller exceeds the configured limit; otherwise returns the result.
 */
export function enforceRateLimit(
  config: RateLimitConfig,
  request: Request,
  userId?: string | null,
): RateLimitResult {
  const result = checkRateLimit(config, getClientIdentifier(request, userId));
  if (!result.allowed) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    throw new Response(JSON.stringify({ error: "Too Many Requests", retryAfter }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(config.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    });
  }
  return result;
}
