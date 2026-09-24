import "server-only";

/**
 * Small in-memory limiter, per key (usually the client IP). Enough to stop a
 * careless loop hammering the calendar; not a substitute for the edge WAF.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) ?? "anon";
}
