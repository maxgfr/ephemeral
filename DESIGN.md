---
name: Ephemeral
description: Presence that leaves no trace. A cold window at night, misted by breath, wiped clear by whoever is really there.
colors:
  glass: "oklch(0.17 0.03 252)"
  glass-deep: "oklch(0.12 0.026 254)"
  outside: "oklch(0.12 0.026 254)"
  glass-raised: "oklch(0.22 0.032 250)"
  frost: "oklch(0.62 0.03 240 / 0.42)"
  frost-grain: "oklch(0.9 0.02 240 / 0.07)"
  ink: "oklch(0.97 0.008 240)"
  ink-soft: "oklch(0.84 0.022 240)"
  ink-faint: "oklch(0.7 0.028 242)"
  line: "oklch(0.97 0.01 240 / 0.14)"
  line-strong: "oklch(0.97 0.01 240 / 0.3)"
  amber: "oklch(0.81 0.15 72)"
  amber-hover: "oklch(0.87 0.14 78)"
  amber-ink: "oklch(0.81 0.15 72)"
  on-amber: "oklch(0.17 0.04 60)"
  amber-glow: "oklch(0.81 0.15 72 / 0.18)"
  live: "oklch(0.84 0.12 170)"
  danger: "oklch(0.74 0.15 25)"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1.5rem + 7vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
    fontVariation: "'opsz' 96"
  headline:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.6rem + 4vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  title:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 1.4rem + 2vw, 2.6rem)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title-small:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body-large:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.55
  numeral:
    fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(4rem, 9vw, 9rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.04em"
    fontFeature: "'tnum' 1"
    fontVariation: "'opsz' 96"
  code:
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  s-1: "0.25rem"
  s-2: "0.5rem"
  s-3: "0.75rem"
  s-4: "1rem"
  s-5: "1.5rem"
  s-6: "2rem"
  s-7: "3rem"
  s-8: "4.5rem"
  s-9: "7rem"
  gutter: "clamp(1rem, 0.5rem + 3vw, 3rem)"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.on-amber}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.amber-hover}"
    textColor: "{colors.on-amber}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  button-quiet-hover:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.ink}"
  tool:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 0.75rem"
    height: "44px"
  tool-active:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.glass-deep}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
    height: "48px"
  emoji-chip:
    backgroundColor: "{colors.glass-raised}"
    rounded: "{rounded.pill}"
    size: "48px"
  tabs:
    backgroundColor: "{colors.glass-deep}"
    rounded: "{rounded.pill}"
    padding: "0.25rem"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: "44px"
  tab-selected:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.ink}"
  poll-option:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.title-small}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1.5rem"
    height: "60px"
  upvote:
    backgroundColor: "{colors.glass-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "52px"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0.1rem 0.55rem"
  snippet:
    backgroundColor: "{colors.glass-deep}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "1.5rem"
---

# Design System: Ephemeral

## Overview

**Creative North Star: "Condensation"**

Every screen is a cold window at night. The ground is night glass, blue-black and slightly deeper toward the top where the outside scene sits behind the pane. Over it lies a layer of frost haze: a grainy, pale blue-white canvas that the pointer or a finger wipes clear and that mists back over within seconds. Presence is breath on that glass. A real peer leaves a soft, round clear print that lasts exactly as long as they stay, then mists over like any other wipe. Nothing is drawn on the glass that a pointer or a real person did not cause.

Type and controls live on cleared glass and stay legible whether the haze is thick or gone. The system is quiet and cold, with one warm exception: a sodium-street-lamp amber that marks only what you can act on. Counts are set in tabular digits and pinned to the words that say what they count. In light mode the same pane is seen in the morning: pale frost ground, ink-navy text, the same amber.

The presenter's projector carries the full fog, and it clears completely at one decisive moment: when voting closes and the results stand. The audience phone is deliberately left unfogged, because one-handed reading on venue Wi-Fi beats atmosphere. The embeddable widget is a guest in other people's pages and carries none of the fog, only a small translucent pill.

**Key Characteristics:**
- Night-glass ground with a live frost canvas; marks on the glass have a physical cause (a wipe or a real peer).
- One sodium-amber accent, reserved for interactive elements and their states.
- Bricolage Grotesque, self-hosted, tight negative tracking at display sizes; tabular digits for every count.
- Hairline inset rings instead of borders; near-flat surfaces with one soft shadow token.
- Slow, breath-soft motion with exponential ease-out; never bouncy.
- Fog clears completely only for the decisive moment (closed poll on the presenter screen).

