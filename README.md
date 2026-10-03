# Ephemeral

Serverless real-time presence and audience interaction over WebRTC. Live rooms for talks (reactions, polls, Q&A) and a one-line widget for static sites. No account, no backend: browsers connect peer to peer through [Trystero](https://github.com/dmotz/trystero) and public Nostr relays, and the whole thing is static files on GitHub Pages.

- **Site:** https://maxgfr.github.io/ephemeral/
- **Room:** https://maxgfr.github.io/ephemeral/room/

## The room

For talks, classes and meetings.

1. Open [`/room/`](https://maxgfr.github.io/ephemeral/room/) and click **Create a room**. You land on `…/room/#<roomId>`.
2. Put that screen on the projector. It shows a QR code, the link and the number of people in the room.
3. The audience scans the code and lands on the same URL. Their phones show a reaction bar, the current poll and the questions.

Everyone uses the same URL. The browser that holds the room's private key is the presenter; everyone else is audience. Reload the presenter tab and you get your role back, along with the polls and questions, which are saved in that browser's `localStorage`.

On the presenter screen:

| Key | Action |
|---|---|
| `F` | Presentation mode: fullscreen, controls hidden |
| `Q` | Fold the QR code away once everyone is in |
| `T` | Switch light and dark |

Polls take two to four options; bars update live and the screen clears when you close voting. Questions are sorted by votes; you can mark them answered or hide them.

## The widget

Paste one tag anywhere in your HTML:

```html
<script src="https://maxgfr.github.io/ephemeral/widget/ephemeral.js" defer
  data-reactions="👏🔥❤️🤔"
  data-position="bottom-right"></script>
```

Readers then see how many people are on the page ("3 readers here", hidden when alone), can send emoji reactions that float by for everyone, and see a dot in the right margin for where each other reader is in the page.

| Attribute | Default | Meaning |
|---|---|---|
| `data-reactions` | `👏🔥❤️😂🤔🎉` | Up to 8 emoji. Separators and text are ignored. |
| `data-position` | `bottom-right` | `bottom-right`, `bottom-left`, `top-right` or `top-left`, to stay clear of a chat bubble. |
| `data-readers` | `true` | `false` turns off reading-position dots. |

The landing page has a [snippet builder](https://maxgfr.github.io/ephemeral/#embed).

How it behaves on your page:

- It works as a classic script or with `type="module"`, with or without `defer`. Including it twice is harmless.
- Everything renders inside one `<ephemeral-widget>` element with a Shadow DOM: your CSS and its CSS never meet. No globals.
- Each page gets its own room, derived from `SHA-256(host + pathname)`. The query string and hash are ignored, so `?utm_source=…` doesn't split readers, and relays never see the URL in clear.
- If the scripts can't load (corporate network, blocker), nothing is shown.
- It loads its modules from GitHub Pages (`Access-Control-Allow-Origin: *`) and Trystero from jsDelivr. No fonts, no images.

## How it works

Browsers talk to each other directly over WebRTC. To find each other the first time they need signaling, and Trystero handles that through public Nostr relays. Once connected, every message goes browser to browser.

```
core/       shared by the room and the widget
  mesh.js       Trystero wrapper: presence, several listeners per event
  ids.js        hex, SHA-256, random IDs
  float.js      floating emoji (Web Animations, transform/opacity only, capped at 40)
  ratelimit.js  token bucket per peer, on send and on receive
  emoji.js      grapheme-aware emoji lists
  fog.js        the "wipe the glass" canvas
  tokens.css    design tokens
room/       the room app (identity, store, validation, presenter, audience)
widget/     ephemeral.js, the embeddable script
site/       landing page assets
tests/      node --test
```

All rooms use the Trystero app ID `ephemeral-v1`, with prefixed room names (`room-<id>`, `widget-<hash>`). In Trystero 0.25.4, a page that joins two different app IDs only reaches peers under the first one, so the project sticks to a single app ID.

### Room protocol

| Action | Direction | Payload |
|---|---|---|
| `hello` | presenter → new peer | `{ pub, payload, sig }`, the payload being `{ peerId, t }` |
| `state` | presenter → everyone | `{ payload, sig }`, the payload being `{ seq, poll, tally, questions }` |
| `react` | everyone → everyone | an emoji from the allow-list |
| `vote` | audience → presenter | `{ pollId, option }` |
| `ask` | audience → presenter | `{ id, text }`, at most 200 characters |
| `upvote` | audience → presenter | `{ questionId }` |

The widget uses `react` and `pos` (a scroll ratio in [0, 1], sent at most once a second and only after a change of more than 2%).

### Why nobody can fake a poll

The presenter's browser generates an ECDSA P-256 key pair. The room ID is the first 20 hex characters of `SHA-256(public key)`, so the URL itself commits to the key.

- `hello` is signed and bound to the presenter's peer ID. A phone accepts it only if the key hashes to the room ID in the URL, the signature verifies, and the signed peer ID is the sender's. That peer becomes the presenter.
- `state` is accepted only from that peer, only with a valid signature, and only with a `seq` higher than the last one. A replayed or forged state is dropped.
- When the presenter reloads, a fresh signed `hello` resets the sequence.

The presenter is the only aggregator: one vote per peer ID, re-broadcast at most every 300 ms.

Everything a peer sends is untrusted: types and sizes are checked, text is always rendered with `textContent`, reactions must be in the allow-list, and every action is rate limited per peer (reactions 4/s with a burst of 8, positions 1/s, votes, questions and upvotes 1/s with a burst of 3).

## Limits

These come with the approach. They are not bugs.

- **Group size.** Trystero builds a full mesh: every peer connects to every other. Thirty people means 435 connections, and each phone keeps 29 of them. Fine for a meetup, a class or a meeting, wrong for a 500-person conference.
- **Some connections fail.** Without a TURN server, symmetric NATs and some corporate, school and mobile networks block direct connections; expect around one person in ten to stay on "Connecting". `openRoom()` passes options through to Trystero, so `turnConfig` can be added, at the cost of a third-party server.
- **IP addresses are visible to peers.** WebRTC exposes each peer's IP address to the others in the room. Only a forced TURN relay (`iceTransportPolicy: 'relay'`) hides them, again with a server.
- **Public Nostr relays.** They are run by third parties and can be slow, saturated or gone. Trystero uses several at once; you can pin your own with `relayConfig: { urls: [...] }`.
- **Nothing persists.** When everyone leaves, it is gone. On a quiet site the widget is almost always alone, and stays hidden.
- **Votes and reactions can be gamed.** Anyone can open the console and send reactions, or reconnect with a new peer ID and vote again. Rate limits soften this; they don't stop it. A vote that matters needs authentication, so a server.
- **Phones in the background.** Mobile browsers, iOS Safari especially, drop connections when the screen locks. The audience screen shows "Reconnecting…" and Trystero renegotiates when the page comes back.
- **Secure context.** WebRTC and `crypto.subtle` require HTTPS or `localhost`.

## Privacy

There is no server, no cookie and no analytics. Room state lives in the presenter's browser; the widget stores nothing. But peers exchange IP addresses, which is personal data under the GDPR: the room and the landing page say so, and if you put the widget on a professional site, tell your readers too. This is not legal advice; have it checked if it matters for you.

## Development

No build step and no dependencies to install.

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
node --test                   # unit tests (Node 22+)
```

`localhost` counts as a secure context, so WebRTC and `crypto.subtle` work. Two tabs make two peers; also try two different browsers. On a phone, don't use your machine's LAN IP over plain HTTP (`crypto.subtle` is unavailable there): use the GitHub Pages deployment or an HTTPS tunnel, and try 4G with Wi-Fi off, where NAT problems show up. `chrome://webrtc-internals` shows every connection and why it failed.

To test the widget from another origin locally, the server hosting `widget/` must send `Access-Control-Allow-Origin: *`, as GitHub Pages does.

## Ideas

Not built yet:

- Widget themes (`data-theme="auto|light|dark"`).
- Exporting room results at the end of a session (CSV or image), generated in the presenter's browser.
- Co-presenters: the presenter signs a delegation for a second public key.
- Word cloud polls: short free answers aggregated by the presenter.
- A passive Trystero peer in a relay tab that keeps a room alive without announcing itself.

## Credits

[Trystero](https://github.com/dmotz/trystero) (MIT) for WebRTC and signaling, [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) for the QR code, and [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) (SIL Open Font License, see `core/fonts/OFL.txt`).

## License

[MIT](LICENSE)
