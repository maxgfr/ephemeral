import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hex, fromHex, sha256Hex, randomId } from '../core/ids.js'

test('hex encodes bytes as lowercase, zero-padded pairs', () => {
  assert.equal(hex(new Uint8Array([0, 1, 15, 16, 255])), '00010f10ff')
  assert.equal(hex(new Uint8Array([0xab, 0xcd]).buffer), 'abcd')
})

test('fromHex is the inverse of hex', () => {
  const bytes = new Uint8Array([0, 7, 128, 255])
  assert.deepEqual(fromHex(hex(bytes)), bytes)
})

test('fromHex rejects malformed input', () => {
  assert.throws(() => fromHex('abc'))
  assert.throws(() => fromHex('zz'))
  assert.throws(() => fromHex(42))
})

test('sha256Hex matches a known vector', async () => {
  assert.equal(
    await sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})

test('randomId returns n random bytes as hex', () => {
  assert.match(randomId(), /^[0-9a-f]{16}$/)
  assert.match(randomId(4), /^[0-9a-f]{8}$/)
  assert.notEqual(randomId(), randomId())
})
