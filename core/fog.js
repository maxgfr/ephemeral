// Condensation on glass. A canvas of frost that pointers wipe clear and that
// mists over again on its own. Prints (peers present) stay clear while they
// last. Rendered at reduced resolution: fog is soft, the GPU doesn't need 4K.

const SCALE = 0.5
const KEEP = 0.04 // fraction of a wipe still visible after `returnMs`

function cssColor(el, name, fallback) {
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  const probe = document.createElement('canvas').getContext('2d')
  probe.fillStyle = fallback
  probe.fillStyle = v || fallback // invalid colors are ignored by canvas
  return probe.fillStyle
}

function frostTile(el) {
  const tile = document.createElement('canvas')
  tile.width = tile.height = 192
  const c = tile.getContext('2d')
  c.fillStyle = cssColor(el, '--frost', 'rgba(140,155,175,0.42)')
  c.fillRect(0, 0, 192, 192)
  // Grain: tiny droplets of brighter frost, fixed per tile.
  c.fillStyle = cssColor(el, '--frost-grain', 'rgba(220,230,240,0.07)')
  for (let i = 0; i < 900; i++) {
    const r = Math.random() < 0.9 ? 0.6 : 1.4
    c.beginPath()
    c.arc(Math.random() * 192, Math.random() * 192, r, 0, Math.PI * 2)
    c.fill()
  }
  return tile
}

export function createFog(canvas, { returnMs = 5200, brush = 64 } = {}) {
  const ctx = canvas.getContext('2d')
  const mask = document.createElement('canvas')
  const mctx = mask.getContext('2d')
  const prints = new Map() // id -> { x, y, r } normalized
  let pattern = null
  let w = 0
  let h = 0
  let raf = 0
  let last = 0
  let lastWipe = -Infinity

  function resize() {
    const rect = canvas.getBoundingClientRect()
    w = Math.max(1, Math.round(rect.width * SCALE))
    h = Math.max(1, Math.round(rect.height * SCALE))
    canvas.width = mask.width = w
    canvas.height = mask.height = h
    pattern = ctx.createPattern(frostTile(canvas), 'repeat')
    draw()
  }

  function disc(c, x, y, r, strength = 1) {
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(0,0,0,${strength})`)
    g.addColorStop(0.55, `rgba(0,0,0,${strength * 0.85})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g
    c.beginPath()
    c.arc(x, y, r, 0, Math.PI * 2)
    c.fill()
  }

  function draw() {
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(mask, 0, 0)
    for (const p of prints.values()) disc(ctx, p.x * w, p.y * h, p.r * Math.min(w, h), 0.92)
  }

  function frame(t) {
    const dt = last ? t - last : 16
    last = t
    if (t - lastWipe > returnMs) {
      mctx.clearRect(0, 0, w, h) // the last few % snap away invisibly
    } else {
      mctx.globalCompositeOperation = 'destination-out'
      mctx.fillStyle = `rgba(0,0,0,${1 - KEEP ** (dt / returnMs)})`
      mctx.fillRect(0, 0, w, h)
    }
    draw()
    raf = t - lastWipe > returnMs ? 0 : requestAnimationFrame(frame)
    if (!raf) last = 0
  }

  function wake() {
    lastWipe = performance.now()
    if (!raf) raf = requestAnimationFrame(frame)
  }

  // points: [[x, y], ...] normalized to the canvas, a continuous stroke.
  function wipe(points, size = 1) {
    if (!w || !points.length) return
    const r = brush * SCALE * size
    mctx.globalCompositeOperation = 'source-over'
    let [px, py] = points[0]
    disc(mctx, px * w, py * h, r)
    for (const [x, y] of points.slice(1)) {
      const dx = (x - px) * w
      const dy = (y - py) * h
      const steps = Math.ceil(Math.hypot(dx, dy) / (r / 3))
      for (let i = 1; i <= steps; i++) disc(mctx, (px + ((x - px) * i) / steps) * w, (py + ((y - py) * i) / steps) * h, r)
      px = x
      py = y
    }
    wake()
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  return {
    wipe,
    setPrint(id, print) {
      prints.set(id, print)
      draw()
    },
    // A leaving peer's print doesn't vanish: it hands over to the mask and
    // mists over like any other wipe.
    removePrint(id) {
      const p = prints.get(id)
      if (!p) return
      prints.delete(id)
      mctx.globalCompositeOperation = 'source-over'
      disc(mctx, p.x * w, p.y * h, p.r * Math.min(w, h), 0.92)
      wake()
    },
    refresh: resize, // call when the theme changes
    destroy() {
      ro.disconnect()
      cancelAnimationFrame(raf)
    },
  }
}

// A stable spot for a peer inside a region of the pane, from its ID.
export function spotFor(id, { x0 = 0.05, x1 = 0.95, y0 = 0.1, y1 = 0.9, r = 0.045 } = {}) {
  let h = 2166136261
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const a = (h >>> 0) / 2 ** 32
  const b = ((h >>> 11) % 1000) / 1000
  return { x: x0 + a * (x1 - x0), y: y0 + b * (y1 - y0), r: r + (h & 7) * 0.003 }
}
