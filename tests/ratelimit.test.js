import { test } from 'node:test'
import assert from 'node:assert/strict'
import { limiter } from '../core/ratelimit.js'

const clock = () => {
  let t = 0
  const now = () => t
  now.advance = ms => { t += ms }
  return now
}

test('allows a full burst, then refuses', () => {
  const now = clock()
  const allow = limiter(4, 8, now)
  for (let i = 0; i < 8; i++) assert.equal(allow('a'), true)
  assert.equal(allow('a'), false)
})

test('refills at `rate` tokens per second', () => {
  const now = clock()
  const allow = limiter(4, 8, now)
  for (let i = 0; i < 8; i++) allow('a')
  now.advance(250)
  assert.equal(allow('a'), true)
  assert.equal(allow('a'), false)
  now.advance(1000)
  for (let i = 0; i < 4; i++) assert.equal(allow('a'), true)
  assert.equal(allow('a'), false)
})

test('never refills past the burst size', () => {
  const now = clock()
  const allow = limiter(1, 3, now)
  now.advance(60_000)
  for (let i = 0; i < 3; i++) assert.equal(allow('a'), true)
  assert.equal(allow('a'), false)
})

test('keys are independent', () => {
  const now = clock()
  const allow = limiter(1, 1, now)
  assert.equal(allow('a'), true)
  assert.equal(allow('a'), false)
  assert.equal(allow('b'), true)
})

test('forget drops a bucket so it starts full again', () => {
  const now = clock()
  const allow = limiter(1, 1, now)
  allow('a')
  assert.equal(allow('a'), false)
  allow.forget('a')
  assert.equal(allow.size, 0)
  assert.equal(allow('a'), true)
})
