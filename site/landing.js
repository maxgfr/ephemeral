import { createFog, spotFor } from '../core/fog.js'
import { limiter } from '../core/ratelimit.js'
import { splitEmojis, DEFAULT_REACTIONS } from '../core/emoji.js'

const pane = document.querySelector('.pane')
const fog = createFog(pane.querySelector('.fog'))
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

// Re-read the frost colours when the OS theme flips.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => fog.refresh())

/* ---------- Wiping the glass ---------- */

const outbox = []
let lastPoint = null

function toPane(e) {
  const r = pane.getBoundingClientRect()
  return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
}

function wipeAt(p) {
  fog.wipe(lastPoint ? [lastPoint, p] : [p])
  lastPoint = p
  outbox.push(p.map(v => Math.round(v * 1000) / 1000))
  pane.dataset.wiped = ''
}

pane.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' && !e.buttons) return
  wipeAt(toPane(e))
})
pane.addEventListener('pointerdown', e => {
  lastPoint = null
  wipeAt(toPane(e))
})
pane.addEventListener('pointerleave', () => (lastPoint = null))
pane.addEventListener('pointerup', e => e.pointerType !== 'mouse' && (lastPoint = null))

// The one authored moment: a finger drawn once across the headline.
function introStroke() {
  if (reduceMotion.matches) return
  const pr = pane.getBoundingClientRect()
  const tr = document.querySelector('.hero-title').getBoundingClientRect()
  const y0 = (tr.top - pr.top + tr.height * 0.35) / pr.height
  const y1 = (tr.top - pr.top + tr.height * 0.7) / pr.height
  const x0 = (tr.left - pr.left - 20) / pr.width
  const x1 = (tr.right - pr.left + 40) / pr.width
  const start = performance.now()
  const dur = 1500
  let prev = null
  const step = t => {
    const k = Math.min(1, (t - start) / dur)
    const e = 1 - (1 - k) ** 3
    const p = [x0 + (x1 - x0) * e, y0 + (y1 - y0) * e + Math.sin(e * Math.PI * 2) * 0.02]
    fog.wipe(prev ? [prev, p] : [p], 1.5)
    prev = p
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
document.fonts.ready.then(() => setTimeout(introStroke, 350))

/* ---------- Other people on the same glass ---------- */

const countEl = document.querySelector('.glass-count')
const countText = document.querySelector('.glass-count-text')

const validStroke = d =>
  Array.isArray(d) &&
  d.length > 0 &&
  d.length <= 32 &&
  d.every(p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && v >= 0 && v <= 1))

async function joinPane() {
  let openRoom
  try {
    ;({ openRoom } = await import('../core/mesh.js'))
  } catch {
    countText.textContent = 'The live demo needs a network that allows WebRTC and WebSockets.'
    return
  }
  const mesh = openRoom('landing-pane')
  const wipes = mesh.action('wipe')
  const canReceive = limiter(15, 20)

  const render = () => {
    const n = mesh.peers.size
    countEl.dataset.state = n ? 'live' : 'alone'
    countText.textContent = n
      ? `You and ${n} ${n === 1 ? 'other person' : 'others'} on this glass right now.`
      : 'Just you on this glass. Open a second tab to see someone else wipe it.'
  }

  mesh.onJoin(id => {
    fog.setPrint(id, spotFor(id, { x0: 0.6, x1: 0.92, y0: 0.22, y1: 0.78 }))
    render()
  })
  mesh.onLeave(id => {
    fog.removePrint(id)
    canReceive.forget(id)
    render()
  })
  mesh.onError(() => (countText.textContent = 'Could not join the demo pane. Try reloading.'))
  wipes.on((stroke, peerId) => {
    if (validStroke(stroke) && canReceive(peerId)) fog.wipe(stroke, 0.85)
  })

  setInterval(() => {
    if (!outbox.length || !mesh.peers.size) return (outbox.length = 0)
    wipes.send(outbox.splice(0, 32))
  }, 90)

  render()
}
joinPane()

/* ---------- Embed builder ---------- */

const CANDIDATES = ['👏', '🔥', '❤️', '😂', '🤔', '🎉', '👍', '🤯', '👀', '💡', '🙏', '🚀']
const MAX = 8
const selected = [...DEFAULT_REACTIONS]
const chips = document.getElementById('chips')
const snippet = document.getElementById('snippet')
const emojiCount = document.getElementById('emoji-count')
const builder = document.getElementById('builder')
const custom = document.getElementById('custom-emoji')
const copyBtn = document.getElementById('copy')
const widgetUrl = new URL('widget/ephemeral.js', location.href).href

function renderChips() {
  const all = [...CANDIDATES, ...selected.filter(e => !CANDIDATES.includes(e))]
  chips.replaceChildren(
    ...all.map(e => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'chip'
      b.textContent = e
      b.setAttribute('aria-pressed', String(selected.includes(e)))
      b.setAttribute('aria-label', e)
      b.addEventListener('click', () => toggle(e))
      return b
    }),
  )
  emojiCount.textContent = `${selected.length} of ${MAX}`
}

function toggle(e) {
  const i = selected.indexOf(e)
  if (i >= 0) {
    if (selected.length > 1) selected.splice(i, 1)
  } else if (selected.length < MAX) {
    selected.push(e)
  }
  renderChips()
  renderSnippet()
}

custom.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter') return
  ev.preventDefault()
  // splitEmojis falls back to the defaults on junk input; keep only what was typed.
  const typed = splitEmojis(custom.value).filter(e => custom.value.includes(e))
  for (const e of typed) if (!selected.includes(e) && selected.length < MAX) selected.push(e)
  custom.value = ''
  renderChips()
  renderSnippet()
})

function renderSnippet() {
  const position = builder.elements.position.value
  const readers = document.getElementById('readers').checked
  const attrs = [`data-reactions="${selected.join('')}"`, `data-position="${position}"`]
  if (!readers) attrs.push('data-readers="false"')
  const code = `<script src="${widgetUrl}" defer\n  ${attrs.join('\n  ')}></script>`
  snippet.textContent = code
  copyBtn.dataset.code = code
}

builder.addEventListener('change', renderSnippet)

copyBtn.addEventListener('click', async () => {
  const label = copyBtn.querySelector('span')
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.code)
    copyBtn.dataset.copied = ''
    label.textContent = 'Copied'
  } catch {
    getSelection().selectAllChildren(snippet)
    label.textContent = 'Press Ctrl+C to copy'
  }
  setTimeout(() => {
    delete copyBtn.dataset.copied
    label.textContent = 'Copy the tag'
  }, 1800)
})

renderChips()
renderSnippet()
