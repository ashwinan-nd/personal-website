// Bake a TRANSPARENT-background avatar sprite from the raw Gemini sprite sheet.
//
// Root-cause fix: the old pipeline removed the background at runtime, per frame,
// on a 92px grid with a protected ellipse — which misclassified pixels (stray
// dots), left the laptop in (random shape), and let tiles bleed through. Here we
// remove the cream studio background ONCE, at source, via border flood-fill, and
// physically crop the laptop out, then emit a clean transparent sprite that the
// renderer samples by ALPHA. No guessing at render time.
//
// Usage: node scripts/build-avatar.mjs [scratchDirForPreview]
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'public', 'ashwin-frames.png')
const OUT = path.join(__dirname, '..', 'public', 'ashwin-avatar.png')

// Source sprite layout
const COLS = 5, ROWS = 6

// Frames that form a clean smile -> slowly-look-down ramp. Row 0 (0..4) is the
// full head-up -> head-down motion and contains NO laptop, so no laptop removal
// is needed and the navy torso stays intact. Rendered order = scroll progress 0..1.
const SELECT = [0, 1, 2, 3, 4, 5, 6, 7]
const REMOVE_LAPTOP = false

// The laptop (a neutral charcoal bar) rises into the bottom of later frames.
// We keep full frame height for a portrait figure and instead remove the laptop
// explicitly: in the bottom band, clear pixels that are very dark AND neutral
// (laptop is grey; the navy suit is blue-ish, so it survives).
const LAPTOP_BAND = 0.66   // only seed the fill below this fraction of frame height
// Laptop = a NEUTRAL grey mass; the navy suit is blue (b noticeably > r). Keying
// on blue-ness (not darkness) removes the whole laptop, edges included, while the
// suit survives regardless of shadow depth.
const LAPTOP_MAXAVG = 125   // ignore anything lighter than this (shirt/skin)
const LAPTOP_SPREAD = 22    // max (maxChannel-minChannel)
const LAPTOP_BLUE = 12      // max (b - r); navy suit is ~+30, laptop ~0

// "Wall" (studio cream) test — brightness + neutrality. Cream is light AND
// desaturated (R≈G≈B). Skin is warm (R>G>B, wide spread) so it fails the test
// even if a thin path reaches it; hair/suit/laptop are dark and fail brightness.
// This bounds the flood on the subject regardless of the shadow gradient, which
// a single-seed tolerance could not do.
const WALL_MIN = 120  // min avg RGB to be wall (low enough to bridge left shadow)
const WALL_SPREAD = 50 // max (maxChannel - minChannel) to still count as neutral
// Halo pass: pixels this bright+neutral that touch a cleared pixel are edge
// anti-aliasing crumbs of the wall — clear them too.
const HALO_MIN = 150
const HALO_PASSES = 3

const meta = await sharp(SRC).metadata()
const fw = Math.floor(meta.width / COLS)
const fh = Math.floor(meta.height / ROWS)
const cropH = fh // keep full height; laptop removed explicitly below

const { data: full } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const SW = meta.width

