// Manual end-to-end checks with real browsers and the real public relays.
//
//   cd scripts/e2e && npm install && npx playwright install chromium
//   python3 -m http.server 8000 --directory ../..   # in another terminal
//   npm test                                        # or BASE=https://maxgfr.github.io/ephemeral npm test
//
// Not in CI: public relays come and go, so these are smoke tests, not gates.
import { chromium } from 'playwright'

const BASE = (process.env.BASE || 'http://localhost:8000').replace(/\/$/, '')
const browser = await chromium.launch()
const tag = Math.random().toString(36).slice(2, 8)
let failed = 0

function check(name, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failed++
}

async function page(opts = {}, init) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts })
  // Isolate this run's demo pane from real visitors.
  await ctx.addInitScript(t => localStorage.setItem('ephemeral-pane', `e2e-${t}`), tag)
  if (init) await init(ctx)
  const p = await ctx.newPage()
  p.on('pageerror', e => console.log(`  pageerror: ${e.message}`))
  return p
}

const widget = (p, fn) => p.evaluate(fn)
const badge = p => widget(p, () => {
  const c = document.querySelector('ephemeral-widget')?.shadowRoot?.querySelector('.count')
  return c && !c.hidden ? c.textContent.trim() : null
})

/* ---------- Landing and widget ---------- */
{
  const [a, b] = [await page(), await page()]
  await a.goto(`${BASE}/`)
  await b.goto(`${BASE}/`)
  await b.waitForFunction(() => document.querySelector('ephemeral-widget')?.shadowRoot?.querySelector('.count')?.hidden === false, null, { timeout: 60_000 })
  check('widget shows 2 readers', (await badge(b)) === '2 readers here', await badge(b))
  await a.waitForFunction(() => /You and 1 other/.test(document.querySelector('.glass-count-text').textContent), null, { timeout: 30_000 }).catch(() => {})
  check('demo pane sees the other tab', /You and 1 other/.test(await a.textContent('.glass-count-text')))

  await widget(a, () => { const s = document.querySelector('ephemeral-widget').shadowRoot; s.querySelector('.toggle').click(); s.querySelector('.tray button').click() })
  const floated = await b.waitForFunction(() => document.querySelector('ephemeral-widget').shadowRoot.querySelector('.layer').childElementCount > 0, null, { timeout: 10_000 }).then(() => true, () => false)
  check('a reaction floats on the other tab', floated)

  await b.waitForFunction(() => document.querySelector('ephemeral-widget').shadowRoot.querySelectorAll('.reader').length === 1, null, { timeout: 10_000 }).catch(() => {})
  await a.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  const moved = await b.waitForFunction(() => document.querySelector('ephemeral-widget').shadowRoot.querySelector('.reader')?.getBoundingClientRect().top > 500, null, { timeout: 10_000 }).then(() => true, () => false)
  check('a reading dot follows the other reader', moved)
  await a.context().close()
  const gone = await b.waitForFunction(() => document.querySelector('ephemeral-widget').shadowRoot.querySelectorAll('.reader').length === 0, null, { timeout: 30_000 }).then(() => true, () => false)
  check('the dot goes away when the reader leaves', gone)
  await b.context().close()
}

/* ---------- Widget cap (lowered to 2 for the test) ---------- */
{
  const lowCap = ctx => ctx.route('**/widget/ephemeral.js', async route => {
    const res = await route.fetch()
    route.fulfill({ response: res, body: (await res.text()).replace('const MAX_PEERS = 30', 'const MAX_PEERS = 2') })
  })
  const ps = []
  for (let i = 0; i < 3; i++) {
    const p = await page({}, lowCap)
    await p.goto(`${BASE}/?cap=${tag}`)
    ps.push(p)
  }
  await new Promise(r => setTimeout(r, 12_000))
  const labels = await Promise.all(ps.map(badge))
  check('with a cap of 2, the extra reader steps out', labels.filter(l => l === '2+ readers here').length === 1, labels.join(' | '))
  await Promise.all(ps.map(p => p.context().close()))
}

