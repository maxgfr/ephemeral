// Token bucket per key (peerId): `rate` tokens per second, at most `burst`.
// Used on both sides: on send so we never spam by accident, on receive so a
// peer spamming from the console gets ignored.
export function limiter(rate, burst = 1, now = () => performance.now()) {
  const buckets = new Map() // key -> { tokens, last }

  function allow(key) {
    const t = now()
    const b = buckets.get(key) ?? { tokens: burst, last: t }
    b.tokens = Math.min(burst, b.tokens + ((t - b.last) / 1000) * rate)
    b.last = t
    buckets.set(key, b)
    if (b.tokens < 1) return false
    b.tokens -= 1
    return true
  }

  // Call when a peer leaves so buckets don't pile up.
  allow.forget = key => buckets.delete(key)
  Object.defineProperty(allow, 'size', { get: () => buckets.size })
  return allow
}
