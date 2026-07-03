# Personal Website — Session Handoff

Last updated: 2026-07-02. Repo: `ashwinan-nd/personal-website`. Stack: **Next.js 16
(App Router) + React 19 + TypeScript + Tailwind v4 + Three.js/R3F + Framer Motion +
Lenis**. Dev: `npm run dev` (falls to `:3001` if `:3000` is taken). Reference feel:
adamhickey.com.

---

## How to run + verify

```bash
cd ~/personal-website
npm install          # if node_modules missing
npm run dev          # http://localhost:3001
npm run build        # must pass clean (TS + 7/7 static pages)
```

Verify in a real browser (chrome-devtools MCP). The avatar animation and hover
interaction MUST be confirmed by real scrolling/hovering, not by reading code.
Handy proof snippet (run in page): hash the avatar canvas twice at the same scroll
(idle should differ) and after scrolling (should differ) — both `true` = animation live.

---

## Page structure (`src/app/page.tsx`)

`<Hero /> <LogoBar /> <Passions /> <OpenSource /> <Contact />`
All top-level `<section>`s get an opaque bg + `isolation: isolate` + `scroll-margin-top`
from `globals.css` (the "section separation contract"). Anchors: `#hero #passions
#opensource #contact`.

---

## Key components + current behavior

### Hero — `src/components/sections/Hero.tsx`
- Dot avatar (left of name), name, 3 nav pills (class `hero-nav`, hidden when the
  menu is open via `body.menu-open`), scroll cue. Content nudged up (`translateY(-3vh)`).
- **Name → tagline hover/focus swap**: name fades out, tagline fades in from the same
  spot. Soft 0.55s crossfade both ways. Tagline = "Building enterprise systems and
  0-to-1 systems that make hard problems simple." — wrapping block at `width:min(64vw,540px)`
  so it breaks ~3-4 words/line. Keyboard-focusable (`tabIndex=0` + onFocus/onBlur),
  reduced-motion aware, absolute layer so no layout shift.

### DotAvatar — `src/components/sections/DotAvatar.tsx`  ← the centerpiece
- **Frame-driven** from a sprite sheet `public/ashwin-frames.png` (source:
  `~/Downloads/IMG_9477.png`). Layout: **5 cols × 6 rows = 30 frames**, ordered
  L→R, top→bottom, animating head-up (frame 0) → head-down-at-laptop (frame 29).
- Each frame is sampled once into a dot grid (`GRID_W=92`), wall removed by border
  flood-fill (`TOL=210`) + a **tight protected face ellipse** (rx 0.23, ry 0.40 — this
  removes the shadow "chat-bubble" lobe while keeping the whole face). `BOTTOM_CROP=0.86`.
- Render: `frame = scrollProgress*(29)`; per-dot darkness interpolates between the two
  neighbouring frames + eased smoothing (`cur += (target-cur)*0.18`) → smooth motion.
- **White base pass** under the ink dots so tiles never show through; per-dot minimum
  floor (`Math.max(dark,0.24)`) so the face has zero blank gaps. Idle breathing keeps
  it alive at rest. Continuous rAF reads `window.scrollY` every frame (no settle-stop).
- CSS mask fades the bottom + rounds corners.
- **Architecture note:** it's ready to accept Ashwin's future animated GIF without
  rework — the loop just paints; a GIF would replace the paint step. Keep the
  frame-driven path as the fallback.
- History carried forward (do NOT reintroduce): shadow silhouette, gray-circle
  backdrop, chat-bubble lobe — all fixed. `public/ashwin.png` is the old single photo
  (no longer used by the avatar; keep for reference).

