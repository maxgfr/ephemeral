import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHost, loadHost, makeVerifier, verifyHello } from '../room/identity.js'
import { memoryStorage } from './helpers.js'

test('createHost derives a 20-hex roomId and loadHost restores the key', async () => {
  const storage = memoryStorage()
  const roomId = await createHost(storage)
  assert.match(roomId, /^[0-9a-f]{20}$/)
  const host = await loadHost(roomId, storage)
  assert.ok(host)
  assert.match(host.pub, /^04[0-9a-f]{128}$/)
  assert.equal(await loadHost('0'.repeat(20), storage), null)
})

test('a signed payload round-trips through the verifier', async () => {
  const storage = memoryStorage()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const verify = await makeVerifier(roomId, host.pub)
  const signed = await host.sign({ seq: 3, poll: null })
  assert.deepEqual(await verify(signed), { seq: 3, poll: null })
})

test('makeVerifier refuses a key that does not hash to the roomId', async () => {
  const storage = memoryStorage()
  const roomA = await createHost(storage)
  const roomB = await createHost(storage)
  const hostB = await loadHost(roomB, storage)
  assert.equal(await makeVerifier(roomA, hostB.pub), null)
  assert.equal(await makeVerifier(roomA, 'not hex'), null)
})

test('a tampered payload or signature fails verification', async () => {
  const storage = memoryStorage()
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
  const storage = memoryStorage()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const other = await loadHost(await createHost(storage), storage)
  const verify = await makeVerifier(roomId, host.pub)
  assert.equal(await verify(await other.sign({ seq: 99 })), null)
})

test('hello is bound to the sender peerId', async () => {
  const storage = memoryStorage()
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
  const storage = memoryStorage()
  const roomId = await createHost(storage)
  const host = await loadHost(roomId, storage)
  const verify = await verifyHello(roomId, await host.hello('p1'), 'p1')
  assert.deepEqual(await verify(await host.sign({ seq: 7 })), { seq: 7 })
})
