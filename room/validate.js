// Shape and size checks for everything a peer can send. Anything that fails
// is dropped silently. Pure: no DOM, no crypto.

export const MAX_TEXT = 200
export const MAX_OPTION = 80
export const MAX_QUESTIONS = 200
const MAX_PAYLOAD = 64_000

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const isId = v => typeof v === 'string' && /^[a-z0-9]{1,32}$/i.test(v)
const isCount = v => Number.isInteger(v) && v >= 0
// Drop control and bidi/invisible characters (ZWJ stays, emoji need it),
// collapse whitespace to single spaces.
// eslint-disable-next-line no-control-regex
const clean = s => s.replace(/[\u0000-\u001f\u007f-\u009f\u200b\u200c\u200e\u200f\u2028-\u202e]/g, '').replace(/\s+/g, ' ').trim()
const shortText = (v, max) => typeof v === 'string' && v.length <= max * 2 && clean(v).length > 0 && clean(v).length <= max

// Optional stable voter id (kept in the phone's localStorage), so a reload
// replaces a vote instead of adding one. Absent is fine; malformed is not.
const withVoter = (d, out) => {
  if (d.voter === undefined) return out
  return isId(d.voter) ? { ...out, voter: d.voter } : null
}

export function validVote(d) {
  if (!isObj(d) || !isId(d.pollId) || !isCount(d.option) || d.option > 3) return null
  return withVoter(d, { pollId: d.pollId, option: d.option })
}

export function validAsk(d) {
  if (!isObj(d) || !isId(d.id) || !shortText(d.text, MAX_TEXT)) return null
  return withVoter(d, { id: d.id, text: clean(d.text) })
}

export function validUpvote(d) {
  if (!isObj(d) || !isId(d.questionId)) return null
  return withVoter(d, { questionId: d.questionId })
}

export function validSigned(d) {
  if (!isObj(d) || typeof d.payload !== 'string' || d.payload.length > MAX_PAYLOAD) return null
  if (typeof d.sig !== 'string' || d.sig.length > 256 || !/^[0-9a-f]+$/.test(d.sig)) return null
  return d
}

function validPoll(p) {
  if (p === null) return true
  return (
    isObj(p) &&
    isId(p.id) &&
    shortText(p.question, MAX_TEXT) &&
    Array.isArray(p.options) &&
    p.options.length >= 2 &&
    p.options.length <= 4 &&
    p.options.every(o => shortText(o, MAX_OPTION)) &&
    typeof p.open === 'boolean'
  )
}

const validQuestion = q =>
  isObj(q) && isId(q.id) && shortText(q.text, MAX_TEXT) && isCount(q.votes) && typeof q.answered === 'boolean'

// Defense in depth: a state is signed by the host, but the audience still
// refuses anything it couldn't render safely.
export function validState(s) {
  if (!isObj(s) || !isCount(s.seq) || !validPoll(s.poll)) return null
  if (!Array.isArray(s.tally) || !s.tally.every(isCount)) return null
  if (s.poll && s.tally.length !== s.poll.options.length) return null
  if (!Array.isArray(s.questions) || s.questions.length > MAX_QUESTIONS || !s.questions.every(validQuestion)) return null
  return s
}

// Host-side form check.
export function validPollDraft(question, options) {
  const q = typeof question === 'string' ? clean(question) : ''
  const opts = (Array.isArray(options) ? options : []).map(o => (typeof o === 'string' ? clean(o) : '')).filter(Boolean)
  if (!q || q.length > MAX_TEXT || opts.length < 2 || opts.length > 4 || opts.some(o => o.length > MAX_OPTION)) return null
  return { question: q, options: opts }
}
