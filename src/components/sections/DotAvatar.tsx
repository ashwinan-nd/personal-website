'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** image in /public */
  src: string
  className?: string
}

// Internal geometry resolution (CSS px). Display size is controlled by CSS
// (w-full h-auto), so this only sets the crispness of the dot field.
const RENDER_W = 340

/**
 * Halftone dot-field portrait, à la adamhickey.com.
 * - Samples the source photo onto a grid.
 * - Removes the (uniform) background via border flood-fill so only the
 *   subject renders as dots.
 * - Dot radius/alpha modulated by pixel darkness so facial features read.
 * - Center-out reveal on mount (skipped for prefers-reduced-motion).
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

      const aspect = img.height / img.width
      const cssW = RENDER_W
      const cssH = Math.round(cssW * aspect)

      // ── sample photo down to a dot grid ──────────────────────────────
      const GRID_W = 74
      const GRID_H = Math.round(GRID_W * aspect)
      const tmp = document.createElement('canvas')
      tmp.width = GRID_W
      tmp.height = GRID_H
      const tctx = tmp.getContext('2d', { willReadFrequently: true })!
      tctx.drawImage(img, 0, 0, GRID_W, GRID_H)
      const data = tctx.getImageData(0, 0, GRID_W, GRID_H).data

      const at = (x: number, y: number) => (y * GRID_W + x) * 4
      const diff = (i: number, r: number, g: number, b: number) =>
        Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b)

      // seed = average of the top row (reliably the wall above the head; the
      // bottom corners are the subject's suit, so corner-averaging is wrong)
      let sr = 0, sg = 0, sb = 0
      for (let x = 0; x < GRID_W; x++) {
        const i = at(x, 0); sr += data[i]; sg += data[i + 1]; sb += data[i + 2]
      }
      sr /= GRID_W; sg /= GRID_W; sb /= GRID_W

      // Fixed-seed flood fill inward from the border. Calibrated from the
      // actual photo: shadowed wall maxes ~188 from the wall colour, lit skin
      // starts ~191, so TOL 188 removes the connected wall (incl. its shadow)
      // while keeping the whole figure. The bright interior shirt is walled off
      // by darker subject pixels, so the border fill never reaches it.
      const bg = new Uint8Array(GRID_W * GRID_H)
      const TOL = 188
      const stack: number[] = []
      const consider = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return
        const p = y * GRID_W + x
        if (bg[p]) return
        if (diff(p * 4, sr, sg, sb) < TOL) { bg[p] = 1; stack.push(p) }
      }
      for (let x = 0; x < GRID_W; x++) { consider(x, 0); consider(x, GRID_H - 1) }
      for (let y = 0; y < GRID_H; y++) { consider(0, y); consider(GRID_W - 1, y) }
      while (stack.length) {
        const p = stack.pop()!
        const x = p % GRID_W
        const y = (p / GRID_W) | 0
        consider(x + 1, y); consider(x - 1, y); consider(x, y + 1); consider(x, y - 1)
      }

      // ── build dot list ───────────────────────────────────────────────
      type Dot = { cx: number; cy: number; r: number; a: number; dist: number }
      const dots: Dot[] = []
      const cell = cssW / GRID_W
      const maxR = cell * 0.62
      const cxc = cssW / 2
      const cyc = cssH * 0.42 // reveal radiates from the face, not geometric center
      let maxDist = 1

      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const p = y * GRID_W + x
          if (bg[p]) continue
          const i = p * 4
          const L = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
          const dark = 1 - L
          const cx = x * cell + cell / 2
          const cy = y * cell + cell / 2
          const dist = Math.hypot(cx - cxc, cy - cyc)
          if (dist > maxDist) maxDist = dist
          dots.push({
            cx,
            cy,
            r: maxR * (0.34 + 0.66 * dark),
            a: 0.5 + 0.5 * dark,
            dist,
          })
        }
      }

      // ── visible canvas (retina) ──────────────────────────────────────
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      const draw = (prog: number) => {
        ctx.clearRect(0, 0, cssW, cssH)
        ctx.fillStyle = '#0a1628'
        for (const d of dots) {
          const start = (d.dist / maxDist) * 0.5
          let local = (prog - start) / 0.5
          local = local < 0 ? 0 : local > 1 ? 1 : local
          if (local <= 0) continue
          ctx.globalAlpha = d.a * local
          ctx.beginPath()
          ctx.arc(d.cx, d.cy, d.r * local, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      if (prefersReduced) { draw(1); return }

      const DURATION = 1300
      let t0 = 0
      const loop = (t: number) => {
        if (cancelled) return
        if (!t0) t0 = t
        const p = Math.min(1, (t - t0) / DURATION)
        draw(1 - Math.pow(1 - p, 3)) // easeOutCubic
        if (p < 1) raf = requestAnimationFrame(loop)
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
      aria-label="Dot-style portrait of Ashwin Anand"
    />
  )
}