/* ---------- Room ---------- */
{
  const host = await page({ acceptDownloads: true })
  await host.goto(`${BASE}/room/#new`)
  await host.waitForFunction(() => /^#[0-9a-f]{20}$/.test(location.hash) && document.querySelector('.stage'))
  const url = host.url()
  const roomId = new URL(url).hash.slice(1)

  const audCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const aud = await audCtx.newPage()
  await aud.goto(url)
  const live = await aud.waitForFunction(() => document.querySelector('.status')?.dataset.state === 'live', null, { timeout: 60_000 }).then(() => true, () => false)
  check('audience connects to the presenter', live)

  await host.fill('#poll-q', 'Keep going in Rust?')
  await host.fill('input[name=option0]', 'Yes')
  await host.fill('input[name=option1]', 'No')
  await host.click('.poll-form button[type=submit]')
  await aud.waitForSelector('.option')
  await aud.click('.option >> nth=0')
  await host.waitForFunction(() => document.querySelectorAll('.bar-count')[0]?.textContent.startsWith('1 '), null, { timeout: 10_000 })
  check('a vote reaches the presenter', true)

  // Reload the phone and vote again: the vote moves, it doesn't double.
  await aud.reload()
  await aud.waitForFunction(() => document.querySelector('.status')?.dataset.state === 'live', null, { timeout: 60_000 })
  await aud.waitForSelector('.option')
  await aud.click('.option >> nth=1')
  await host.waitForFunction(() => document.querySelectorAll('.bar-count')[1]?.textContent.startsWith('1 '), null, { timeout: 10_000 }).catch(() => {})
  const counts = await host.$$eval('.bar-count', els => els.map(e => e.textContent))
  check('a reload replaces the vote instead of adding one', counts[0].startsWith('0 ') && counts[1].startsWith('1 '), counts.join(' / '))

  await aud.click('#tab-q')
  await aud.fill('#ask-text', 'What about <script>alert(1)</script>?')
  await aud.click('.ask button[type=submit]')
  await host.waitForSelector('.stage .question', { timeout: 10_000 })
  check('a question is shown as text', (await host.textContent('.stage .question-text')).includes('<script>'))

  // An attacker joins, captures a signed state and tries forgeries.
  const evil = await page()
  await evil.goto(`${BASE}/room/`)
  await evil.evaluate(async ([roomId, base]) => {
    const { openRoom } = await import(`${base}/core/mesh.js`)
    const m = openRoom(`room-${roomId}`)
    const state = m.action('state')
    let captured = null
    state.on(d => (captured ??= d))
    const t0 = Date.now()
    while ((m.peers.size < 2 || !captured) && Date.now() - t0 < 30_000) await new Promise(r => setTimeout(r, 200))
    const hexOf = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
    const payload = JSON.stringify({ peerId: m.selfId, t: Date.now() })
    m.action('hello').send({
      pub: hexOf(await crypto.subtle.exportKey('raw', kp.publicKey)),
      payload,
      sig: hexOf(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, new TextEncoder().encode(payload))),
    })
    const forged = JSON.stringify({ seq: 9999, poll: null, tally: [], questions: [{ id: 'q9', text: 'FORGED', votes: 99, answered: false }] })
    state.send({ payload: forged, sig: captured?.sig ?? 'ab' })
    if (captured) state.send(captured)
  }, [roomId, BASE])
  await aud.waitForTimeout(2500)
  check('forged and replayed states are ignored', !/FORGED/.test(await aud.textContent('.phone')) && (await aud.$eval('.status', e => e.dataset.state)) === 'live')
  await evil.context().close()

  const [download] = await Promise.all([host.waitForEvent('download'), host.click('.tools .tool >> nth=0')])
  const csv = await (await download.createReadStream()).toArray().then(c => Buffer.concat(c).toString())
  check('results export as CSV', csv.includes('poll,Keep going in Rust?,No,1,100%') && csv.includes('question,'), download.suggestedFilename())

  await host.close()
  const away = await aud.waitForFunction(() => document.querySelector('.status').dataset.state === 'away', null, { timeout: 30_000 }).then(() => true, () => false)
  check('audience sees the presenter leave', away)
  const rejoin = await aud.waitForFunction(() => !document.querySelector('.rejoin').hidden, null, { timeout: 15_000 }).then(() => true, () => false)
  check('a Rejoin button appears after 10 s away', rejoin)
  await audCtx.close()
}

await browser.close()
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed')
process.exit(failed ? 1 : 0)
