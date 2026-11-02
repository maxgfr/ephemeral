// The presenter's polls and questions, kept per room in IndexedDB so a reload
// gives them back. Earlier versions kept them in localStorage under the same
// key: that copy is moved over once, then removed (it is this app's own).
import { idbStore } from './db.js'
import { stateKey } from './protocol.js'

export async function loadRoom(roomId, rooms = idbStore('rooms'), legacy = globalThis.localStorage) {
  const saved = await rooms.get(stateKey(roomId)).catch(() => undefined)
  if (saved && typeof saved === 'object') return saved
  let old
  try {
    old = JSON.parse(legacy?.getItem(stateKey(roomId)) ?? 'null')
  } catch {
    return {}
  }
  if (!old || typeof old !== 'object') return {}
  if (await saveRoom(roomId, old, rooms)) {
    try {
      legacy.removeItem(stateKey(roomId))
    } catch {}
  }
  return old
}

// true once the state is on disk; false when the browser refused it.
export async function saveRoom(roomId, state, rooms = idbStore('rooms')) {
  try {
    await rooms.set(stateKey(roomId), state)
    return true
  } catch {
    return false
  }
}
