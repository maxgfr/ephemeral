// Host-side aggregator. The presenter's browser is the single source of truth:
// it counts one vote per peer, collects questions and upvotes, and turns all
// of it into a snapshot that gets signed and broadcast. Pure and serializable.

import { MAX_QUESTIONS } from './validate.js'

const MAX_PER_PEER = 10

export function createStore(saved = {}) {
  const ok = v => (Array.isArray(v) ? v : [])
  let seq = Number.isInteger(saved.seq) && saved.seq >= 0 ? saved.seq : 0
  let pollCount = Number.isInteger(saved.pollCount) ? saved.pollCount : 0
  let poll = saved.poll && Array.isArray(saved.poll.options) ? { ...saved.poll } : null
  const votes = new Map(ok(saved.votes)) // peerId -> option, current poll only
  const questions = new Map()
  for (const q of ok(saved.questions)) {
    if (q && typeof q.id === 'string') questions.set(q.id, { ...q, upvoters: new Set(ok(q.upvoters)) })
  }

  const asked = by => [...questions.values()].filter(q => q.by === by).length

  return {
    openPoll(question, options) {
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
      poll = null
      votes.clear()
    },
    get poll() {
      return poll && { ...poll }
    },

    vote(peerId, { pollId, option }) {
      if (!poll?.open || pollId !== poll.id || option >= poll.options.length) return false
      if (votes.get(peerId) === option) return false
      votes.set(peerId, option)
      return true
    },

    tally() {
      const t = new Array(poll?.options.length ?? 0).fill(0)
      for (const o of votes.values()) if (o < t.length) t[o] += 1
      return t
    },

    ask(peerId, { id, text }) {
      if (questions.has(id) || questions.size >= MAX_QUESTIONS || asked(peerId) >= MAX_PER_PEER) return false
      questions.set(id, { id, text, by: peerId, at: Date.now(), upvoters: new Set(), answered: false, hidden: false })
      return true
    },

    upvote(peerId, { questionId }) {
      const q = questions.get(questionId)
      if (!q || q.hidden || q.upvoters.has(peerId)) return false
      q.upvoters.add(peerId)
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

    get peopleVoted() {
      return votes.size
    },

    toJSON() {
      return {
        seq,
        pollCount,
        poll,
        votes: [...votes],
        questions: [...questions.values()].map(q => ({ ...q, upvoters: [...q.upvoters] })),
      }
    },
  }
}
