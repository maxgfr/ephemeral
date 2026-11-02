import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadRoom, saveRoom } from '../room/saved.js'
import { fullStore, memoryStorage, memoryStore } from './helpers.js'

const ROOM = 'a'.repeat(20)
const KEY = `ephemeral-state-${ROOM}`

test('a saved room comes back', async () => {
  const rooms = memoryStore()
  assert.equal(await saveRoom(ROOM, { seq: 4, questions: [] }, rooms), true)
  assert.deepEqual(await loadRoom(ROOM, rooms, memoryStorage()), { seq: 4, questions: [] })
})

test('nothing saved, or unreadable, gives an empty room', async () => {
  const legacy = memoryStorage()
  assert.deepEqual(await loadRoom(ROOM, memoryStore(), legacy), {})
  legacy.setItem(KEY, '{not json')
  assert.deepEqual(await loadRoom(ROOM, memoryStore(), legacy), {})
})

test('a room left in localStorage by an earlier version is moved, then erased', async () => {
  const rooms = memoryStore()
  const legacy = memoryStorage()
  legacy.setItem(KEY, JSON.stringify({ seq: 9, history: [] }))
  assert.deepEqual(await loadRoom(ROOM, rooms, legacy), { seq: 9, history: [] })
  assert.equal(legacy.getItem(KEY), null)
  assert.deepEqual(rooms.map.get(KEY), { seq: 9, history: [] })
})

test('a full store says so, and keeps the old copy', async () => {
  const legacy = memoryStorage()
  legacy.setItem(KEY, JSON.stringify({ seq: 2 }))
  assert.deepEqual(await loadRoom(ROOM, fullStore(), legacy), { seq: 2 })
  assert.notEqual(legacy.getItem(KEY), null)
  assert.equal(await saveRoom(ROOM, { seq: 3 }, fullStore()), false)
})
