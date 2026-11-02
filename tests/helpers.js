// In-memory stand-in for localStorage.
export const memoryStorage = () => {
  const m = new Map()
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  }
}

// In-memory stand-in for an IndexedDB store (room/db.js). Values are kept as
// they are, CryptoKeys included, like structured clone would.
export const memoryStore = () => {
  const m = new Map()
  return {
    map: m,
    get: async k => m.get(k),
    set: async (k, v) => void m.set(k, v),
    delete: async k => void m.delete(k),
  }
}

// A store whose writes fail, like a full or blocked IndexedDB.
export const fullStore = () => ({
  get: async () => undefined,
  set: async () => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  },
  delete: async () => {},
})