### LogoBar — `src/components/sections/LogoBar.tsx`
- Centered fading **marquee** (seamless -50% loop, edge mask). Real logo files
  (Ashwin's own downloads) in `public/logos/`: `asuw.png wwf.webp zuper.png tesla.png
  delta.png aws.jpeg kraken.avif`. Rendered grayscale (`filter: grayscale(1)
  opacity(0.6)`), aspect preserved, per-logo `h`. Bar moved up (`-mt-20`).
- To add/replace a logo: drop the file in `public/logos/`, set `src` + `h` in `LOGOS`.

### Passions ("My Passions Explained") — `src/components/sections/Passions.tsx`
- Left-aligned title with page margin; subtitle beneath. Centered **2×3 grid** of 6
  neomorphic tiles, no eyebrows, centered pill titles, expand icon top-right.
- Tiles: Space (GlobeVisual), High Finance (FinanceVisual — server proxy),
  GPU & Hardware (GPUVisual), Financial Literacy (LiteracyChart), Agents for Agents
  (AgentNetwork), Cooking (CookingVisual).
- Tile preview scaling uses `transform: scale(k)` + `transformOrigin:'top center'` +
  flex-justify-center so Space/GPU sit centered.
- Click a tile → animates to center over a dim backdrop, flips to the description
  (floating "Visual"/"Close" controls, ESC + backdrop dismiss, Lenis paused).
- Visuals in `src/components/sections/passions/`:
  - GlobeVisual: navy globe, dotted surface texture, tight orbit rings, colored
    satellites, larger orbiting Moon; camera zoomed out + centered.
  - GPUVisual: 3D H100 (explode-view button), single shared-speed rotation, centered.
  - CookingVisual: metallic riveted pan, **food layered above pan**, gas flame (blue
    cones + dark inner + orange tips), ingredients, steam. Loop verified.
  - LiteracyChart: rebuilt — bars never overflow, context header + units + gap label.
  - FinanceVisual: ticker + S&P chart via `/api/stocks` + `/api/sp500` (key server-side).

### OpenSource ("Exploring ideas in public.") — `src/components/sections/OpenSource.tsx`
- Left-aligned title + "Personal projects, constantly being worked on."
- Two project pills (Personal Website, Launch Lunar) with real preview screenshots
  (`public/preview-website.png`, `public/preview-launchlunar.png`), working GitHub
  links, tech chips, 2-line clamped descriptions.
- "Read Product Digest" → expands a PM-style pill below (Problem / What it does /
  Design plan / Engineering plan / Status), scoped scroll (`data-lenis-prevent` +
  overscroll-contain), X to collapse.

### Navbar — `src/components/layout/Navbar.tsx`
- Fixed top-right: menu toggle + LinkedIn + GitHub. Dropdown is absolutely positioned
  (opening never shifts the icons). Escape + scroll + outside-click close it. Styled
  links with icons. Sets `body.menu-open` to hide the hero nav pills.
- **LinkedIn URL** = `https://www.linkedin.com/in/ashwin-anand-/` — VERIFY this handle
  is correct (the two earlier values disagreed).

### Contact, SmoothScroll, CustomCursor, TileGrid — unchanged working baseline.
- `CustomCursor`: hidden native cursor over the site; bails under reduced-motion.
- `globals.css`: the `*` reset lives in `@layer base` so Tailwind v4 padding/margin
  utilities actually apply (do NOT move it out of the layer — it re-breaks all spacing).

---

## SECURITY — action still owed by Ashwin (unresolved)

The Finnhub key `d853…6jfg` was hardcoded and committed in the **initial commit**,
which is pushed to the **public** GitHub repo. It's now moved to gitignored
`.env.local` (`FINNHUB_API_KEY`, used only in `src/app/api/**` server routes — proven
absent from the client bundle: `grep -rl <key> .next/static` = 0). **The key must be
ROTATED at finnhub.io** (revoke old, create new, paste into `.env.local`). Purging git
history is a force-push (rewrites public history) — present the exact `git filter-repo`
commands for explicit confirmation; do NOT run without it. Also `POLYGON_API_KEY` (sp500).

---

## Open threads / next up

1. **Rotate the Finnhub key** (above) — only Ashwin can (needs his account).
2. **Animated GIF**: Ashwin is producing one; swap it into DotAvatar when ready,
   keeping the frame-driven path as fallback.
3. **Verify the LinkedIn handle** in `Navbar.tsx`.
4. Section-overlap check reports "1" — intentional: LogoBar `-mt-20` reaches into the
   hero's EMPTY bottom zone to move the bar up. No visual collision. Not a bug.
5. Benign dev-only warnings remain (framer scroll-container, three.js Clock/PCFShadow
   deprecations) — stripped in prod, not errors.

---

## Commit history (this project's arc, newest first)

frame-driven avatar → bigger real logos + Kraken + softer hover → realistic cooking
flame → (earlier) hover tagline + tile centering → avatar cutout fixes → section-3
digests → tailwind padding-layer fix + logo marquee + passions rework → 2×3 flip grid
+ logo bar + globe/gpu → home dot-avatar + head tilt. All additive; nothing force-pushed.
