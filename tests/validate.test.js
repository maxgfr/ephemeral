import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validVote, validAsk, validUpvote, validSigned, validState, validPollDraft, MAX_TEXT } from '../room/validate.js'

test('validVote accepts an id and an integer option', () => {
  assert.deepEqual(validVote({ pollId: 'p1', option: 2 }), { pollId: 'p1', option: 2 })
  assert.equal(validVote({ pollId: 'p1', option: '2' }), null)
  assert.equal(validVote({ pollId: 'p1', option: 1.5 }), null)
  assert.equal(validVote({ pollId: 'p1', option: -1 }), null)
  assert.equal(validVote({ pollId: '<img>', option: 0 }), null)
  assert.equal(validVote('p1'), null)
  assert.equal(validVote(null), null)
})

test('validAsk trims, strips control characters and caps the length', () => {
  assert.deepEqual(validAsk({ id: 'a1b2', text: '  Why Rust?\u0007 ' }), { id: 'a1b2', text: 'Why Rust?' })
  assert.equal(validAsk({ id: 'a1b2', text: 'x'.repeat(MAX_TEXT + 1) }), null)
  assert.ok(validAsk({ id: 'a1b2', text: 'x'.repeat(MAX_TEXT) }))
  assert.equal(validAsk({ id: 'a1b2', text: '   ' }), null)
  assert.equal(validAsk({ id: 'a1b2', text: 42 }), null)
  assert.equal(validAsk({ id: '', text: 'hi' }), null)
  assert.equal(validAsk({ id: 'x'.repeat(40), text: 'hi' }), null)
})

test('validUpvote wants a question id', () => {
  assert.deepEqual(validUpvote({ questionId: 'q1' }), { questionId: 'q1' })
  assert.equal(validUpvote({ questionId: 1 }), null)
  assert.equal(validUpvote({}), null)
})

test('validSigned checks types and sizes before any crypto runs', () => {
  assert.ok(validSigned({ payload: '{}', sig: 'ab'.repeat(64) }))
  assert.equal(validSigned({ payload: '{}', sig: 'nothex' }), null)
  assert.equal(validSigned({ payload: 'x'.repeat(70_000), sig: 'ab' }), null)
  assert.equal(validSigned({ payload: {}, sig: 'ab' }), null)
})

test('validState accepts a well-formed snapshot', () => {
  const s = {
    seq: 4,
    poll: { id: 'p1', question: 'Rust?', options: ['Yes', 'No'], open: true },
    tally: [3, 1],
    questions: [{ id: 'q1', text: 'Why?', votes: 2, answered: false }],
  }
  assert.deepEqual(validState(s), s)
  assert.ok(validState({ seq: 0, poll: null, tally: [], questions: [] }))
})

test('validState rejects wrong shapes', () => {
  const ok = { seq: 1, poll: null, tally: [], questions: [] }
  assert.equal(validState({ ...ok, seq: -1 }), null)
  assert.equal(validState({ ...ok, seq: '1' }), null)
  assert.equal(validState({ ...ok, questions: [{ id: 'q1', text: 5, votes: 0, answered: false }] }), null)
  assert.equal(validState({ ...ok, poll: { id: 'p1', question: 'Q', options: ['only one'], open: true } }), null)
  assert.equal(validState({ ...ok, poll: { id: 'p1', question: 'Q', options: ['a', 'b'], open: true }, tally: [1] }), null)
  assert.equal(validState(null), null)
})

test('validPollDraft wants a question and 2 to 4 non-empty options', () => {
  assert.deepEqual(validPollDraft(' Lunch? ', ['Pizza', ' ', 'Salad ']), { question: 'Lunch?', options: ['Pizza', 'Salad'] })
  assert.equal(validPollDraft('Lunch?', ['Pizza']), null)
  assert.equal(validPollDraft('', ['a', 'b']), null)
  assert.equal(validPollDraft('Q', ['a', 'b', 'c', 'd', 'e']), null)
})

test('validAsk keeps zero-width joiners inside emoji', () => {
  const dev = String.fromCodePoint(0x1f469, 0x200d, 0x1f4bb)
  assert.equal(validAsk({ id: 'q1', text: `Hi ${dev}` }).text, `Hi ${dev}`)
  assert.equal(validAsk({ id: 'q1', text: `a${String.fromCharCode(0x202e)}b` }).text, 'ab')
})
