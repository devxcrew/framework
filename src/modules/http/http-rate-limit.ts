import type { RateLimitOptions } from "./http-security.provider.js";

export function createLimiter(options: RateLimitOptions) {
  const maxEntries = options.maxEntries ?? 10_000;
  const clients = new Map<string, { count: number; resetAt: number }>();
  return (address: string) => {
    const now = Date.now();
    for (const [key, record] of clients)
      if (record.resetAt <= now) clients.delete(key);
    let record = clients.get(address);
    if (!record) {
      if (clients.size >= maxEntries) return Math.ceil(options.windowMs / 1000);
      record = { count: 0, resetAt: now + options.windowMs };
      clients.set(address, record);
    }
    if (record.count >= options.limit)
      return Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    record.count++;
    return 0;
  };
}

export function validateRateLimit(options: RateLimitOptions) {
  const maxEntries = options.maxEntries ?? 10_000;
  if (
    !Number.isSafeInteger(options.limit) ||
    options.limit < 1 ||
    !Number.isSafeInteger(options.windowMs) ||
    options.windowMs < 1 ||
    !Number.isSafeInteger(maxEntries) ||
    maxEntries < 1 ||
    maxEntries > 100_000
  )
    throw new Error("Invalid rate limit.");
}
