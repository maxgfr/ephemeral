// Presenter screen. Built for a projector: very high contrast, large type,
// nothing important in small print. The presenter's browser aggregates every
// vote and question, signs a snapshot and broadcasts it.
import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/+esm'
import { openRoom } from '../core/mesh.js'
import { floatEmoji } from '../core/float.js'
import { createFog, spotFor } from '../core/fog.js'
import { limiter } from '../core/ratelimit.js'
import { isAllowed } from '../core/emoji.js'
import { h, replaceKeepingFocus } from './dom.js'
import { icons } from './icons.js'
import { createStore } from './store.js'
import { validVote, validAsk, validUpvote, validPollDraft, MAX_TEXT, MAX_OPTION } from './validate.js'
import { verifyHello } from './identity.js'
import { roomName, REACTIONS, BROADCAST_MS, LIMITS, stateKey, joinUrl } from './protocol.js'

function loadSaved(roomId) {
  try {
    return JSON.parse(localStorage.getItem(stateKey(roomId))) ?? {}
  } catch {
    return {}
  }
}

export function startHost(app, roomId, host) {
  const store = createStore(loadSaved(roomId))
  const mesh = openRoom(roomName(roomId))
  const url = joinUrl()
  const shortUrl = url.replace(/^https?:\/\//, '')

  /* ---------- Layout ---------- */

  const fogCanvas = h('canvas', { class: 'fog', 'aria-hidden': 'true' })
  const layer = h('div', { class: 'float-layer', 'aria-hidden': 'true' })
  const countNum = h('span', { class: 'count-num num' }, '0')
  const countLabel = h('span', { class: 'count-label' }, 'people here')
  const qrBox = h('div', { class: 'qr', role: 'img', 'aria-label': `QR code for ${shortUrl}` })
  const statusLine = h('p', { class: 'host-status', role: 'status' })

  const qr = qrcode(0, 'M')
  qr.addData(url)
  qr.make()
  qrBox.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true }) // generated locally

  const copyLink = h('button', {
    class: 'link-copy', type: 'button', title: 'Copy the link',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(url)
        copyLink.dataset.copied = ''
        setTimeout(() => delete copyLink.dataset.copied, 1600)
      } catch {}
    },
  }, h('span', { class: 'link-text' }, shortUrl), h('span', { class: 'link-icon', html: icons.copy }))

  const toolButton = (label, icon, onclick, key) =>
    h('button', { class: 'tool', type: 'button', 'aria-label': label, title: key ? `${label} (${key})` : label, onclick, html: icons[icon] })

  const qrToggle = toolButton('Hide the QR code', 'qr', () => toggleQr(), 'Q')
  const themeToggle = toolButton('Switch light or dark', 'sun', () => toggleTheme(), 'T')
  const fsToggle = toolButton('Presentation mode', 'fullscreen', () => togglePresent(), 'F')

  const pollPanel = h('section', { class: 'panel panel-poll', 'aria-labelledby': 'poll-h' })
  const qPanel = h('section', { class: 'panel panel-questions', 'aria-labelledby': 'q-h' })

  const stage = h('div', { class: 'stage' },
    fogCanvas,
    h('header', { class: 'stage-bar' },
      h('a', { class: 'mark', href: '../', target: '_blank', rel: 'noopener' }, h('span', { class: 'mark-dot', 'aria-hidden': 'true' }), 'Ephemeral'),
      statusLine,
      h('div', { class: 'tools' }, qrToggle, themeToggle, fsToggle,
        h('a', { class: 'tool tool-text', href: '#new', title: 'Start a new, empty room' }, 'New room')),
    ),
    h('aside', { class: 'join', 'aria-label': 'How to join' },
      h('p', { class: 'join-lead' }, 'Scan to join'),
      qrBox,
      copyLink,
      h('p', { class: 'count', 'aria-live': 'polite' }, countNum, countLabel),
    ),
    pollPanel,
    qPanel,
    layer,
  )
  app.replaceChildren(stage)
  document.title = 'Presenting · Ephemeral'

  const fog = createFog(fogCanvas, { returnMs: 2400 })

  /* ---------- Broadcast ---------- */

  const stateAction = mesh.action('state')
  const helloAction = mesh.action('hello')
  let lastSigned = null
  let timer = 0
  let dirty = false

  async function publish() {
    timer = 0
    dirty = false
    lastSigned = await host.sign(store.snapshot())
    stateAction.send(lastSigned)
    try {
      localStorage.setItem(stateKey(roomId), JSON.stringify(store.toJSON()))
    } catch {}
  }

  // At most one state every BROADCAST_MS, so thirty people voting at once
  // don't turn into thirty broadcasts.
  function changed() {
    render()
    dirty = true
    if (!timer) timer = setTimeout(publish, BROADCAST_MS)
  }

  mesh.onJoin(async id => {
    fog.setPrint(id, spotFor(id, { x0: 0.04, x1: 0.96, y0: 0.12, y1: 0.92, r: 0.035 }))
    renderCount()
    helloAction.send(await host.hello(mesh.selfId), id)
    if (!lastSigned || dirty) await publish()
    else stateAction.send(lastSigned, id)
  })

  mesh.onLeave(id => {
    fog.removePrint(id)
    for (const l of Object.values(limits)) l.forget(id)
    renderCount()
  })

  mesh.onError(() => (statusLine.textContent = 'Could not reach the signaling relays. Check the network, then reload.'))

  // Another tab holding this room's key would confuse the audience.
  helloAction.on(async (msg, peerId) => {
    if (await verifyHello(roomId, msg, peerId)) {
      statusLine.textContent = 'This room is also open as presenter in another tab. Close one of them.'
      statusLine.dataset.tone = 'warn'
    }
  })

  /* ---------- Incoming ---------- */

  const limits = Object.fromEntries(Object.entries(LIMITS).map(([k, [rate, burst]]) => [k, limiter(rate, burst)]))

  mesh.action('react').on((emoji, peerId) => {
    if (isAllowed(REACTIONS, emoji) && limits.react(peerId)) {
      floatEmoji(layer, emoji, { size: 'clamp(2.5rem, 4vw, 4.5rem)' })
    }
  })
  mesh.action('vote').on((d, peerId) => {
    const v = validVote(d)
    if (v && limits.vote(peerId) && store.vote(peerId, v)) changed()
  })
  mesh.action('ask').on((d, peerId) => {
    const q = validAsk(d)
    if (q && limits.ask(peerId) && store.ask(peerId, q)) changed()
  })
  mesh.action('upvote').on((d, peerId) => {
    const u = validUpvote(d)
    if (u && limits.upvote(peerId) && store.upvote(peerId, u)) changed()
  })

  /* ---------- Poll panel ---------- */

  const optionInput = i =>
    h('input', {
      class: 'input', name: `option${i}`, maxlength: MAX_OPTION, autocomplete: 'off',
      placeholder: i < 2 ? `Option ${i + 1}` : `Option ${i + 1} (optional)`, 'aria-label': `Option ${i + 1}`,
    })

  const pollForm = h('form', { class: 'poll-form', novalidate: true },
    h('label', { class: 'visually-hidden', for: 'poll-q' }, 'Poll question'),
    h('input', { class: 'input input-lg', id: 'poll-q', name: 'question', maxlength: MAX_TEXT, autocomplete: 'off', placeholder: 'Ask the room something' }),
    h('div', { class: 'poll-options' }, [0, 1, 2, 3].map(optionInput)),
    h('p', { class: 'form-error', role: 'alert' }),
    h('button', { class: 'btn', type: 'submit' }, 'Open the poll'),
  )
  pollForm.addEventListener('submit', e => {
    e.preventDefault()
    const f = pollForm.elements
    const draft = validPollDraft(f.question.value, [0, 1, 2, 3].map(i => f[`option${i}`].value))
    if (!draft) {
      pollForm.querySelector('.form-error').textContent = 'Write a question and at least two options.'
      return
    }
    pollForm.querySelector('.form-error').textContent = ''
    pollForm.reset()
    store.openPoll(draft.question, draft.options)
    changed()
  })

  let barsFor = null
  let bars = []
  const pollLive = h('div', { class: 'poll-live' })

  function buildPollLive(poll) {
    barsFor = poll.id
    bars = poll.options.map(label => {
      const fill = h('span', { class: 'bar-fill' })
      const count = h('span', { class: 'bar-count num' })
      const row = h('li', { class: 'bar' },
        h('span', { class: 'bar-label' }, label), count, h('span', { class: 'bar-track', 'aria-hidden': 'true' }, fill))
      return { row, fill, count }
    })
    pollLive.replaceChildren(
      h('p', { class: 'poll-question' }, poll.question),
      h('ol', { class: 'bars' }, bars.map(b => b.row)),
      h('p', { class: 'poll-meta' }),
      h('div', { class: 'panel-actions' }),
    )
  }

  function renderPoll() {
    const poll = store.poll
    stage.dataset.reveal = poll && !poll.open ? 'true' : 'false'
    if (!poll) {
      pollPanel.replaceChildren(h('h2', { id: 'poll-h', class: 'panel-title' }, 'Poll'), pollForm)
      barsFor = null
      return
    }
    if (barsFor !== poll.id) buildPollLive(poll)
    const tally = store.tally()
    const total = tally.reduce((a, b) => a + b, 0)
    const max = Math.max(...tally)
    bars.forEach((b, i) => {
      const pct = total ? Math.round((tally[i] / total) * 100) : 0
      b.fill.style.transform = `scaleX(${total ? tally[i] / total : 0})`
      b.count.textContent = `${tally[i]} · ${pct}%`
      b.row.dataset.lead = String(total > 0 && tally[i] === max)
    })
    pollLive.querySelector('.poll-meta').textContent =
      `${total} ${total === 1 ? 'vote' : 'votes'}${poll.open ? ' · voting open' : ' · voting closed'}`
    pollLive.querySelector('.panel-actions').replaceChildren(
      poll.open
        ? h('button', { class: 'btn', type: 'button', onclick: () => (store.closePoll(), changed()) }, 'Close voting')
        : h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => (store.reopenPoll(), changed()) }, 'Reopen voting'),
      h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => (store.clearPoll(), changed()) }, 'New poll'),
    )
    if (pollPanel.lastChild !== pollLive) {
      pollPanel.replaceChildren(h('h2', { id: 'poll-h', class: 'panel-title' }, 'Poll'), pollLive)
    }
  }

  /* ---------- Questions panel ---------- */

  const qCount = h('span', { class: 'panel-count num' })
  const qList = h('ol', { class: 'questions' })
  const qEmpty = h('p', { class: 'empty' }, 'Questions from the audience land here, sorted by votes.')
  qPanel.append(h('h2', { id: 'q-h', class: 'panel-title' }, 'Questions ', qCount), qEmpty, qList)

  function renderQuestions() {
    const all = store.allQuestions()
    const visible = all.filter(q => !q.hidden)
    qCount.textContent = visible.length ? String(visible.length) : ''
    qEmpty.hidden = all.length > 0
    replaceKeepingFocus(qList, all.map(q =>
      h('li', { class: 'question', 'data-answered': String(q.answered), 'data-hidden': String(q.hidden) },
        h('span', { class: 'question-votes num', 'aria-label': `${q.votes} votes` }, h('span', { html: icons.up }), String(q.votes)),
        h('p', { class: 'question-text' }, q.text),
        h('div', { class: 'question-actions' },
          h('button', {
            class: 'chip-btn', type: 'button', 'data-key': `a-${q.id}`, 'aria-pressed': String(q.answered),
            onclick: () => (store.setAnswered(q.id, !q.answered), changed()),
            html: `${icons.check}<span>${q.answered ? 'Answered' : 'Mark answered'}</span>`,
          }),
          h('button', {
            class: 'chip-btn', type: 'button', 'data-key': `h-${q.id}`, 'aria-pressed': String(q.hidden),
            onclick: () => (store.setHidden(q.id, !q.hidden), changed()),
            html: q.hidden ? `${icons.show}<span>Show</span>` : `${icons.hide}<span>Hide</span>`,
          }),
        ),
      ),
    ))
  }

  /* ---------- Count, status, modes ---------- */

  function renderCount() {
    const n = mesh.peers.size
    countNum.textContent = String(n)
    countLabel.textContent = n === 1 ? 'person here' : 'people here'
    if (statusLine.dataset.tone !== 'warn') {
      statusLine.textContent = n ? 'Live. Only this browser can run polls in this room.' : 'Waiting for the first person to join.'
    }
  }

  function render() {
    renderPoll()
    renderQuestions()
  }

  function toggleQr(force) {
    const hidden = force ?? stage.dataset.qr !== 'hidden'
    stage.dataset.qr = hidden ? 'hidden' : 'shown'
    qrToggle.setAttribute('aria-label', hidden ? 'Show the QR code' : 'Hide the QR code')
    qrToggle.setAttribute('aria-pressed', String(hidden))
  }

  function currentTheme() {
    return document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  }
  function toggleTheme() {
    const next = currentTheme() === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('ephemeral-theme', next)
    } catch {}
    themeToggle.innerHTML = next === 'light' ? icons.moon : icons.sun
    fog.refresh()
  }
  themeToggle.innerHTML = currentTheme() === 'light' ? icons.moon : icons.sun

  function togglePresent() {
    const on = stage.dataset.present !== 'true'
    stage.dataset.present = String(on)
    if (on) document.documentElement.requestFullscreen?.().catch(() => {})
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) stage.dataset.present = 'false'
  })

  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === 'f') togglePresent()
    else if (k === 'q') toggleQr()
    else if (k === 't') toggleTheme()
  })

  toggleQr(false)
  render()
  renderCount()
  publish()
}
