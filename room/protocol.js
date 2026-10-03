// Room protocol constants, shared by the presenter and the audience.
//
//   hello   host -> new peer (targeted)  { pub, payload: {peerId, t}, sig }
//   state   host -> all / new peer       { payload: {seq, poll, tally, questions}, sig }
//   react   everyone -> everyone         "👏" (must be in REACTIONS)
//   vote    audience -> host (targeted)  { pollId, option }
//   ask     audience -> host (targeted)  { id, text <= 200 }
//   upvote  audience -> host (targeted)  { questionId }
import { DEFAULT_REACTIONS } from '../core/emoji.js'

export const roomName = roomId => `room-${roomId}`
export const REACTIONS = DEFAULT_REACTIONS
export const BROADCAST_MS = 300
export const HELLO_TIMEOUT_MS = 15_000
// [rate per second, burst], applied on send and, per peer, on receive.
export const LIMITS = { react: [4, 8], vote: [1, 3], ask: [1, 3], upvote: [1, 3] }

export const stateKey = roomId => `ephemeral-state-${roomId}`
export const joinUrl = () => location.href.split('#')[0] + location.hash
