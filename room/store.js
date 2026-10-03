// Host-side aggregator. The presenter's browser is the single source of truth:
// it counts one vote per participant, collects questions and upvotes, and
// turns all of it into a snapshot that gets signed and broadcast. Pure and
// serializable.
//
// A participant is keyed by `identify(peerId, voter)`: the stable voter id a
// phone keeps in localStorage when it sends one, otherwise the peerId. That
// way a reload (new peerId) replaces a vote instead of adding one.

import { MAX_QUESTIONS } from './validate.js'

const MAX_PER_PEER = 10
const MAX_HISTORY = 50

export function createStore(saved = {}) {
  const ok = v => (Array.isArray(v) ? v : [])
  let seq = Number.isInteger(saved.seq) && saved.seq >= 0 ? saved.seq : 0
  let pollCount = Number.isInteger(saved.pollCount) ? saved.pollCount : 0
  let poll = saved.poll && Array.isArray(saved.poll.options) ? { ...saved.poll } : null
  const votes = new Map(ok(saved.votes)) // participant -> option, current poll only
  const history = ok(saved.history).slice(-MAX_HISTORY) // finished polls
  const peerVoter = new Map() // peerId -> voter id, fixed once seen
  const questions = new Map()
  for (const q of ok(saved.questions)) {
    if (q && typeof q.id === 'string') questions.set(q.id, { ...q, upvoters: new Set(ok(q.upvoters)) })
  }

  const asked = by => [...questions.values()].filter(q => q.by === by).length
  const tallyOf = p => {
    const t = new Array(p?.options.length ?? 0).fill(0)
    for (const o of votes.values()) if (o < t.length) t[o] += 1
    return t
  }
  const archive = () => {
    if (!poll) return
    history.push({ id: poll.id, question: poll.question, options: [...poll.options], tally: tallyOf(poll) })
    if (history.length > MAX_HISTORY) history.shift()
  }

  return {
    // The key a participant's votes, questions and upvotes are filed under.
    // Returns null when a peer tries to switch voter ids mid-session.
    identify(peerId, voter) {
      if (!voter) return peerId
      const bound = peerVoter.get(peerId)
      if (bound && bound !== voter) return null
      peerVoter.set(peerId, voter)
      return voter
    },

    openPoll(question, options) {
      archive()
      pollCount += 1
      poll = { id: `p${pollCount}`, question, options: [...options], open: true }
      votes.clear()
      return { ...poll }
    },
    closePoll() {
      if (poll) poll.open = false
    },
    reopenPoll() {
      if (poll) poll.open = true
    },
    clearPoll() {
      archive()
      poll = null
      votes.clear()
    },
    get poll() {
      return poll && { ...poll }
    },

    vote(who, { pollId, option }) {
      if (!poll?.open || pollId !== poll.id || option >= poll.options.length) return false
      if (votes.get(who) === option) return false
      votes.set(who, option)
      return true
    },

    tally() {
      return tallyOf(poll)
    },

    history() {
      return history.map(p => ({ ...p, options: [...p.options], tally: [...p.tally] }))
    },

    ask(who, { id, text }) {
      if (questions.has(id) || questions.size >= MAX_QUESTIONS || asked(who) >= MAX_PER_PEER) return false
      questions.set(id, { id, text, by: who, at: Date.now(), upvoters: new Set(), answered: false, hidden: false })
      return true
    },

    upvote(who, { questionId }) {
      const q = questions.get(questionId)
      if (!q || q.hidden || q.upvoters.has(who)) return false
      q.upvoters.add(who)
      return true
    },

    setAnswered(id, answered) {
      const q = questions.get(id)
      if (q) q.answered = answered
    },
    setHidden(id, hidden) {
      const q = questions.get(id)
      if (q) q.hidden = hidden
    },
    clearQuestions() {
      questions.clear()
    },

    // What the audience sees. Increments seq; never includes peer IDs.
    snapshot() {
      seq += 1
      const list = [...questions.values()]
        .filter(q => !q.hidden)
        .sort((a, b) => a.answered - b.answered || b.upvoters.size - a.upvoters.size || a.at - b.at)
        .map(q => ({ id: q.id, text: q.text, votes: q.upvoters.size, answered: q.answered }))
      return { seq, poll: poll && { ...poll }, tally: this.tally(), questions: list }
    },

    // Host-only view, hidden questions included (for moderation).
    allQuestions() {
      return [...questions.values()]
        .sort((a, b) => a.hidden - b.hidden || a.answered - b.answered || b.upvoters.size - a.upvoters.size || a.at - b.at)
        .map(q => ({ id: q.id, text: q.text, votes: q.upvoters.size, answered: q.answered, hidden: q.hidden }))
    },

    toJSON() {
      return {
        seq,
        pollCount,
        poll,
        votes: [...votes],
        history,
        questions: [...questions.values()].map(q => ({ ...q, upvoters: [...q.upvoters] })),
      }
    },
  }
}
