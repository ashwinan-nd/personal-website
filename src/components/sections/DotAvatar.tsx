'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** transparent-background sprite in /public (single row of frames) */
  src: string
  /** number of frames in the sprite row (must match scripts/build-avatar.mjs SELECT length) */
  frames?: number
  /** displayed height in px (≈ 4 background tiles = 4 × 68) */
  displayH?: number
  className?: string
}

// Dot field tuning
const GRID_W = 116        // horizontal dot resolution (dense enough to read solid)
const REST_FRAME_HOLD = 0 // frame index shown at scroll top

/**
 * Frame-driven dot-field portrait — rebuilt from a TRANSPARENT source.
 *
 * The sprite (built by scripts/build-avatar.mjs) already has its studio
 * background removed, so the subject mask here is simply `alpha > 0`. No runtime
 * flood-fill, no protected ellipse — which is what previously produced stray
 * dots, laptop artifacts, and tile bleed-through. Each frame is sampled once into
 * a shared dot grid; on scroll the frame index interpolates (down = look down,
 * up = return to a straight smile), and an opaque white base under the ink dots
 * guarantees a gap-free face with no tiles showing through.
 */
export default function DotAvatar({ src, frames = 6, displayH = 272, className }: Props) {
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
      const FRAMES = frames
      const frameW = img.width / FRAMES
      const frameH = img.height
      const aspect = frameH / frameW
      const cssW = Math.round(displayH / aspect)
      const cssH = displayH
      const GRID_H = Math.round(GRID_W * aspect)
      const CELLS = GRID_W * GRID_H

      const tmp = document.createElement('canvas')
      tmp.width = GRID_W
      tmp.height = GRID_H
      const tctx = tmp.getContext('2d', { willReadFrequently: true })!

      // Per-frame per-cell darkness (0 = transparent/empty via alpha mask).
      const frameDark: Float32Array[] = []
      const anySubject = new Uint8Array(CELLS)

      for (let f = 0; f < FRAMES; f++) {
        tctx.clearRect(0, 0, GRID_W, GRID_H)
        tctx.drawImage(img, f * frameW, 0, frameW, frameH, 0, 0, GRID_W, GRID_H)
        const data = tctx.getImageData(0, 0, GRID_W, GRID_H).data
        const df = new Float32Array(CELLS)
        for (let p = 0; p < CELLS; p++) {
          const i = p * 4
          const a = data[i + 3]
          if (a < 40) continue // transparent -> not subject
          const L = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
          df[p] = (1 - L) * (a / 255)
          anySubject[p] = 1
        }
        frameDark.push(df)
      }

      // Stable dot positions = union of all subject cells.
      const cell = cssW / GRID_W
      const maxR = cell * 0.66
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
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      const whiteR = cell * 0.92 // overlaps neighbours -> opaque silhouette (no tile bleed)

      const draw = (reveal: number, frameF: number, tMs: number) => {
        ctx.clearRect(0, 0, cssW, cssH)
        const fLo = Math.floor(frameF)
        const fHi = Math.min(FRAMES - 1, fLo + 1)
        const ft = frameF - fLo
        const dLo = frameDark[fLo], dHi = frameDark[fHi]
        const n = idxs.length
        const rr: number[] = new Array(n)
        const av: number[] = new Array(n)
        const pr: number[] = new Array(n)
        const dxA: number[] = new Array(n)
        const dyA: number[] = new Array(n)
        for (let k = 0; k < n; k++) {
          const p = idxs[k]
          const dark = dLo[p] * (1 - ft) + dHi[p] * ft
          let rv = 1
          if (reveal < 1) {
            const dist = Math.hypot(px[k] - cssW / 2, py[k] - cssH * 0.4)
            rv = Math.min(1, Math.max(0, (reveal - (dist / (cssW * 0.7)) * 0.5) / 0.5))
          }
          // min floor so subject cells never leave a blank gap on the face
          const present = dark > 0.015 ? Math.max(dark, 0.26) : 0
          pr[k] = present
          rr[k] = present > 0 ? maxR * (0.34 + 0.86 * Math.pow(present, 0.8)) * rv : 0
          av[k] = present > 0 ? (0.52 + 0.48 * present) * rv : 0
          let dx = px[k], dy = py[k]
          if (!prefersReduced) {
            const ph = tMs * 0.0016 + seed[k] * 0.12
            dx += Math.cos(ph) * 0.16; dy += Math.sin(ph * 1.1) * 0.16
          }
          dxA[k] = dx; dyA[k] = dy
        }
        // Opaque white base — overlapping discs form a solid silhouette so no
        // background tiles show through the figure.
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 1
        for (let k = 0; k < n; k++) {
          if (pr[k] <= 0) continue
          ctx.beginPath(); ctx.arc(dxA[k], dyA[k], whiteR * (rr[k] > 0 ? 1 : 0), 0, Math.PI * 2); ctx.fill()
        }
        // Ink dots
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
        const prog = Math.min(1, Math.max(0, window.scrollY / (vh * 0.38)))
        return REST_FRAME_HOLD + prog * (FRAMES - 1 - REST_FRAME_HOLD)
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
          cur += (target - cur) * 0.16 // smooth, reversible frame lerp
          draw(eased, cur, t)
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [src, frames, displayH])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Animated dot-style portrait of Ashwin Anand"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 86%, transparent 99%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black 86%, transparent 99%)',
      }}
    />
  )
}