## Colors

A cold blue-black and frost-white palette at hue 240–254 with a single warm sodium-amber voice and two quiet signal colors.

### Primary
- **Sodium Amber** (`amber`): the fill of every primary button, the checked state of switches and radios, the 2px inset ring of a selected chip, poll option or upvote, the focus outline, the text caret, the selection highlight and link underlines. Also the brand mark's dot, which is a link home.
- **Lit Sodium** (`amber-hover`): hover fill of primary buttons; slightly lighter and yellower in night mode, deeper in morning mode.
- **Sodium Text** (`amber-ink`): amber used as text on the ground (arrow links, hovered links, hovered upvote). Same as amber at night; darkened in light mode so it holds contrast on pale frost.
- **Sodium Halo** (`amber-glow`): the 8px halo that grows around a primary button on hover and the ring around the brand dot.
- **Lamp Shadow** (`on-amber`): text and icons on an amber fill; a warm near-black, never pure black.

### Neutral
- **Night Glass** (`glass`): the page ground and the sticky bars on the phone (blended to 88–90% over content).
- **Deep Glass** (`glass-deep`): recessed wells: text fields, the snippet block, the tab track, the corner picker, the switch track, the scrollbar track.
- **Outside** (`outside`): the scene behind the pane. Only ever the top stop of the pane gradient (outside fading to glass), never a surface.
- **Raised Glass** (`glass-raised`): surfaces that sit proud of the pane: poll options, upvote buttons, emoji chips, the selected tab, hovered quiet buttons and tools, keyboard keys.
- **Frost** (`frost`) and **Frost Grain** (`frost-grain`): read only by the fog canvas. Frost is the translucent haze fill; grain is the scatter of brighter droplets baked into its tile. Never used as CSS fills.
- **Breath Ink** (`ink`): primary text, the leading poll bar, the direct-connection line in the mechanism diagram.
- **Soft Ink** (`ink-soft`): secondary text, ledes, nav links, counts beside labels.
- **Faint Ink** (`ink-faint`): tertiary text, placeholders, hints, inactive bar fills, the idle status dot, hovered ring.
- **Hairline** (`line`) and **Strong Hairline** (`line-strong`): inset rings and dividers; strong for field and option outlines, the panel top rule, quiet button rings.

### Signal
- **Live Teal** (`live`): a peer is connected (live dot, status dot), a copy just succeeded (copy button fill, link icon), an answered question tag.
- **Ember** (`danger`): warnings and errors only: the presenter's duplicate-tab warning, form errors, the phone status when the room is missing.

### Named Rules
**The Sodium Rule.** Amber means "you can act on this" and nothing else. Results, counts, charts and decoration are never amber; the leading poll bar is ink, not amber.

**The Morning Pane Rule.** Light mode is the same pane at dawn, not a different palette: every token flips together (system preference, or a stored `data-theme`), amber stays amber, and amber-as-text darkens to hold contrast.

**The White Plate Rule.** The QR code is always dark on a pure white plate in both modes, so every phone camera reads it. It is the only pure white in the system.

## Typography

**Display Font:** Bricolage Grotesque (with ui-sans-serif, system-ui)
**Body Font:** Bricolage Grotesque (with ui-sans-serif, system-ui, -apple-system, Segoe UI)
**Label/Mono Font:** ui-monospace stack (SF Mono, Cascadia Code, Menlo, Consolas) for code only

**Character:** One self-hosted variable grotesk (weights 200–800, latin subset, optical sizing on) does everything; its slightly quirky, compressed display cuts give the headline warmth against the cold palette, while body text stays plain and readable. Hierarchy comes from size and weight steps (400 / 500 / 600 / 650 / 700), never from a second family.

