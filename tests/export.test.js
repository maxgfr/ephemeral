import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCsv } from '../room/export.js'

test('toCsv lists polls with counts and percentages, then questions', () => {
  const csv = toCsv({
    polls: [{ question: 'Rust?', options: ['Yes', 'No'], tally: [3, 1] }],
    questions: [{ text: 'Why?', votes: 2, answered: true }],
  })
  const lines = csv.trim().split('\r\n')
  assert.deepEqual(lines, [
    'section,item,option,votes,share',
    'poll,Rust?,Yes,3,75%',
    'poll,Rust?,No,1,25%',
    'question,Why?,answered,2,',
  ])
})

test('toCsv quotes commas, quotes and newlines', () => {
  const csv = toCsv({ polls: [], questions: [{ text: 'A, "B"\nC', votes: 0, answered: false }] })
  assert.match(csv, /question,"A, ""B""\nC",open,0,/)
})

test('toCsv neutralizes spreadsheet formulas', () => {
  const csv = toCsv({ polls: [], questions: [{ text: '=HYPERLINK("x")', votes: 0, answered: false }] })
  assert.match(csv, /question,"'=HYPERLINK\(""x""\)"/)
})

test('toCsv handles a poll nobody voted in', () => {
  const csv = toCsv({ polls: [{ question: 'Q', options: ['a'], tally: [0] }], questions: [] })
  assert.match(csv, /poll,Q,a,0,0%/)
})
