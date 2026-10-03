// Tiny DOM builder. Strings become text nodes: nothing a peer sends is ever
// parsed as HTML.
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue
    if (k === 'class') el.className = v
    else if (k === 'html') el.innerHTML = v // trusted, static markup only (icons)
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else if (k === 'style') for (const [prop, val] of Object.entries(v)) el.style.setProperty(prop, val)
    else el.setAttribute(k, v === true ? '' : v)
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c))
  return el
}

// Re-render a list without losing keyboard focus on a [data-key] control.
export function replaceKeepingFocus(parent, children) {
  const active = document.activeElement
  const key = parent.contains(active) ? active.dataset.key : null
  parent.replaceChildren(...children)
  if (key) parent.querySelector(`[data-key="${CSS.escape(key)}"]`)?.focus()
}
