import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from '../room/store.js'

test('one vote per peer, and a revote replaces the previous one', () => {
  const s = createStore()
  const poll = s.openPoll('Rust?', ['Yes', 'No', 'Maybe'])
  assert.equal(s.vote('a', { pollId: poll.id, option: 0 }), true)
  assert.equal(s.vote('b', { pollId: poll.id, option: 0 }), true)
  assert.deepEqual(s.tally(), [2, 0, 0])
  assert.equal(s.vote('a', { pollId: poll.id, option: 2 }), true)
  assert.deepEqual(s.tally(), [1, 0, 1])
  assert.equal(s.vote('a', { pollId: poll.id, option: 2 }), false) // no change
})

test('votes for another poll, a closed poll or an invalid option are ignored', () => {
  const s = createStore()
  const p1 = s.openPoll('One?', ['a', 'b'])
  assert.equal(s.vote('a', { pollId: 'nope', option: 0 }), false)
  assert.equal(s.vote('a', { pollId: p1.id, option: 2 }), false)
  s.closePoll()
  assert.equal(s.vote('a', { pollId: p1.id, option: 0 }), false)
  const p2 = s.openPoll('Two?', ['c', 'd'])
  assert.notEqual(p2.id, p1.id)
  assert.deepEqual(s.tally(), [0, 0]) // new poll starts empty
})

test('questions: dedupe by id, one upvote per peer', () => {
  const s = createStore()
  assert.equal(s.ask('a', { id: 'q1', text: 'First' }), true)
  assert.equal(s.ask('a', { id: 'q1', text: 'Again' }), false)
  assert.equal(s.upvote('b', { questionId: 'q1' }), true)
  assert.equal(s.upvote('b', { questionId: 'q1' }), false)
  assert.equal(s.upvote('c', { questionId: 'missing' }), false)
  assert.equal(s.snapshot().questions[0].votes, 1)
})

test('snapshot sorts by votes, puts answered last and drops hidden ones', () => {
  const s = createStore()
  s.ask('a', { id: 'q1', text: 'low' })
  s.ask('a', { id: 'q2', text: 'high' })
  s.ask('a', { id: 'q3', text: 'answered' })
  s.ask('a', { id: 'q4', text: 'spam' })
  for (const p of ['x', 'y']) s.upvote(p, { questionId: 'q2' })
  for (const p of ['x', 'y', 'z']) s.upvote(p, { questionId: 'q3' })
  s.setAnswered('q3', true)
  s.setHidden('q4', true)
  const ids = s.snapshot().questions.map(q => q.id)
  assert.deepEqual(ids, ['q2', 'q1', 'q3'])
  assert.equal(s.snapshot().questions.at(-1).answered, true)
})

test('snapshot increments seq and never leaks peer ids', () => {
  const s = createStore()
  s.openPoll('Q', ['a', 'b'])
  s.vote('peer-secret', { pollId: s.snapshot().poll.id, option: 1 })
  s.ask('peer-secret', { id: 'q1', text: 'hi' })
  const a = s.snapshot()
  const b = s.snapshot()
  assert.equal(b.seq, a.seq + 1)
  assert.equal(JSON.stringify(b).includes('peer-secret'), false)
})

test('toJSON / createStore(saved) round-trips, seq included', () => {
  const s = createStore()
  const poll = s.openPoll('Q', ['a', 'b'])
  s.vote('a', { pollId: poll.id, option: 1 })
  s.ask('a', { id: 'q1', text: 'hi' })
  s.upvote('b', { questionId: 'q1' })
  s.snapshot()
  const restored = createStore(JSON.parse(JSON.stringify(s.toJSON())))
  assert.deepEqual(restored.tally(), [0, 1])
  assert.equal(restored.upvote('b', { questionId: 'q1' }), false)
  assert.equal(restored.snapshot().seq, s.snapshot().seq)
})

test('createStore tolerates corrupt saved data', () => {
  assert.doesNotThrow(() => createStore({ questions: 'nope', seq: 'x' }))
  assert.equal(createStore({ seq: 'x' }).snapshot().seq, 1)
})

test('per-peer question cap keeps one peer from flooding the list', () => {
  const s = createStore()
  let accepted = 0
  for (let i = 0; i < 30; i++) accepted += s.ask('flood', { id: `q${i}`, text: 'spam' })
  assert.equal(accepted, 10)
})
