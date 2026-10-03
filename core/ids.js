// Byte/hex helpers and IDs. Pure: runs in browsers and in Node (tests).

export const hex = buf =>
  [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')

export function fromHex(str) {
  if (typeof str !== 'string' || str.length % 2 || !/^[0-9a-f]*$/i.test(str)) {
    throw new TypeError('invalid hex string')
  }
  const out = new Uint8Array(str.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(str.slice(i * 2, i * 2 + 2), 16)
  return out
}

export async function sha256Hex(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  return hex(await crypto.subtle.digest('SHA-256', bytes))
}

export const randomId = (n = 8) => hex(crypto.getRandomValues(new Uint8Array(n)))
