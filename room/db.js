// The room's IndexedDB. GitHub Pages serves every maxgfr.github.io project
// from one origin, so storage is shared with unrelated apps: the database
// carries the app's name, and it holds what does not belong in localStorage.
//
//   keys   the presenter's private keys, as non-extractable CryptoKeys:
//          structured clone stores them without their bytes ever reaching
//          JavaScript, so a script on the origin cannot read them out
//   rooms  each room's polls and questions (tens of KB at the caps)
const DB_NAME = 'ephemeral'
const STORES = ['keys', 'rooms']

let opening = null

function open() {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      for (const name of STORES) if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB refused to open'))
  }).catch(err => {
    opening = null
    throw err
  })
  return opening
}

// { get, set, delete } over one store. Every call rejects when IndexedDB is
// missing, blocked or full; callers decide what that means.
export function idbStore(name) {
  const run = async (mode, work) => {
    const db = await open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, mode)
      const req = work(tx.objectStore(name))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('IndexedDB request failed'))
    })
  }
  return {
    get: key => run('readonly', s => s.get(key)),
    set: async (key, value) => void (await run('readwrite', s => s.put(value, key))),
    delete: async key => void (await run('readwrite', s => s.delete(key))),
  }
}
