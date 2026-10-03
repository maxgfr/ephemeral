// Session results as CSV, built in the presenter's browser. Pure.

const HEADER = ['section', 'item', 'option', 'votes', 'share']

// Quote when needed; prefix formula triggers so a spreadsheet never runs a
// question someone typed as "=HYPERLINK(…)".
function cell(value) {
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) || s.startsWith("'") ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv({ polls = [], questions = [] }) {
  const rows = [HEADER]
  for (const p of polls) {
    const total = p.tally.reduce((a, b) => a + b, 0)
    p.options.forEach((option, i) => {
      const share = total ? Math.round((p.tally[i] / total) * 100) : 0
      rows.push(['poll', p.question, option, p.tally[i], `${share}%`])
    })
  }
  for (const q of questions) rows.push(['question', q.text, q.answered ? 'answered' : 'open', q.votes, ''])
  return rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
