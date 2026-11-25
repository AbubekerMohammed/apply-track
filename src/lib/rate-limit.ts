/**
 * Minimal fixed-window rate limiter kept in process memory.
 *
 * Best-effort only: each server instance (or serverless isolate) keeps its own
 * counts and they reset on restart. Good enough to blunt hammering of a single
 * endpoint; not a substitute for a shared store if strict limits are needed.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    /** Records a hit for `key`; returns false once the key is over its limit. */
    check(key: string, now: number = Date.now()): boolean {
      // Drop finished windows so the map can't grow without bound.
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
  };
}

/** Best-effort client IP for rate-limit keys (first hop of x-forwarded-for). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
