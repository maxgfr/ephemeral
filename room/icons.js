// Authored icons, one stroke weight. Static markup, safe for innerHTML.
const svg = body => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`

export const icons = {
  fullscreen: svg('<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>'),
  qr: svg('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2M20 14v.01M18 18h2v2M14 20h.01M14 17v.01"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  hide: svg('<path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 9 5 9.5 7a12 12 0 0 1-3 3.9M6.6 6.6C4.4 8 2.9 10.4 2.5 12c.5 2 4.5 7 9.5 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  show: svg('<path d="M2.5 12c.5-2 4.5-7 9.5-7s9 5 9.5 7c-.5 2-4.5 7-9.5 7s-9-5-9.5-7Z"/><circle cx="12" cy="12" r="3"/>'),
  up: svg('<path d="M12 19V6M6 11.5L12 5.5l6 6"/>'),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
}
