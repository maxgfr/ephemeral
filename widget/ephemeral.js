// Ephemeral widget: live readers, shared reactions and reading positions for
// any static page, peer to peer. Embed with:
//
//   <script src="https://maxgfr.github.io/ephemeral/widget/ephemeral.js" defer
//     data-reactions="👏🔥❤️🤔" data-position="bottom-right" data-readers="true"></script>
//
// This file has no static imports and never touches import.meta, so it runs
// as a classic script or as a module. It loads ../core/*.js relative to its own
// URL. No globals; the only thing added to the page is one custom element.
;(() => {
  const SELECTOR = 'script[src*="widget/ephemeral.js"]:not([data-ephemeral-ready])'
  const tag = document.currentScript?.src ? document.currentScript : document.querySelector(SELECTOR)
  if (!tag || tag.dataset.ephemeralReady) return
  tag.dataset.ephemeralReady = 'true'

  const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
  const MAX_PEERS = 30
  const opt = tag.dataset
  const position = POSITIONS.includes(opt.position) ? opt.position : 'bottom-right'
  const showReaders = opt.readers !== 'false'
  const load = path => import(new URL(path, tag.src).href)

  const ICON_REACT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="13" r="8"/><path d="M8 15.5c1.6 1.6 4.4 1.6 6 0"/><path d="M8.5 10.5h.01M13.5 10.5h.01"/><path d="M19 2v6M16 5h6"/></svg>'

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .root {
      --glass: oklch(0.2 0.03 252 / 0.84);
      --ink: oklch(0.97 0.008 240);
      --ink-soft: oklch(0.82 0.022 240);
      --line: oklch(0.97 0.01 240 / 0.16);
      --amber: oklch(0.81 0.15 72);
      --on-amber: oklch(0.17 0.04 60);
      --live: oklch(0.84 0.12 170);
      --dot: oklch(0.92 0.02 240 / 0.85);
      --ease: cubic-bezier(0.16, 1, 0.3, 1);
      font: 500 13px/1.2 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: var(--ink);
      -webkit-font-smoothing: antialiased;
    }
    @media (prefers-color-scheme: light) {
      .root {
        --glass: oklch(0.985 0.006 240 / 0.86);
        --ink: oklch(0.24 0.045 256);
        --ink-soft: oklch(0.42 0.04 256);
        --line: oklch(0.24 0.045 256 / 0.14);
        --live: oklch(0.55 0.11 170);
        --dot: oklch(0.35 0.04 256 / 0.6);
      }
    }
    .layer, .margin {
      position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 99990;
    }
    .margin { left: auto; width: 14px; }
    .reader {
      position: absolute; right: 4px; top: 0; width: 6px; height: 6px; border-radius: 50%;
      background: var(--dot); box-shadow: 0 0 0 2px oklch(0.2 0.03 252 / 0.25);
      transition: transform 900ms var(--ease), opacity 400ms var(--ease);
    }
    .dock {
      position: fixed; z-index: 99991; display: flex; align-items: center; gap: 6px;
      flex-direction: row-reverse;
      opacity: 0; transform: translateY(6px);
      transition: opacity 400ms var(--ease), transform 400ms var(--ease);
    }
    .dock.ready { opacity: 1; transform: none; }
    .bottom-right { right: 16px; bottom: 16px; }
    .bottom-left { left: 16px; bottom: 16px; flex-direction: row; }
    .top-right { right: 16px; top: 16px; }
    .top-left { left: 16px; top: 16px; flex-direction: row; }
    .pill {
      display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px;
      border-radius: 999px; background: var(--glass); color: var(--ink);
      box-shadow: inset 0 0 0 1px var(--line), 0 6px 20px -8px oklch(0.1 0.02 254 / 0.45);
      -webkit-backdrop-filter: blur(12px) saturate(1.2); backdrop-filter: blur(12px) saturate(1.2);
    }
    .count { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pill[hidden] { display: none; }
    .live {
      width: 7px; height: 7px; border-radius: 50%; background: var(--live);
    }
    button {
      font: inherit; color: inherit; border: 0; margin: 0; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .toggle { width: 36px; padding: 0; justify-content: center; }
    .toggle svg {
      width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.75;
      stroke-linecap: round; stroke-linejoin: round;
      transition: transform 260ms var(--ease);
    }
    .toggle[aria-expanded='true'] svg { transform: rotate(-12deg) scale(0.92); }
    .toggle:hover { color: var(--amber); }
    .tray { padding: 0 4px; gap: 0; }
    .tray button {
      width: 34px; height: 34px; border-radius: 50%; background: transparent;
      font-size: 19px; line-height: 1; display: grid; place-items: center;
      transition: transform 140ms var(--ease), background-color 140ms var(--ease);
    }
    .tray button:hover { background: var(--line); transform: translateY(-2px); }
    .tray button:active { transform: scale(0.9); }
    button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) {
      .dock, .reader, .toggle svg, .tray button { transition: none; }
    }
    @media print { .root { display: none; } }
  `

  async function start() {
    const [{ openRoom }, { floatEmoji }, { limiter }, { splitEmojis, isAllowed }, { sha256Hex }] =
      await Promise.all([
        load('../core/mesh.js'),
        load('../core/float.js'),
        load('../core/ratelimit.js'),
        load('../core/emoji.js'),
        load('../core/ids.js'),
      ])

    const reactions = splitEmojis(opt.reactions)
    // One room per page: query string and hash are ignored so ?utm_… doesn't
    // split readers, and the path is hashed so relays never see the URL.
    const roomId = (await sha256Hex(location.host + location.pathname)).slice(0, 20)
    const mesh = openRoom(`widget-${roomId}`)

    const host = document.createElement('ephemeral-widget')
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>${CSS}</style>
      <div class="root">
        <div class="layer"></div>
        <div class="margin"></div>
        <div class="dock ${position}">
          <div class="pill count" role="status" aria-live="polite" hidden>
            <span class="live" aria-hidden="true"></span><span class="label"></span>
          </div>
          <button class="pill toggle" type="button" aria-expanded="false" aria-label="Send a reaction">${ICON_REACT}</button>
          <div class="pill tray" role="group" aria-label="Reactions" hidden></div>
        </div>
      </div>`
    const $ = s => shadow.querySelector(s)
    const layer = $('.layer')
    const count = $('.count')
    const toggle = $('.toggle')
    const tray = $('.tray')

    // Presence: hidden when alone; "1 reader" only underlines the emptiness.
    let capped = false
    const renderCount = () => {
      if (capped) return
      const n = mesh.peers.size + 1
      count.hidden = n < 2
      $('.label').textContent = `${n} readers here`
    }

    // Reactions
    const react = mesh.action('react')
    const canSend = limiter(4, 8)
    const canReceive = limiter(4, 8)
    for (const emoji of reactions) {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = emoji
      b.setAttribute('aria-label', `React with ${emoji}`)
      b.addEventListener('click', () => {
        if (!canSend('self')) return
        floatEmoji(layer, emoji, { size: '28px' })
        react.send(emoji)
      })
      tray.append(b)
    }
    react.on((emoji, peerId) => {
      if (isAllowed(reactions, emoji) && canReceive(peerId)) floatEmoji(layer, emoji, { size: '28px' })
    })

    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open))
      tray.hidden = !open
    }
    toggle.addEventListener('click', () => setOpen(tray.hidden))
    shadow.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !tray.hidden) {
        setOpen(false)
        toggle.focus()
      }
    })

    // Reading positions: each reader shares scrollY / (scrollHeight - innerHeight),
    // at most once a second and only when it moved by more than 2%.
    const dots = new Map()
    const pos = mesh.action('pos')
    const canReceivePos = limiter(1, 2)
    const margin = $('.margin')
    let sent = -1
    const ratio = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      return max > 0 ? Math.round(Math.min(1, Math.max(0, scrollY / max)) * 1000) / 1000 : 0
    }
    const place = dot => (dot.style.transform = `translateY(${Number(dot.dataset.r) * (innerHeight - 12) + 3}px)`)
    if (showReaders) {
      setInterval(() => {
        const r = ratio()
        if (document.hidden || !mesh.peers.size || Math.abs(r - sent) <= 0.02) return
        sent = r
        pos.send(r)
      }, 1000)
      pos.on((r, peerId) => {
        if (typeof r !== 'number' || !(r >= 0 && r <= 1) || !canReceivePos(peerId)) return
        let dot = dots.get(peerId)
        if (!dot) {
          dot = document.createElement('span')
          dot.className = 'reader'
          margin.append(dot)
          dots.set(peerId, dot)
        }
        dot.dataset.r = r
        place(dot)
      })
      addEventListener('resize', () => dots.forEach(place), { passive: true })
    }

    // Full mesh: every reader connects to every other. Past MAX_PEERS, the
    // extra browsers step out to stay light and show "30+ readers here".
    mesh.onJoin(id => {
      if (mesh.isExtra(MAX_PEERS)) {
        capped = true
        mesh.leave()
        dots.forEach(d => d.remove())
        dots.clear()
        toggle.hidden = true
        setOpen(false)
        count.hidden = false
        $('.label').textContent = `${MAX_PEERS}+ readers here`
        return
      }
      renderCount()
      if (showReaders) pos.send(ratio(), id) // newcomers see us right away
    })
    mesh.onLeave(id => {
      canReceive.forget(id)
      canReceivePos.forget(id)
      dots.get(id)?.remove()
      dots.delete(id)
      renderCount()
    })
    renderCount()

    if (!document.body) await new Promise(r => addEventListener('DOMContentLoaded', r, { once: true }))
    document.body.append(host)
    requestAnimationFrame(() => requestAnimationFrame(() => $('.dock').classList.add('ready')))
  }

  // Corporate network, blocker, old browser: show nothing rather than an error.
  start().catch(err => console.debug('[ephemeral] widget disabled:', err))
})()
