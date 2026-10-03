# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and vanilla ES modules. No build step, no npm at runtime. Hosted on GitHub Pages under `/ephemeral/`, so every path is relative. Third-party code loads from jsDelivr with pinned versions (Trystero 0.25.4, qrcode-generator 2.0.4).

## Users

Two audiences with equal billing:

- **Presenters**: speakers at meetups, teachers, people running meetings. They open the room on a laptop connected to a projector, show a QR code, and run polls and Q&A while talking. Their audience joins on phones, often on venue Wi-Fi or 4G, with one hand.
- **Site owners**: people with static sites (blogs, docs, portfolios) who paste one `<script>` tag to show live readers, shared emoji reactions and reading positions. Their readers never chose the widget and must not be bothered by it.

## Product Purpose

Make a group of people on the same page or in the same room feel each other's presence in real time, without any account, server or tracking. Success: a presenter goes from zero to a projected QR code in one click; a site owner goes from zero to a working widget by pasting one tag.

## Positioning

There is no backend at all. Browsers connect directly over WebRTC; public Nostr relays (via Trystero) only introduce peers. Nothing is stored anywhere once everyone leaves. The presenter's authority comes from a key pair in their browser: the room ID is derived from the public key and every host decision is signed, so a participant cannot fake a poll from the console.

## Operating Context

- Presenter screen is viewed from the back of a room on a projector: low contrast and small text fail.
- Audience UI runs on phones held in one hand, often backgrounded or locked mid-talk (connections drop and come back).
- The widget runs inside pages it does not control: Shadow DOM, no globals, configurable corner to avoid chat bubbles.
- Developers test locally with `python3 -m http.server` (secure context on localhost).

## Capabilities and Constraints

- Room: create (key pair + hash URL), QR code + link, participant count, emoji reactions, polls (2 to 4 options, open/close, live bars), Q&A (ask ≤ 200 chars, upvote, answered, hidden).
- Widget: reader count (hidden when alone), shared reactions, reading-position dots; attributes `data-reactions`, `data-position`, `data-readers`.
- Full mesh: comfortable up to a few dozen peers, not a 500-seat conference.
- Without TURN, roughly one participant in ten may fail to connect.
- Peers see each other's IP addresses; this must be stated visibly.
- Reactions and votes are anonymous and forgeable; rate limiting mitigates, it does not prevent.
- English only.

## Brand Commitments

Name: Ephemeral. No logo, palette or voice to preserve. Voice: plain, direct, honest about limits.

## Evidence on Hand

No users, testimonials, metrics or press. Never fabricate any. The live demo (the widget running on the landing page itself) is the only proof.

## Product Principles

1. Nothing to sign up for, nothing to host, nothing kept.
2. Say the limits out loud (mesh size, failed connections, visible IPs) instead of hiding them.
3. The host page and the room always come first; Ephemeral stays out of the way.
4. Untrusted input is untrusted: every peer message is validated, rate-limited and rendered as text.

## Accessibility & Inclusion

Projector legibility (very high contrast, large type). Thumb reach on mobile. `prefers-reduced-motion` honored for all floating emoji and transitions. Keyboard operable presenter controls.
