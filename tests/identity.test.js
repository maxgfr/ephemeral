import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHost, loadHost, makeVerifier, verifyHello } from '../room/identity.js'
import { fullStore, memoryStorage, memoryStore } from './helpers.js'

test('createHost derives a 20-hex roomId and loadHost restores the key', async () => {
  const storage = memoryStore()
  const roomId = await createHost(storage)
  assert.match(roomId, /^[0-9a-f]{20}$/)
  const host = await loadHost(roomId, storage)
  assert.ok(host)
  assert.match(host.pub, /^04[0-9a-f]{128}$/)
  assert.equal(await loadHost('0'.repeat(20), storage), null)
})

test('a signed payload round-trips through the verifier', async () => {
  const storage = memoryStore()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const verify = await makeVerifier(roomId, host.pub)
  const signed = await host.sign({ seq: 3, poll: null })
  assert.deepEqual(await verify(signed), { seq: 3, poll: null })
})

test('makeVerifier refuses a key that does not hash to the roomId', async () => {
  const storage = memoryStore()
  const roomA = await createHost(storage)
  const roomB = await createHost(storage)
  const hostB = await loadHost(roomB, storage)
  assert.equal(await makeVerifier(roomA, hostB.pub), null)
  assert.equal(await makeVerifier(roomA, 'not hex'), null)
})

test('a tampered payload or signature fails verification', async () => {
  const storage = memoryStore()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const verify = await makeVerifier(roomId, host.pub)
  const signed = await host.sign({ seq: 1, tally: [1, 2] })
  assert.equal(await verify({ ...signed, payload: signed.payload.replace('[1,2]', '[9,2]') }), null)
  const flipped = (signed.sig[0] === 'a' ? 'b' : 'a') + signed.sig.slice(1)
  assert.equal(await verify({ ...signed, sig: flipped }), null)
  assert.equal(await verify({ payload: signed.payload, sig: 'zz' }), null)
})

test('a state signed by another room key is rejected', async () => {
  const storage = memoryStore()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const other = await loadHost(await createHost(storage), storage)
  const verify = await makeVerifier(roomId, host.pub)
  assert.equal(await verify(await other.sign({ seq: 99 })), null)
})

test('hello is bound to the sender peerId', async () => {
  const storage = memoryStore()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const hello = await host.hello('peer-host')
  assert.ok(await verifyHello(roomId, hello, 'peer-host'))
  // Someone relaying the host's hello from their own connection
  assert.equal(await verifyHello(roomId, hello, 'peer-mallory'), null)
  // Wrong room
  assert.equal(await verifyHello('f'.repeat(20), hello, 'peer-host'), null)
  // Garbage
  assert.equal(await verifyHello(roomId, { pub: 1 }, 'peer-host'), null)
  assert.equal(await verifyHello(roomId, null, 'peer-host'), null)
})

test('verifyHello returns a verifier usable for later states', async () => {
  const storage = memoryStore()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const verify = await verifyHello(roomId, await host.hello('p1'), 'p1')
  assert.deepEqual(await verify(await host.sign({ seq: 7 })), { seq: 7 })
})

test('the private key is stored non-extractable, never in localStorage', async () => {
  const keys = memoryStore()
  const legacy = memoryStorage()
  const roomId = await createHost(keys)
  const saved = keys.map.get(`ephemeral-host-${roomId}`)
  assert.ok(saved.privateKey instanceof CryptoKey)
  assert.equal(saved.privateKey.extractable, false)
  assert.ok(await loadHost(roomId, keys, legacy))
  assert.equal(legacy.getItem(`ephemeral-host-${roomId}`), null)
})

// What earlier versions wrote: the private key as a JWK, in clear.
async function legacyHost(legacy) {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const pubRaw = await crypto.subtle.exportKey('raw', kp.publicKey)
  const roomId = Buffer.from(await crypto.subtle.digest('SHA-256', pubRaw)).toString('hex').slice(0, 20)
  const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey)
  legacy.setItem(`ephemeral-host-${roomId}`, JSON.stringify({ privJwk, pub: Buffer.from(pubRaw).toString('hex') }))
  return roomId
}

test('a key left in localStorage by an earlier version is moved, then erased', async () => {
  const keys = memoryStore()
  const legacy = memoryStorage()
  const roomId = await legacyHost(legacy)
  const host = await loadHost(roomId, keys, legacy)
  assert.ok(host)
  assert.equal(legacy.getItem(`ephemeral-host-${roomId}`), null)
  assert.equal(keys.map.get(`ephemeral-host-${roomId}`).privateKey.extractable, false)
  // Still the same room: its states verify against the room ID.
  const verify = await makeVerifier(roomId, host.pub)
  assert.deepEqual(await verify(await host.sign({ seq: 1 })), { seq: 1 })
  // And the next load finds it in the new place.
  assert.ok(await loadHost(roomId, keys, memoryStorage()))
})

test('the clear copy stays when the new store refuses it, so the room is not lost', async () => {
  const legacy = memoryStorage()
  const roomId = await legacyHost(legacy)
  assert.ok(await loadHost(roomId, fullStore(), legacy))
  assert.notEqual(legacy.getItem(`ephemeral-host-${roomId}`), null)
})

test('createHost rejects when the key cannot be stored', async () => {
  await assert.rejects(createHost(fullStore()))
})
