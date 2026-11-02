// Presenter identity. The presenter's browser holds an ECDSA P-256 key pair;
// the room ID is the first 20 hex chars of SHA-256(public key). The audience
// checks that the announced key hashes to the room ID in the URL, then checks
// every signature. Nobody without the private key can speak for the room.
//
// The private key is non-extractable and lives in IndexedDB (room/db.js).
// Earlier versions kept it as a JWK, in clear, in localStorage, where any
// script on the shared maxgfr.github.io origin could read it: loadHost moves
// such a key over and erases the clear copy once the new one is stored.
import { hex, fromHex } from '../core/ids.js'
import { idbStore } from './db.js'

const ALGO = { name: 'ECDSA', namedCurve: 'P-256' }
const SIGN = { name: 'ECDSA', hash: 'SHA-256' }
const enc = new TextEncoder()
const keyName = roomId => `ephemeral-host-${roomId}`

const roomIdOf = async pubRaw => hex(await crypto.subtle.digest('SHA-256', pubRaw)).slice(0, 20)

// Rejects when the key cannot be stored: without it a reload loses the room.
export async function createHost(keys = idbStore('keys')) {
  const kp = await crypto.subtle.generateKey(ALGO, false, ['sign', 'verify'])
  const pubRaw = await crypto.subtle.exportKey('raw', kp.publicKey)
  const roomId = await roomIdOf(pubRaw)
  await keys.set(keyName(roomId), { privateKey: kp.privateKey, pub: hex(pubRaw) })
  return roomId
}

// A key from localStorage, imported as non-extractable. The clear copy is
// erased only once the new one is stored: losing both would lose the room.
async function migrateHost(roomId, keys, legacy) {
  let old
  try {
    old = JSON.parse(legacy?.getItem(keyName(roomId)) ?? 'null')
  } catch {
    return null
  }
  if (!old?.privJwk || typeof old.pub !== 'string') return null
  const privateKey = await crypto.subtle.importKey('jwk', old.privJwk, ALGO, false, ['sign'])
  const saved = { privateKey, pub: old.pub }
  try {
    await keys.set(keyName(roomId), saved)
    legacy.removeItem(keyName(roomId))
  } catch {}
  return saved
}

export async function loadHost(roomId, keys = idbStore('keys'), legacy = globalThis.localStorage) {
  const saved = (await keys.get(keyName(roomId)).catch(() => undefined)) ?? (await migrateHost(roomId, keys, legacy))
  if (!(saved?.privateKey instanceof CryptoKey) || typeof saved.pub !== 'string') return null
  const key = saved.privateKey

  // Sign the JSON string itself and ship it as-is: no key-order ambiguity
  // when the other side verifies.
  async function sign(obj) {
    const payload = JSON.stringify(obj)
    const sig = await crypto.subtle.sign(SIGN, key, enc.encode(payload))
    return { payload, sig: hex(sig) }
  }

  return {
    pub: saved.pub,
    sign,
    // Bound to our peerId so a peer relaying it from another connection fails.
    async hello(peerId) {
      return { pub: saved.pub, ...(await sign({ peerId, t: Date.now() })) }
    },
  }
}

export async function makeVerifier(roomId, pubHex) {
  let pubRaw, key
  try {
    pubRaw = fromHex(pubHex)
    if ((await roomIdOf(pubRaw)) !== roomId) return null // not this room's host
    key = await crypto.subtle.importKey('raw', pubRaw, ALGO, false, ['verify'])
  } catch {
    return null
  }
  return async ({ payload, sig } = {}) => {
    try {
      if (typeof payload !== 'string') return null
      const ok = await crypto.subtle.verify(SIGN, key, fromHex(sig), enc.encode(payload))
      return ok ? JSON.parse(payload) : null
    } catch {
      return null
    }
  }
}

// Returns a verifier for this room's states when `msg` is a valid hello from
// `senderPeerId`, otherwise null.
export async function verifyHello(roomId, msg, senderPeerId) {
  if (!msg || typeof msg.pub !== 'string') return null
  const verify = await makeVerifier(roomId, msg.pub)
  if (!verify) return null
  const body = await verify(msg)
  return body?.peerId === senderPeerId ? verify : null
}
