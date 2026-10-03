// Floating emoji. Animated with the Web Animations API so it needs no
// stylesheet (works the same inside the widget's Shadow DOM). Only transform
// and opacity animate; the horizontal spot is set once and never animated.

const MAX_FLOATING = 40 // past this, an enthusiastic room would stall the projector
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

// `layer` must be a positioned element (absolute/fixed) with overflow hidden.
// `x` in [0,1] picks the column. Returns the element, or null when dropped.
export function floatEmoji(layer, emoji, { x = Math.random(), size = '2rem' } = {}) {
  if (layer.childElementCount >= MAX_FLOATING) return null
  const col = Math.min(1, Math.max(0, x))
  const el = document.createElement('span')
  el.textContent = emoji
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'absolute',
    bottom: '0',
    left: `calc(${col} * (100% - 1.25em))`,
    fontSize: size,
    lineHeight: '1',
    pointerEvents: 'none',
    userSelect: 'none',
    willChange: 'transform, opacity',
  })
  layer.append(el)

  const rise = layer.clientHeight * (0.55 + Math.random() * 0.35)
  let frames, duration
  if (reducedMotion.matches) {
    // No trajectory: fade in and out in place, a little above the bottom.
    const y = `translateY(${-layer.clientHeight * 0.12}px)`
    frames = [
      { transform: y, opacity: 0 },
      { transform: y, opacity: 1, offset: 0.2 },
      { transform: y, opacity: 1, offset: 0.7 },
      { transform: y, opacity: 0 },
    ]
    duration = 1600
  } else {
    const drift = (Math.random() * 2 - 1) * 28
    const at = (p, dx, s = 1) => `translate(${dx}px, ${-rise * p}px) scale(${s})`
    frames = [
      { transform: at(0, 0, 0.6), opacity: 0 },
      { transform: at(0.08, drift * 0.2, 1.1), opacity: 1, offset: 0.08 },
      { transform: at(0.35, -drift * 0.6), offset: 0.35 },
      { transform: at(0.65, drift), opacity: 1, offset: 0.65 },
      { transform: at(1, -drift * 0.4, 0.9), opacity: 0 },
    ]
    duration = 2400 + Math.random() * 1000
  }

  const anim = el.animate(frames, { duration, easing: 'cubic-bezier(.2,.6,.3,1)' })
  const done = () => el.remove()
  anim.finished.then(done, done)
  return el
}
