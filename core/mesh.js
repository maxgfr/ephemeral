// Thin wrapper over Trystero: tracked presence, several listeners per event,
// cached actions. Trystero 0.25 only allows one handler per event property,
// so everything here fans out to Sets.
import { joinRoom, selfId } from 'https://cdn.jsdelivr.net/npm/trystero@0.25.4/+esm'

export { selfId }

// `options` passes straight to Trystero (relayConfig, turnConfig, password...).
export function openRoom(appId, roomId, options = {}) {
  const peers = new Set()
  const joinFns = new Set()
  const leaveFns = new Set()
  const errorFns = new Set()
  const actions = new Map()

  const room = joinRoom({ appId, ...options }, roomId, {
    onJoinError: details => {
      console.warn('[ephemeral] join error', details)
      errorFns.forEach(f => f(details))
    },
  })

  room.onPeerJoin = id => {
    peers.add(id)
    joinFns.forEach(f => f(id))
  }
  room.onPeerLeave = id => {
    peers.delete(id)
    leaveFns.forEach(f => f(id))
  }

  const listen = set => f => {
    set.add(f)
    return () => set.delete(f)
  }

  return {
    selfId,
    peers, // connected peer IDs, excluding self
    onJoin: listen(joinFns),
    onLeave: listen(leaveFns),
    onError: listen(errorFns),

    action(name) {
      if (actions.has(name)) return actions.get(name)
      const a = room.makeAction(name)
      const handlers = new Set()
      a.onMessage = (data, { peerId }) => handlers.forEach(h => h(data, peerId))
      const wrapped = {
        // A peer can vanish mid-send; that's not an error worth surfacing.
        send: (data, target) => a.send(data, target ? { target } : undefined).catch(() => {}),
        on: listen(handlers),
      }
      actions.set(name, wrapped)
      return wrapped
    },

    leave: () => room.leave(),
  }
}
