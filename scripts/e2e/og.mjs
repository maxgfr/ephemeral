// Regenerates site/og.png, the social preview: the landing page's first
// viewport at 1200x630 in dark mode, just after its opening wipe.
//
//   python3 -m http.server 8000 --directory ../..   # in another terminal
//   npm run og
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const BASE = (process.env.BASE || 'http://localhost:8000').replace(/\/$/, '')
const out = fileURLToPath(new URL('../../site/og.png', import.meta.url))

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, colorScheme: 'dark' })).newPage()
await page.goto(`${BASE}/`)
// The preview shows the page, not this session's live state.
await page.addStyleTag({ content: 'ephemeral-widget, .glass-count, .hint { display: none !important }' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(2200) // opening wipe drawn, haze not yet back
await page.screenshot({ path: out })
await browser.close()
console.log(`wrote ${out}`)