function processFrame(fx, fy) {
  // Extract frame -> RGBA Uint8 (fw x cropH), background removed.
  const out = Buffer.alloc(fw * cropH * 4)
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < fw; x++) {
      const si = ((fy + y) * SW + (fx + x)) * 4
      const di = (y * fw + x) * 4
      out[di] = full[si]; out[di + 1] = full[si + 1]; out[di + 2] = full[si + 2]; out[di + 3] = 255
    }
  }
  const N = fw * cropH
  const isWall = (p) => {
    const i = p * 4
    const r = out[i], g = out[i + 1], b = out[i + 2]
    const avg = (r + g + b) / 3
    if (avg < WALL_MIN) return false
    const spread = Math.max(r, g, b) - Math.min(r, g, b)
    return spread < WALL_SPREAD
  }
  const bg = new Uint8Array(N)
  const stack = []
  const consider = (x, y) => {
    if (x < 0 || y < 0 || x >= fw || y >= cropH) return
    const p = y * fw + x
    if (bg[p] || !isWall(p)) return
    bg[p] = 1; stack.push(p)
  }
  // Seed from all four borders (border is always wall in a studio portrait).
  for (let x = 0; x < fw; x++) { consider(x, 0); consider(x, cropH - 1) }
  for (let y = 0; y < cropH; y++) { consider(0, y); consider(fw - 1, y) }
  while (stack.length) {
    const p = stack.pop()
    const x = p % fw, y = (p / fw) | 0
    consider(x + 1, y); consider(x - 1, y); consider(x, y + 1); consider(x, y - 1)
  }
  // Halo pass: bright+neutral crumbs touching a cleared pixel are wall AA edges.
  for (let pass = 0; pass < HALO_PASSES; pass++) {
    const add = []
    for (let p = 0; p < N; p++) {
      if (bg[p]) continue
      const i = p * 4
      const r = out[i], g = out[i + 1], b = out[i + 2]
      if ((r + g + b) / 3 < HALO_MIN) continue
      if (Math.max(r, g, b) - Math.min(r, g, b) >= WALL_SPREAD) continue
      const x = p % fw, y = (p / fw) | 0
      if ((x > 0 && bg[p - 1]) || (x < fw - 1 && bg[p + 1]) ||
          (y > 0 && bg[p - fw]) || (y < cropH - 1 && bg[p + fw])) add.push(p)
    }
    for (const p of add) bg[p] = 1
  }
  // Laptop removal: in the bottom band, clear dark+neutral pixels (grey laptop),
  // then flood that removal upward through connected dark-neutral so the whole
  // lid goes, without touching the blue-ish navy suit.
  const bandY = Math.floor(cropH * LAPTOP_BAND)
  const isLaptop = (p) => {
    const i = p * 4
    if (out[i + 3] === 0) return false
    const r = out[i], g = out[i + 1], b = out[i + 2]
    if ((r + g + b) / 3 > LAPTOP_MAXAVG) return false
    if (Math.max(r, g, b) - Math.min(r, g, b) >= LAPTOP_SPREAD) return false
    return (b - r) < LAPTOP_BLUE // navy suit (b >> r) survives
  }
  const lap = new Uint8Array(N)
  const lstack = []
  if (REMOVE_LAPTOP) for (let y = bandY; y < cropH; y++) for (let x = 0; x < fw; x++) {
    const p = y * fw + x
    if (!lap[p] && isLaptop(p)) { lap[p] = 1; lstack.push(p) }
  }
  while (lstack.length) {
    const p = lstack.pop()
    const x = p % fw, y = (p / fw) | 0
    const nb = [p + 1, p - 1, p + fw, p - fw]
    for (const q of nb) {
      if (q < 0 || q >= N) continue
      const qx = q % fw
      if (Math.abs(qx - x) > 1) continue
      if (!lap[q] && isLaptop(q)) { lap[q] = 1; lstack.push(q) }
    }
  }
  for (let p = 0; p < N; p++) if (lap[p]) bg[p] = 1

  // Keep ONLY the largest connected subject component (the figure) — every other
  // opaque island is a stray crumb and gets cleared. This guarantees a single
  // clean figure with no floating dot shapes. The white collar is interior (not
  // border-connected) so it never severs the head from the torso.
  const seen = new Uint8Array(N)
  const comps = []
  for (let s = 0; s < N; s++) {
    if (bg[s] || seen[s]) continue
    const comp = [s]; seen[s] = 1
    const q = [s]
    while (q.length) {
      const p = q.pop()
      const x = p % fw, y = (p / fw) | 0
      const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
      for (const [nx, ny] of nb) {
        if (nx < 0 || ny < 0 || nx >= fw || ny >= cropH) continue
        const np = ny * fw + nx
        if (bg[np] || seen[np]) continue
        seen[np] = 1; comp.push(np); q.push(np)
      }
    }
    comps.push(comp)
  }
  comps.sort((a, b) => b.length - a.length)
  for (let ci = 1; ci < comps.length; ci++) for (const p of comps[ci]) bg[p] = 1

  // Apply mask: background -> fully transparent.
  for (let p = 0; p < N; p++) if (bg[p]) out[p * 4 + 3] = 0
  return out
}

