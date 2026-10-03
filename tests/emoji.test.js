import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitEmojis, isAllowed, DEFAULT_REACTIONS } from '../core/emoji.js'

test('splits on graphemes so multi-codepoint emoji stay whole', () => {
  assert.deepEqual(splitEmojis('👏🔥❤️🤔'), ['👏', '🔥', '❤️', '🤔'])
  assert.deepEqual(splitEmojis('👍🏽👩‍💻🇫🇷'), ['👍🏽', '👩‍💻', '🇫🇷'])
})

test('ignores whitespace, commas and plain text', () => {
  assert.deepEqual(splitEmojis(' 👏, 🔥 abc 1 '), ['👏', '🔥'])
})

test('deduplicates and caps the list', () => {
  assert.deepEqual(splitEmojis('🔥🔥👏'), ['🔥', '👏'])
  assert.equal(splitEmojis('😀😁😂🤣😃😄😅😆😉😊😋😎').length, 8)
})

test('falls back to defaults when nothing usable is given', () => {
  assert.deepEqual(splitEmojis(''), DEFAULT_REACTIONS)
  assert.deepEqual(splitEmojis(undefined), DEFAULT_REACTIONS)
  assert.deepEqual(splitEmojis('hello'), DEFAULT_REACTIONS)
})

test('isAllowed only accepts strings from the list', () => {
  const list = ['👏', '❤️']
  assert.equal(isAllowed(list, '❤️'), true)
  assert.equal(isAllowed(list, '💩'), false)
  assert.equal(isAllowed(list, { toString: () => '👏' }), false)
  assert.equal(isAllowed(list, '👏'.repeat(100)), false)
})