### Hierarchy
- **Display** (700, clamp 3rem–6rem, 1.02, optical size 96): the landing headline only, max ~11ch, set on the glass.
- **Headline** (700, clamp 2.5rem–4.25rem, 1.04): section titles and the room gate's heading, max ~16ch.
- **Title** (650, clamp 1.9rem–2.6rem, 1.2): product headings, the poll question on the phone; the presenter's poll question scales further (clamp 1.6rem–3.25rem) for the projector.
- **Title Small** (650, 1.25rem, 1.2): field legends, limit headings, poll option labels, the phone's empty-state title steps up to 1.625rem.
- **Body Large** (400, 1.25rem, 1.45): ledes on the pane and the gate, max 44–46ch.
- **Body** (400, 1.0625rem, 1.55): running text, max 42–52ch per block (global measure 66ch).
- **Label** (500–600, 0.875rem): nav links, status lines, tool buttons, chips, hints, the footer. Never uppercase, never letter-spaced open.
- **Numeral** (700, clamp 4rem–9rem, 0.9, -0.04em, tabular): the presenter's live head count; the largest thing on the projector after the poll.
- **Code** (monospace, 0.875rem, 1.7): the embed snippet and inline code.

### Named Rules
**The Tabular Count Rule.** Every number that counts something (people, votes, percentages, characters left, question totals, badges) uses tabular digits and sits next to the word for what it counts.

**The Tight Display Rule.** Headings track at -0.03em (head count -0.04em) and balance their lines; body text keeps default tracking and pretty wrapping.

**The Back-Row Rule.** Presenter text scales with the viewport (clamp on every projected size) so it reads from the back of a room; nothing important on the stage is smaller than the label step.

## Layout

The landing opens on a full-bleed pane (100svh) in three rows: bar, hero, and the pane's own live count. The hero sits left-centre on the glass (max 64rem) while the live count and peer prints sit on the right; the haze settles into the next section through a 6rem gradient sill rather than a hard seam. Below, sections cap at 76rem, separated by a single hairline, with generous vertical rhythm (7rem top, 4.5rem bottom). The "how" section uses a 12-column grid with the two products deliberately offset (the second dropped by 4.5rem) instead of twin cards; the embed section is a 5:7 split with a sticky intro.

The presenter stage is a three-column grid under a full-width bar: a join column (QR, link, head count; 15rem to 25vw), then poll and questions as equal columns, each opened by a 2px strong hairline. Hiding the QR narrows the join column; presentation mode removes every control and leaves content only. The audience phone is a single column capped at 36rem with a sticky blurred status bar on top and a fixed blurred reaction bar at the bottom (safe-area aware), leaving 7rem of clearance.

Spacing runs on a 4px base (s-1 0.25rem through s-9 7rem); the page gutter is fluid (1rem–3rem). Breakpoints: 960px (stage stacks to one column), 860px (offset products and split sections collapse), 640px (secondary nav links hide, hero drops to the bottom of the pane, the live count leaves the corner to clear the widget dock). Touch targets are 44px minimum, 48px for primary controls, 60–64px on the phone.

## Elevation & Depth

