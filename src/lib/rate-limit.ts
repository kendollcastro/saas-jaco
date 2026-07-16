const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = store.get(key);

  // Clean stale entries occasionally
  if (store.size > 1000) {
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfter: 0 };
  }

  entry.count += 1;
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxAttempts - entry.count, retryAfter: 0 };
}