// Subject metrics. The head (top half of the subject) is the alignment anchor:
// its bounding box gives a stable centre-x, width, and top that don't get thrown
// off by varying shoulders the way a single widest-row measure does.
function metrics(raw) {
  let minX = fw, minY = cropH, maxX = 0, maxY = 0
  for (let y = 0; y < cropH; y++) for (let x = 0; x < fw; x++) {
    if (raw[(y * fw + x) * 4 + 3] > 30) {
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }
  // Head band = top 50% of the subject's vertical extent (head + neck, no shoulders).
  const headBot = minY + (maxY - minY) * 0.5
  let hMinX = fw, hMaxX = 0
  for (let y = minY; y <= headBot; y++) for (let x = 0; x < fw; x++) {
    if (raw[(y * fw + x) * 4 + 3] > 30) { if (x < hMinX) hMinX = x; if (x > hMaxX) hMaxX = x }
  }
  const headW = hMaxX - hMinX
  const headCx = (hMinX + hMaxX) / 2
  return { minX, minY, maxX, maxY, headW, headCx }
}

// Process + normalize each frame: scale so every head is the same width, and
// align by head-centre-x and subject-top. This lets us mix a zoomed-in "straight
// smile" rest frame with zoomed-out look-down frames without the head resizing.
const n = SELECT.length
const rawMetrics = []
for (let k = 0; k < n; k++) {
  const f = SELECT[k]
  const raw = processFrame((f % COLS) * fw, ((f / COLS) | 0) * fh)
  rawMetrics.push({ raw, m: metrics(raw) })
}
const targetHead = Math.min(...rawMetrics.map((r) => r.m.headW)) // scale down big heads
const WORK_W = fw * 2, WORK_H = Math.round(cropH * 1.25)
const WORK_CX = WORK_W / 2, TOP_Y = Math.round(WORK_H * 0.05)

const normFrames = []
for (const { raw, m } of rawMetrics) {
  const scale = targetHead / m.headW
  const bw = m.maxX - m.minX + 1, bh = m.maxY - m.minY + 1
  // tight-crop the subject, then scale
  const sub = Buffer.alloc(bw * bh * 4)
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const si = ((m.minY + y) * fw + (m.minX + x)) * 4, di = (y * bw + x) * 4
    sub[di] = raw[si]; sub[di + 1] = raw[si + 1]; sub[di + 2] = raw[si + 2]; sub[di + 3] = raw[si + 3]
  }
  const sw = Math.max(1, Math.round(bw * scale)), sh = Math.max(1, Math.round(bh * scale))
  const scaled = await sharp(sub, { raw: { width: bw, height: bh, channels: 4 } })
    .resize(sw, sh, { fit: 'fill' }).png().toBuffer()
  const left = Math.round(WORK_CX - (m.headCx - m.minX) * scale)
  const norm = await sharp({ create: { width: WORK_W, height: WORK_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: scaled, left: Math.max(0, left), top: TOP_Y }])
    .raw().toBuffer()
  normFrames.push(norm)
}

// Static torso: shoulders don't move when the head tilts, so composite ONE
// full-shouldered torso under every frame's head. This gives the rest frame
// (a zoomed-in "straight smile" with little torso in-source) a proper bust while
// the head still animates. Donor = the normalized frame with the widest shoulders.
function bottomWidth(nf) {
  let top = WORK_H, bot = 0
  for (let y = 0; y < WORK_H; y++) for (let x = 0; x < WORK_W; x++) if (nf[(y * WORK_W + x) * 4 + 3] > 30) { if (y < top) top = y; if (y > bot) bot = y }
  let w = 0
  for (let y = Math.round(top + (bot - top) * 0.6); y <= bot; y++) {
    let lo = WORK_W, hi = -1
    for (let x = 0; x < WORK_W; x++) if (nf[(y * WORK_W + x) * 4 + 3] > 30) { if (x < lo) lo = x; if (x > hi) hi = x }
    if (hi - lo > w) w = hi - lo
  }
  return { w, top, bot }
}
// Donor must be a clean bust (no laptop) — restrict to laptop-free source frames.
let donorIdx = 0, donorW = -1, donorTop = 0, donorBot = 0
normFrames.forEach((nf, i) => {
  if (SELECT[i] > 4) return // frames 5+ may contain the laptop
  const b = bottomWidth(nf); if (b.w > donorW) { donorW = b.w; donorIdx = i; donorTop = b.top; donorBot = b.bot }
})
const donor = normFrames[donorIdx]
const neckY = Math.round(donorTop + (donorBot - donorTop) * 0.5) // below the chin
const BLEND = 5
for (const nf of normFrames) {
  if (nf === donor) continue
  for (let y = neckY; y < WORK_H; y++) {
    // vertical feather across the neckline so head and torso merge cleanly
    const t = y < neckY + BLEND ? (y - neckY) / BLEND : 1
    for (let x = 0; x < WORK_W; x++) {
      const i = (y * WORK_W + x) * 4
      const da = donor[i + 3]
      if (da === 0 && t >= 1) continue
      if (t >= 1) { nf[i] = donor[i]; nf[i + 1] = donor[i + 1]; nf[i + 2] = donor[i + 2]; nf[i + 3] = donor[i + 3] }
      else {
        for (let c = 0; c < 4; c++) nf[i + c] = Math.round(nf[i + c] * (1 - t) + donor[i + c] * t)
      }
    }
  }
}

