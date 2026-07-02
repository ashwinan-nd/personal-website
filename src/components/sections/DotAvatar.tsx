'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** multi-frame sprite sheet in /public */
  src: string
  className?: string
}

// Sprite sheet layout: 5 columns x 6 rows = 30 frames, ordered left-to-right,
// top-to-bottom, animating from head-up (frame 0) to head-down-at-laptop (29).
const COLS = 5
const ROWS = 6
const FRAMES = COLS * ROWS
const GRID_W = 92            // dot density (held constant)
const BOTTOM_CROP = 0.86     // sample only the top 86% of each frame (slight bottom crop)

/**
 * Frame-driven dot-field portrait.
 *
 * Every frame of the sprite sheet is sampled once into the same dot grid
 * (background removed by border flood-fill + a generous protected ellipse).
 * On scroll, the current frame index = scrollProgress * (FRAMES-1); the render
 * interpolates each dot's darkness between the two neighbouring frames, so the
 * head-tilt reads as smooth frame-to-frame motion with no stutter. A white base
 * pass + a per-dot minimum keeps the face gap-free and solid over the tiles.
 */
export default function DotAvatar({ src, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let cancelled = false

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.src = src

    img.onload = () => {
      if (cancelled) return

      const frameW = img.width / COLS
      const frameH = img.height / ROWS
      const cropH = frameH * BOTTOM_CROP
      const aspect = cropH / frameW
      const cssW = 300
      const cssH = Math.round(cssW * aspect)
      const GRID_H = Math.round(GRID_W * aspect)
      const CELLS = GRID_W * GRID_H

      const tmp = document.createElement('canvas')
      tmp.width = GRID_W
      tmp.height = GRID_H
      const tctx = tmp.getContext('2d', { willReadFrequently: true })!

      // Per-frame per-cell darkness (0 = background/empty).
      const frameDark: Float32Array[] = []
      const anySubject = new Uint8Array(CELLS)

      for (let f = 0; f < FRAMES; f++) {
        const col = f % COLS
        const row = (f / COLS) | 0
        tctx.clearRect(0, 0, GRID_W, GRID_H)
        tctx.drawImage(img, col * frameW, row * frameH, frameW, cropH, 0, 0, GRID_W, GRID_H)
        const data = tctx.getImageData(0, 0, GRID_W, GRID_H).data

        // seed = top-row average (the wall)
        let sr = 0, sg = 0, sb = 0
        for (let x = 0; x < GRID_W; x++) { const i = x * 4; sr += data[i]; sg += data[i + 1]; sb += data[i + 2] }
        sr /= GRID_W; sg /= GRID_W; sb /= GRID_W

        // border flood-fill removes the connected light wall
        const bg = new Uint8Array(CELLS)
        const TOL = 210
        const stack: number[] = []
        const consider = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return
          const p = y * GRID_W + x
          if (bg[p]) return
          const i = p * 4
          if (Math.abs(data[i] - sr) + Math.abs(data[i + 1] - sg) + Math.abs(data[i + 2] - sb) < TOL) { bg[p] = 1; stack.push(p) }
        }
        for (let x = 0; x < GRID_W; x++) { consider(x, 0); consider(x, GRID_H - 1) }
        for (let y = 0; y < GRID_H; y++) { consider(0, y); consider(GRID_W - 1, y) }
        while (stack.length) {
          const p = stack.pop()!
          consider((p % GRID_W) + 1, (p / GRID_W) | 0); consider((p % GRID_W) - 1, (p / GRID_W) | 0)
          consider(p % GRID_W, ((p / GRID_W) | 0) + 1); consider(p % GRID_W, ((p / GRID_W) | 0) - 1)
        }
        // protect the face core only (tight enough to avoid a wall "ring",
        // tall enough to cover the head as it lowers across frames)
        const cx = GRID_W * 0.5, cy = GRID_H * 0.40, rx = GRID_W * 0.23, ry = GRID_H * 0.40
        for (let y = 0; y < GRID_H; y++) {
          for (let x = 0; x < GRID_W; x++) {
            const nx = (x - cx) / rx, ny = (y - cy) / ry
            if (nx * nx + ny * ny <= 1) bg[y * GRID_W + x] = 0
          }
        }

        const df = new Float32Array(CELLS)
        for (let p = 0; p < CELLS; p++) {
          if (bg[p]) continue
          const i = p * 4
          const L = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
          df[p] = 1 - L
          anySubject[p] = 1
        }
        frameDark.push(df)
      }

      // Stable dot positions = cells that are subject in ANY frame.
      const cell = cssW / GRID_W
      const maxR = cell * 0.62
      const idxs: number[] = []
      const px: number[] = [], py: number[] = [], seed: number[] = []
      for (let p = 0; p < CELLS; p++) {
        if (!anySubject[p]) continue
        const x = p % GRID_W, y = (p / GRID_W) | 0
        idxs.push(p)
        px.push(x * cell + cell / 2)
        py.push(y * cell + cell / 2)
        seed.push((x * 7 + y * 13) % 100)
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      const whiteR = cell * 0.62

      const draw = (reveal: number, frameF: number, tMs: number) => {
        ctx.clearRect(0, 0, cssW, cssH)
        const fLo = Math.floor(frameF)
        const fHi = Math.min(FRAMES - 1, fLo + 1)
        const ft = frameF - fLo
        const dLo = frameDark[fLo], dHi = frameDark[fHi]
        const n = idxs.length
        const rr: number[] = new Array(n)
        const av: number[] = new Array(n)
        const dxA: number[] = new Array(n)
        const dyA: number[] = new Array(n)
        for (let k = 0; k < n; k++) {
          const p = idxs[k]
          let dark = dLo[p] * (1 - ft) + dHi[p] * ft
          let rv = 1
          if (reveal < 1) {
            const dist = Math.hypot(px[k] - cssW / 2, py[k] - cssH * 0.4)
            rv = Math.min(1, Math.max(0, (reveal - (dist / (cssW * 0.7)) * 0.5) / 0.5))
          }
          // min floor so subject cells never leave a blank gap on the face
          const present = dark > 0.02 ? Math.max(dark, 0.24) : 0
          rr[k] = present > 0 ? maxR * (0.30 + 0.9 * Math.pow(present, 0.8)) * rv : 0
          av[k] = present > 0 ? (0.5 + 0.5 * present) * rv : 0
          let dx = px[k], dy = py[k]
          if (!prefersReduced) {
            const ph = tMs * 0.0016 + seed[k] * 0.12
            dx += Math.cos(ph) * 0.18; dy += Math.sin(ph * 1.1) * 0.18
          }
          dxA[k] = dx; dyA[k] = dy
        }
        // white base
        ctx.fillStyle = '#ffffff'
        for (let k = 0; k < n; k++) {
          if (rr[k] <= 0) continue
          ctx.globalAlpha = 0.92
          ctx.beginPath(); ctx.arc(dxA[k], dyA[k], whiteR, 0, Math.PI * 2); ctx.fill()
        }
        // ink
        ctx.fillStyle = '#0a1628'
        for (let k = 0; k < n; k++) {
          if (rr[k] <= 0) continue
          ctx.globalAlpha = av[k]
          ctx.beginPath(); ctx.arc(dxA[k], dyA[k], rr[k], 0, Math.PI * 2); ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      const frameFor = () => {
        const vh = window.innerHeight || 800
        const prog = Math.min(1, Math.max(0, window.scrollY / (vh * 0.6)))
        return prog * (FRAMES - 1)
      }

      let start = 0
      let cur = 0
      const loop = (t: number) => {
        if (cancelled) return
        if (!start) start = t
        const reveal = prefersReduced ? 1 : Math.min(1, (t - start) / 1100)
        const eased = 1 - Math.pow(1 - reveal, 3)
        if (window.scrollY < (window.innerHeight || 800) * 1.25) {
          const target = frameFor()
          cur += (target - cur) * 0.18 // smoothing between frames
          draw(eased, cur, t)
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [src])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Animated dot-style portrait of Ashwin Anand"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 84%, transparent 99%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black 84%, transparent 99%)',
        borderRadius: 20,
      }}
    />
  )
}