Depth is physical layering, not shadow. Back to front: the outside scene (the pane gradient), the frost canvas, then type and controls on cleared glass. Surfaces are near-flat and outlined with inset hairline rings; raised glass is a lighter tone, recessed wells a darker one. A single soft shadow token marks the few things that physically lift (the selected tab, the checked corner label, the QR plate). Translucent bars on the phone and the widget pill use backdrop blur (12–14px) so content passes under them like a second pane.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 1px 2px oklch(0.05 0.02 254 / 0.4), 0 12px 32px -12px oklch(0.05 0.02 254 / 0.6)` at night; lighter navy in morning mode): selected tab, checked corner label, QR plate.
- **Ring** (`box-shadow: inset 0 0 0 1px var(--line)` / `var(--line-strong)`): the default outline of fields, chips, options, quiet buttons, tags.
- **Selected Ring** (`box-shadow: inset 0 0 0 2px var(--amber)`): a selected chip, voted option or upvoted question.
- **Sodium Halo** (`box-shadow: 0 0 0 8px var(--amber-glow)`): primary button hover only.
- **Guest Float** (`box-shadow: inset 0 0 0 1px var(--line), 0 6px 20px -8px oklch(0.1 0.02 254 / 0.45)`): the widget pill floating over a foreign page.

### Named Rules
**The Ring, Not Border Rule.** Outlines are inset rings so they never shift layout. Real borders are reserved for dividers: the 1px hairline between sections, list rows and sticky bars, and the 2px strong rule over a presenter panel.

**The Physical Cause Rule.** Every mark on the glass has a cause: a pointer wipe, a peer's own wipe stroke, or a real connected peer's print. No decorative prints, no simulated presence, no idle fog animation.

**The Clear Pane Rule.** The fog clears completely in exactly one situation: the presenter's poll has closed and its results stand (a 1.4s ease-in-out fade). Reopening the poll brings the fog back. Nowhere else does the haze disappear wholesale.

**The Unfogged Phone Rule.** The audience phone never carries the fog canvas; its glass is plain night glass for one-handed legibility. The widget carries none either.

## Shapes

Round and soft, like condensation. Every action is a pill (999px): buttons, tools, tabs and their track, tags, the one-line emoji field, the switch. Circles carry presence: the brand dot, the live dot, emoji chips (48px), peer prints and reading-position dots, list bullets drawn as small clear spots with a hairline halo. Containers that hold content use gently curved corners: 12px for fields, poll options, upvote buttons, the snippet and the corner picker; 16px for the QR plate; 6px only for keyboard keys and focus outlines. Fog prints are soft-edged radial discs (solid to 55%, fading to clear at the edge), never hard circles.

## Components

### Buttons
Tactile, rounded and warm; the amber button is the only filled colour on any screen.
- **Shape:** full pill (999px), 48px tall, 1.5rem side padding, icon gap 0.5rem.
- **Primary:** amber fill, lamp-shadow text, 600 weight at body size, -0.01em tracking. One per decision: "Create a room", "Open the poll", "Close voting", "Copy the tag".
- **Hover / Focus:** fill lifts to lit sodium and an 8px amber halo breathes out (260ms ease-out); press scales to 0.97; focus is a 2px amber outline offset 3px. Disabled drops to 45% opacity with no halo. A successful copy turns the fill live teal briefly.
- **Quiet:** transparent with a strong hairline ring and ink text; hover fills with raised glass and the ring darkens to faint ink. Used for the secondary choice beside a primary ("Embed on your site", "Reopen voting", "New poll").
- **Tool (presenter bar):** 44px pill, transparent, soft-ink label or SVG icon; hover and pressed states fill raised glass with ink text. Keyboard shortcuts (Q, T, F) mirror them. The first tool downloads the session as CSV.
- **Rejoin (phone status bar):** a compact 36px amber pill at the end of the status bar, shown only when the presenter has been unreachable for 10 seconds or is missing. It reloads the page.
- **Chip button (question actions):** 36px pill, hairline ring, faint-ink text with an icon; hover brightens to ink.

### Chips
- **Emoji chip:** 48px circle on raised glass with a hairline ring, emoji at 1.4rem, at 55% opacity when unselected (90% on hover). Selected is full opacity with a 2px amber inset ring; press scales to 0.92.
- **Tag:** small pill with a strong hairline ring, 0.8rem 600 soft-ink text ("Yours", "Your vote"); the answered tag takes live teal for both text and ring.

### Cards / Containers
There are no cards. Content sits directly on the glass, grouped by hairlines and space.
- **Panels (presenter):** no fill; a 2px strong hairline on top, a soft-ink 650 title with a faint tabular count.
- **Wells:** deep glass with a hairline ring and 12px corners (snippet, corner picker), 1.5rem internal padding.
- **Question rows:** separated by 1px hairlines, 1rem vertical padding; answered rows drop to 50% opacity, hidden ones to 30% with a strike-through.

### Inputs / Fields
- **Style:** deep-glass fill, strong hairline inset ring, 12px corners, 48px minimum height, ink text, faint-ink placeholders. The large variant (poll question) steps up to title-small size at 600. A one-line inline field (custom emoji) uses the pill shape at 44px.
- **Focus:** 2px amber outline offset 2px; hover darkens the ring to faint ink.
- **Error:** an ember line of label-size text under the form, reserved space so nothing jumps.
- **Switch:** a 2.75rem pill track on deep glass with a soft-ink knob; checked fills the track amber and the knob turns lamp-shadow.
- **Corner picker:** the choice is the preview: four radio labels sit at the corners of a small 16:9 well; the checked label lifts onto raised glass with the lift shadow and an amber-filled radio.

### Navigation
- **Landing bar:** the wordmark (700, 1.25rem, -0.02em) led by the amber brand dot with its halo, then label-size 500 soft-ink links that brighten to ink on hover, with a GitHub SVG icon. Below 640px only the source link remains.
- **Phone tabs:** a two-up segmented control: pill track on deep glass with a hairline ring, 44px pill tabs in soft ink; the selected tab rises onto raised glass with the lift shadow. An ink badge with tabular digits counts new questions.
- **Phone status bar:** sticky, blurred night glass, a breathing status dot (faint ink) while joining or reconnecting that turns steady live teal once connected, or ember when the room is missing. The Rejoin pill appears at its end when the connection doesn't come back on its own.

### Frost Pane (signature)
The fog canvas: a 192px tile of translucent frost with baked grain, rendered at half resolution behind content. A pointer or finger wipes soft radial discs along its path; wipes decay exponentially back to haze (5.2s on the landing and gate, 2.4s on the presenter stage). Peers appear as soft clear prints at a stable, ID-derived spot (on the landing, inside the right-hand region beside the live count), and a leaving peer's print hands over to the decay instead of vanishing. On the landing, a single authored stroke wipes across the headline once fonts load (skipped under reduced motion), and other visitors' wipe strokes arrive live. The canvas re-reads its colours when the theme flips. Under reduced motion it is static and the page stays fully legible.

### Live Head Count (signature)
The presenter's join column ends in the numeral role (tabular, 700, up to 9rem) above a soft-ink "people here" label that agrees in number. On the landing, the pane's own count sits bottom-right on the glass: a small dot (faint ink alone, live teal with company) and one honest sentence. A full pane (12 people) says so in the same sentence instead of pretending.

### Poll Results
Presenter bars are pill tracks of hairline tone that fill from the left over 700ms ease-out; the leading option fills ink, the others faint ink; each row pairs the label with a tabular "count · percent". On the phone, each option is a 60px raised-glass button; after voting, a translucent ink wash and a 4px soft-ink underline grow to the option's share, and the voted option keeps its 2px amber ring.

### Floating Reactions
Emoji rise from the bottom of a fixed, non-interactive layer over 2.4–3.4s (easing cubic-bezier(.2,.6,.3,1)), drifting gently side to side, fading in and out, capped at 40 at once. On the projector they stay out of the QR column. Under reduced motion they fade in and out in place.

### Widget Dock
A guest in someone else's page, rendered in a Shadow DOM: 36px translucent pills (blurred night glass, hairline ring, guest float shadow) in the chosen corner, 16px from the edges. The reader count pill (live dot plus tabular "N readers here") appears only when someone else is present; a reaction toggle opens a tray of 34px circular emoji buttons; reading positions are 6px dots in a 14px right margin that glide over 900ms. Past 30 readers the extra browsers leave the mesh: the toggle and dots disappear and the count pill reads "30+ readers here". It uses the system UI stack at 13px, follows only the OS colour scheme, hides in print, and fails silently.

## Do's and Don'ts

### Do:
- **Do** reserve amber for interactive elements and their states (fill, selected ring, focus outline, caret, link underline); keep results and counts in ink.
- **Do** set every count in tabular digits beside the word for what it counts.
- **Do** outline surfaces with inset hairline rings (`line`, `line-strong`) and keep borders for dividers.
- **Do** put type and controls where they stay legible over any amount of haze, and keep the page fully legible with the fog static under reduced motion.
- **Do** tie every print on the glass to a real connected peer, and let a leaving peer's print mist over rather than vanish.
- **Do** clear the presenter's fog completely when voting closes, and only then.
- **Do** use exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) at 140 / 260 / 640ms for state changes, seconds for fog return, and collapse durations to zero under reduced motion.
- **Do** keep the QR code dark on a pure white plate in both modes.
- **Do** flip every colour token together for light mode (the morning pane) and darken amber when it is used as text.

### Don't:
- **Don't** introduce a second accent or use amber for decoration, charts or status.
- **Don't** fake presence: no decorative prints, placeholder peers, invented counts or animated fog that nobody caused.
- **Don't** fog the audience phone or the widget; legibility and the host page come first there.
- **Don't** clear the fog wholesale for anything other than the presenter's decisive moment.
- **Don't** use bouncy or elastic easing; motion breathes and settles.
- **Don't** add cards with fills and shadows to group content; use space and hairlines on the glass.
- **Don't** set labels in uppercase or open letter-spacing, or add a second type family beyond the monospace used for code.
- **Don't** shrink projected presenter text below the label step or remove its viewport scaling.
- **Don't** let anything pulse except a status dot during an in-progress state (joining, reconnecting); once connected it holds still.
