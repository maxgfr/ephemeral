// Audience screen: a phone in one hand. Reactions at thumb reach, the poll
// when one is open, questions one tab away, and a connection state that
// always says what is going on.
import { openRoom } from '../core/mesh.js'
import { floatEmoji } from '../core/float.js'
import { limiter } from '../core/ratelimit.js'
import { isAllowed } from '../core/emoji.js'
import { randomId } from '../core/ids.js'
import { h, replaceKeepingFocus } from './dom.js'
import { icons } from './icons.js'
import { verifyHello } from './identity.js'
import { validSigned, validState, MAX_TEXT } from './validate.js'
import { roomName, REACTIONS, HELLO_TIMEOUT_MS, LIMITS } from './protocol.js'

const STATUS = {
  connecting: 'Joining the room…',
  live: 'Connected',
  away: 'The presenter disconnected. Waiting for them to come back…',
  missing: 'Presenter not found. The room only exists while the presenter’s screen is open. Still trying.',
  reconnecting: 'Reconnecting…',
}

// Kept on this phone only: what I voted, asked and upvoted, plus a random
// voter id so a reload replaces my vote instead of adding one.
function remember(key, fallback) {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key)) }
  } catch {
    return fallback
  }
}

export function startAudience(app, roomId) {
  const mesh = openRoom(roomName(roomId))
  const memKey = `ephemeral-me-${roomId}`
  const me = remember(memKey, { votes: {}, asked: [], upvoted: [], voter: randomId(8) })
  const save = () => {
    try {
      localStorage.setItem(memKey, JSON.stringify(me))
    } catch {}
  }
  save()

  let hostPeerId = null
  let verify = null
  let lastSeq = -1
  let state = null
  let pending = null // a state that arrived before its hello
  let status = 'connecting'
  let tab = 'poll'
  let lastPollId = null

  /* ---------- Layout ---------- */

  const layer = h('div', { class: 'float-layer', 'aria-hidden': 'true' })
  const statusDot = h('span', { class: 'status-dot', 'aria-hidden': 'true' })
  const statusText = h('span', { class: 'status-text' })
  const statusCount = h('span', { class: 'status-count num' })
  // Shown when a connection doesn't come back on its own (iOS after a lock).
  const rejoin = h('button', { class: 'rejoin', type: 'button', hidden: true, onclick: () => location.reload() }, 'Rejoin')
  const statusBar = h('header', { class: 'status' },
    statusDot, h('span', { class: 'status-msg', role: 'status', 'aria-live': 'polite' }, statusText, statusCount), rejoin)

  const tabPoll = h('button', { class: 'tab', type: 'button', role: 'tab', id: 'tab-poll', 'aria-controls': 'view-poll', onclick: () => setTab('poll') }, 'Poll')
  const qBadge = h('span', { class: 'tab-badge num' })
  const tabQ = h('button', { class: 'tab', type: 'button', role: 'tab', id: 'tab-q', 'aria-controls': 'view-q', onclick: () => setTab('questions') }, 'Questions', qBadge)
  const viewPoll = h('section', { class: 'view', id: 'view-poll', role: 'tabpanel', 'aria-labelledby': 'tab-poll' })
  const viewQ = h('section', { class: 'view', id: 'view-q', role: 'tabpanel', 'aria-labelledby': 'tab-q' })

  const reactBar = h('nav', { class: 'react-bar', 'aria-label': 'Send a reaction' },
    REACTIONS.map(emoji => h('button', { class: 'react', type: 'button', 'aria-label': `React with ${emoji}`, onclick: () => react(emoji) }, emoji)))

  app.replaceChildren(
    h('div', { class: 'phone' },
      statusBar,
      h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Room' }, tabPoll, tabQ),
      viewPoll,
      viewQ,
      h('p', { class: 'privacy' }, 'People in this room can see your IP address, as with any peer-to-peer call. Nothing is stored on a server.'),
      reactBar,
      layer,
    ),
  )
  document.title = 'Room · Ephemeral'

  /* ---------- Status ---------- */

  let rejoinTimer = 0
  function setStatus(s) {
    status = s
    statusBar.dataset.state = s
    statusText.textContent = STATUS[s]
    clearTimeout(rejoinTimer)
    rejoin.hidden = s !== 'missing'
    if (s === 'away' || s === 'reconnecting') rejoinTimer = setTimeout(() => (rejoin.hidden = false), 10_000)
    renderCount()
    renderPoll()
    renderQuestions()
  }

  function renderCount() {
    const others = mesh.peers.size - (hostPeerId && mesh.peers.has(hostPeerId) ? 1 : 0)
    statusCount.textContent = status === 'live' ? `${others + 1} here` : ''
  }

  let missingTimer = setTimeout(() => status === 'connecting' && setStatus('missing'), HELLO_TIMEOUT_MS)

  /* ---------- Host messages ---------- */

  const helloAction = mesh.action('hello')
  const stateAction = mesh.action('state')

  helloAction.on(async (msg, peerId) => {
    const v = await verifyHello(roomId, msg, peerId)
    if (!v) return
    // A verified hello makes this peer the host. A reloaded presenter starts a
    // new sequence, so the counter starts over too.
    hostPeerId = peerId
    verify = v
    lastSeq = -1
    clearTimeout(missingTimer)
    setStatus('live')
    if (pending?.peerId === peerId) await onState(pending.data, peerId)
    pending = null
  })

  async function onState(data, peerId) {
    if (!validSigned(data)) return
    if (peerId !== hostPeerId) {
      pending = { data, peerId }
      return
    }
    const s = validState(await verify(data))
    if (!s || s.seq <= lastSeq || peerId !== hostPeerId) return
    lastSeq = s.seq
    state = s
    // A freshly opened poll pulls the audience to the poll tab.
    if (s.poll?.open && s.poll.id !== lastPollId && me.votes[s.poll.id] === undefined) setTab('poll')
    lastPollId = s.poll?.id ?? null
    renderPoll()
    renderQuestions()
  }
  stateAction.on(onState)

  mesh.onJoin(renderCount)
  mesh.onLeave(id => {
    for (const l of Object.values(recv)) l.forget(id)
    if (id === hostPeerId) setStatus('away')
    else renderCount()
  })

  // Phones drop connections when the screen locks. On return, say so until
  // the presenter is reachable again.
  let hiddenAt = 0
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = performance.now()
      return
    }
    if (performance.now() - hiddenAt < 1500 || status !== 'live') return
    if (!hostPeerId || !mesh.peers.has(hostPeerId)) setStatus('reconnecting')
  })

  /* ---------- Sending ---------- */

  const send = Object.fromEntries(Object.entries(LIMITS).map(([k, [rate, burst]]) => [k, limiter(rate, burst)]))
  const recv = Object.fromEntries(Object.entries(LIMITS).map(([k, [rate, burst]]) => [k, limiter(rate, burst)]))
  const toHost = (name, data) => {
    if (!hostPeerId || !send[name]('self')) return false
    mesh.action(name).send({ ...data, voter: me.voter }, hostPeerId)
    return true
  }

  const reactAction = mesh.action('react')
  function react(emoji) {
    if (!send.react('self')) return
    navigator.vibrate?.(10)
    floatEmoji(layer, emoji, { size: '2.5rem' })
    reactAction.send(emoji)
  }
  reactAction.on((emoji, peerId) => {
    if (isAllowed(REACTIONS, emoji) && recv.react(peerId)) floatEmoji(layer, emoji, { size: '2rem' })
  })

  /* ---------- Tabs ---------- */

  function setTab(t) {
    tab = t
    tabPoll.setAttribute('aria-selected', String(t === 'poll'))
    tabQ.setAttribute('aria-selected', String(t === 'questions'))
    tabPoll.tabIndex = t === 'poll' ? 0 : -1
    tabQ.tabIndex = t === 'questions' ? 0 : -1
    viewPoll.hidden = t !== 'poll'
    viewQ.hidden = t !== 'questions'
  }
  for (const [a, b] of [[tabPoll, tabQ], [tabQ, tabPoll]]) {
    a.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        b.click()
        b.focus()
      }
    })
  }

  /* ---------- Poll ---------- */

  function renderPoll() {
    const poll = state?.poll
    if (!poll) {
      viewPoll.replaceChildren(h('div', { class: 'empty' },
        h('p', { class: 'empty-title' }, status === 'live' ? 'No poll right now.' : 'Waiting for the presenter.'),
        h('p', {}, status === 'live' ? 'When the presenter opens one, it shows up here.' : 'Polls appear here once you are connected.')))
      return
    }
    const mine = me.votes[poll.id]
    const voted = mine !== undefined
    const showResults = voted || !poll.open
    const total = state.tally.reduce((a, b) => a + b, 0)
    const canVote = poll.open && status === 'live'

    replaceKeepingFocus(viewPoll, [
      h('p', { class: 'poll-question' }, poll.question),
      h('ol', { class: 'options', 'data-results': String(showResults) },
        poll.options.map((label, i) => {
          const share = total ? state.tally[i] / total : 0
          return h('li', {},
            h('button', {
              class: 'option', type: 'button', 'data-key': `o-${poll.id}-${i}`,
              'aria-pressed': String(mine === i), disabled: !canVote,
              style: { '--share': share },
              onclick: () => {
                if (toHost('vote', { pollId: poll.id, option: i })) {
                  me.votes[poll.id] = i
                  save()
                  renderPoll()
                }
              },
            },
            h('span', { class: 'option-label' }, label, mine === i ? h('span', { class: 'tag option-mine' }, 'Your vote') : null),
            showResults ? h('span', { class: 'option-count num' }, `${Math.round(share * 100)}%`) : null),
          )
        })),
      h('p', { class: 'poll-meta' },
        !poll.open ? `Voting closed · ${total} ${total === 1 ? 'vote' : 'votes'}`
          : voted ? 'Vote counted. Tap another option to change it.'
          : 'Tap an option to vote.'),
    ])
  }

  /* ---------- Questions ---------- */

  const textarea = h('textarea', {
    class: 'input', id: 'ask-text', rows: 3, maxlength: MAX_TEXT, placeholder: 'Ask the presenter something',
  })
  const counter = h('span', { class: 'ask-counter num', 'aria-live': 'off' }, `0/${MAX_TEXT}`)
  const askNote = h('p', { class: 'ask-note', role: 'status' })
  const askBtn = h('button', { class: 'btn', type: 'submit' }, 'Ask')
  const askForm = h('form', { class: 'ask' },
    h('label', { class: 'visually-hidden', for: 'ask-text' }, 'Your question'),
    textarea,
    h('div', { class: 'ask-row' }, counter, askBtn),
    askNote,
  )
  textarea.addEventListener('input', () => (counter.textContent = `${textarea.value.length}/${MAX_TEXT}`))
  askForm.addEventListener('submit', e => {
    e.preventDefault()
    const text = textarea.value.trim()
    if (!text) return
    const id = randomId(6)
    if (!toHost('ask', { id, text })) {
      askNote.textContent = hostPeerId ? 'Slow down a little, then try again.' : 'Not connected to the presenter yet.'
      return
    }
    me.asked.push(id)
    save()
    textarea.value = ''
    counter.textContent = `0/${MAX_TEXT}`
    askNote.textContent = 'Sent. It shows up below once the presenter’s screen has it.'
  })

  const qList = h('ol', { class: 'questions' })
  const qEmpty = h('p', { class: 'empty' }, 'No questions yet. Be the first.')
  viewQ.append(askForm, qEmpty, qList)

  function renderQuestions() {
    const qs = state?.questions ?? []
    askBtn.disabled = status !== 'live'
    const open = qs.filter(q => !q.answered).length
    qBadge.textContent = open ? String(open) : ''
    qEmpty.hidden = qs.length > 0
    if (qs.some(q => me.asked.includes(q.id))) askNote.textContent = ''
    replaceKeepingFocus(qList, qs.map(q => {
      const up = me.upvoted.includes(q.id)
      const mine = me.asked.includes(q.id)
      return h('li', { class: 'question', 'data-answered': String(q.answered) },
        h('p', { class: 'question-text' }, q.text),
        h('div', { class: 'question-meta' },
          mine ? h('span', { class: 'tag' }, 'Yours') : null,
          q.answered ? h('span', { class: 'tag tag-done' }, 'Answered') : null),
        h('button', {
          class: 'upvote', type: 'button', 'data-key': `u-${q.id}`, 'aria-pressed': String(up),
          'aria-label': `${up ? 'Upvoted' : 'Upvote'}, ${q.votes} ${q.votes === 1 ? 'vote' : 'votes'}`,
          disabled: up || mine || status !== 'live',
          onclick: () => {
            if (toHost('upvote', { questionId: q.id })) {
              me.upvoted.push(q.id)
              save()
              renderQuestions()
            }
          },
        }, h('span', { html: icons.up }), h('span', { class: 'num' }, String(q.votes))),
      )
    }))
  }

  setTab('poll')
  setStatus('connecting')
}
