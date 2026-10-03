// Reaction lists. Split on grapheme clusters so "❤️" or "👩‍💻" stay one item.

export const DEFAULT_REACTIONS = ['👏', '🔥', '❤️', '😂', '🤔', '🎉']
const MAX_REACTIONS = 8
const MAX_LEN = 16 // UTF-16 units; generous for ZWJ sequences, blocks junk

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const isEmoji = s => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(s)

export function splitEmojis(str) {
  if (typeof str !== 'string') return [...DEFAULT_REACTIONS]
  const out = []
  for (const { segment } of segmenter.segment(str)) {
    if (isEmoji(segment) && segment.length <= MAX_LEN && !out.includes(segment)) out.push(segment)
    if (out.length === MAX_REACTIONS) break
  }
  return out.length ? out : [...DEFAULT_REACTIONS]
}

export const isAllowed = (list, emoji) => typeof emoji === 'string' && list.includes(emoji)