// Union bbox across normalized frames -> crop the sprite tight to the figure.
let minX = WORK_W, minY = WORK_H, maxX = 0, maxY = 0
for (const nf of normFrames) for (let y = 0; y < WORK_H; y++) for (let x = 0; x < WORK_W; x++) {
  if (nf[(y * WORK_W + x) * 4 + 3] > 30) {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
}
const PAD = 2
minX = Math.max(0, minX - PAD); minY = Math.max(0, minY - PAD)
maxX = Math.min(WORK_W - 1, maxX + PAD); maxY = Math.min(WORK_H - 1, maxY + PAD)
const cw = maxX - minX + 1, ch = maxY - minY + 1

const composites = []
for (let k = 0; k < n; k++) {
  const src = normFrames[k]
  const crop = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const si = ((minY + y) * WORK_W + (minX + x)) * 4, di = (y * cw + x) * 4
    crop[di] = src[si]; crop[di + 1] = src[si + 1]; crop[di + 2] = src[si + 2]; crop[di + 3] = src[si + 3]
  }
  const png = await sharp(crop, { raw: { width: cw, height: ch, channels: 4 } }).png().toBuffer()
  composites.push({ input: png, left: k * cw, top: 0 })
}
await sharp({ create: { width: cw * n, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(composites)
  .png()
  .toFile(OUT)

// Emit frame count so the renderer never desyncs from the sprite.
const META = path.join(__dirname, '..', 'src', 'components', 'sections', 'avatarMeta.ts')
await sharp(OUT).metadata() // ensure written
const fs = await import('node:fs')
fs.writeFileSync(META, `// AUTO-GENERATED by scripts/build-avatar.mjs — do not edit.\nexport const AVATAR_FRAMES = ${n}\nexport const AVATAR_ASPECT = ${+(cw / ch).toFixed(4)}\n`)

console.log(JSON.stringify({ frames: n, frameW: cw, frameH: ch, aspectWH: +(cw / ch).toFixed(3), targetHead, out: OUT }))

// Optional: checkerboard preview so stray shapes are visible against alpha.
const scratch = process.argv[2]
if (scratch) {
  const tile = 8
  const checkW = cw * n, checkH = ch
  const chk = Buffer.alloc(checkW * checkH * 3)
  for (let y = 0; y < checkH; y++) for (let x = 0; x < checkW; x++) {
    const on = ((x / tile | 0) + (y / tile | 0)) % 2 === 0
    const v = on ? 200 : 120
    const i = (y * checkW + x) * 3
    chk[i] = v; chk[i + 1] = v; chk[i + 2] = v
  }
  const base = sharp(chk, { raw: { width: checkW, height: checkH, channels: 3 } })
  const avatar = await sharp(OUT).toBuffer()
  await base.composite([{ input: avatar, left: 0, top: 0 }])
    .resize(checkW * 3, checkH * 3, { kernel: 'nearest' })
    .png().toFile(path.join(scratch, 'avatar-preview.png'))
  console.log('wrote avatar-preview.png')
}
