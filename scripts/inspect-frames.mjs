// Slice the 5x6 sprite sheet into a labeled contact sheet so we can pick the
// exact smile -> look-down frame range (excluding laptop + glitch frames).
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'public', 'ashwin-frames.png')
const OUT = path.join(__dirname, '..', '..', '..', 'private', 'tmp') // unused; write to scratch below

const COLS = 5, ROWS = 6
const meta = await sharp(SRC).metadata()
const fw = Math.floor(meta.width / COLS)
const fh = Math.floor(meta.height / ROWS)
console.log(JSON.stringify({ width: meta.width, height: meta.height, fw, fh }))

// Build a single-row contact sheet of every frame, downscaled, with index bars.
const scratch = process.argv[2]
const thumbW = 120
const thumbH = Math.round(thumbW * fh / fw)
const frames = []
for (let f = 0; f < COLS * ROWS; f++) {
  const col = f % COLS, row = (f / COLS) | 0
  const buf = await sharp(SRC)
    .extract({ left: col * fw, top: row * fh, width: fw, height: fh })
    .resize(thumbW, thumbH)
    .png().toBuffer()
  frames.push(buf)
}
// composite 6 rows x 5 cols contact sheet
const pad = 6
const sheetW = COLS * (thumbW + pad) + pad
const sheetH = ROWS * (thumbH + pad) + pad
const composites = frames.map((buf, f) => ({
  input: buf,
  left: pad + (f % COLS) * (thumbW + pad),
  top: pad + ((f / COLS) | 0) * (thumbH + pad),
}))
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#dddddd' } })
  .composite(composites)
  .png()
  .toFile(path.join(scratch, 'contact-sheet.png'))
console.log('wrote contact-sheet.png', sheetW, sheetH)
