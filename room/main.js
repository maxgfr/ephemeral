// Single entry point. The URL is the same for everyone: #<roomId>. Holding
// the room's private key in this browser makes you the presenter; anyone
// else is audience.
import { h } from './dom.js'
import { icons } from './icons.js'
import { createHost, loadHost } from './identity.js'

const app = document.getElementById('app')
const ROOM_ID = /^[0-9a-f]{20}$/

addEventListener('hashchange', () => location.reload())

function screen(title, body, actions) {
  const canvas = h('canvas', { class: 'fog', 'aria-hidden': 'true' })
  const gate = h('main', { class: 'gate' },
    canvas,
    h('a', { class: 'mark', href: '../' }, h('span', { class: 'mark-dot', 'aria-hidden': 'true' }), 'Ephemeral'),
    h('div', { class: 'gate-body' }, h('h1', {}, title), ...body.map(p => h('p', {}, p)), h('div', { class: 'gate-actions' }, actions)),
  )
  app.replaceChildren(gate)
  // The same glass as the landing page: wipe it with the pointer.
  import('../core/fog.js').then(({ createFog }) => {
    const fog = createFog(canvas)
    let last = null
    gate.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' && !e.buttons) return
      const r = gate.getBoundingClientRect()
      const p = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
      fog.wipe(last ? [last, p] : [p])
      last = p
    })
    gate.addEventListener('pointerleave', () => (last = null))
  })
}

const createButton = label =>
  h('a', { class: 'btn', href: '#new', html: `${label} ${icons.arrow}` })

async function route() {
  const hash = location.hash.slice(1)

  if (!globalThis.crypto?.subtle || !globalThis.RTCPeerConnection) {
    return screen('This page needs a secure connection.', [
      'Rooms use your browser’s cryptography and WebRTC, which only work over HTTPS (or on localhost). Open the HTTPS address of this page instead.',
    ])
  }

  if (hash === 'new') {
    const roomId = await createHost()
    history.replaceState(null, '', `#${roomId}`)
    return route()
  }

  if (!hash) {
    return screen('Start a room for your talk.', [
      'Your screen shows a QR code. People join on their phones, send reactions, vote in your polls and ask questions. You stay the only one who can open a poll.',
      'Nothing is stored anywhere but this browser. Joining someone else’s room? Scan the code on their screen.',
    ], [createButton('Create a room'), h('a', { class: 'btn btn-quiet', href: '../' }, 'What is this?')])
  }

  if (!ROOM_ID.test(hash)) {
    return screen('This room link looks broken.', [
      'Room links end with a 20-character code. Check that the whole link was copied, or start a new room.',
    ], [createButton('Create a room')])
  }

  const host = await loadHost(hash).catch(() => null)
  if (host) {
    const { startHost } = await import('./host.js')
    startHost(app, hash, host)
  } else {
    const { startAudience } = await import('./audience.js')
    startAudience(app, hash)
  }
}

route().catch(err => {
  console.error(err)
  screen('The room could not start.', [
    'A script failed to load, often because a network or an extension blocks the CDN this page uses. Try another network or disable blockers for this page.',
  ], [h('button', { class: 'btn', type: 'button', onclick: () => location.reload() }, 'Try again')])
})
