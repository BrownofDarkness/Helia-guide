import type { MiddlewareHandler } from 'hono';

type Bucket = { hits: number; resetAt: number };

export function rateLimit(opts: {
  windowMs: number;
  max: number;
  keyFn?: (c: Parameters<MiddlewareHandler>[0]) => string;
}): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();
  const keyFn =
    opts.keyFn ??
    ((c) =>
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.env?.incoming?.socket?.remoteAddress ??
      'anon');

  return async (c, next) => {
    const key = keyFn(c);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { hits: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (bucket.hits >= opts.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Trop de requêtes — réessaie plus tard.' }, 429);
    }

    bucket.hits += 1;
    return next();
  };
}
