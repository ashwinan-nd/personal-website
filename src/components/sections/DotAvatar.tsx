'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** image in /public */
  src: string
  className?: string
}

// Internal geometry resolution (CSS px).
const RENDER_W = 300
const GRID_W = 98 // dot density — held CONSTANT (detail comes from contrast, not more dots)
// Crop from the bottom so the framing is head + shoulders (Adam-Hickey scale).
// A little more of the chest is kept than before.
const SRC_CROP = 0.74
const MAX_TILT = 0.52 // radians the head nods forward at full scroll (~30°)

type Dot = {
  cx: number; cy: number; r: number; a: number
  seed: number
  head: number  // 1 well above the neck pivot, eases to 0 at the pivot
  mouth: number // 0..1 weight inside the mouth region (smile morph)
}

/**
 * Animated halftone dot-field portrait, rebuilt for clarity + a solid read.
 *
 * - A continuous rAF loop reads scroll every frame, so the head-tilt + smile
 *   morph are always live and smooth (verified in-browser). Idle breathing
 *   keeps the field alive at rest. Ready to be swapped for a GIF later without
 *   architectural change (the loop simply paints; a GIF would replace paint).
 * - Background wall removed by high-tolerance border flood-fill + a TIGHT
 *   protected face ellipse, so the shadow "chat-bubble" lobe is gone but the
 *   whole face stays.
 * - A white base pass under the ink dots means the tile grid never shows
 *   through the figure and dissolves at the sparse edges.
 * - Detail/contour comes from a wider dot radius + alpha range, not more dots.
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

      const srcW = img.width
      const srcH = Math.round(img.height * SRC_CROP)
      const aspect = srcH / srcW
      const cssW = RENDER_W
      const cssH = Math.round(cssW * aspect)
      const GRID_H = Math.round(GRID_W * aspect)

      // ── sample the cropped photo down to a dot grid ──────────────────
      const tmp = document.createElement('canvas')
      tmp.width = GRID_W
      tmp.height = GRID_H
      const tctx = tmp.getContext('2d', { willReadFrequently: true })!
      tctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, GRID_W, GRID_H)
      const data = tctx.getImageData(0, 0, GRID_W, GRID_H).data

      const at = (x: number, y: number) => (y * GRID_W + x) * 4
      const diff = (i: number, r: number, g: number, b: number) =>
        Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b)

      let sr = 0, sg = 0, sb = 0
      for (let x = 0; x < GRID_W; x++) { const i = at(x, 0); sr += data[i]; sg += data[i + 1]; sb += data[i + 2] }
      sr /= GRID_W; sg /= GRID_W; sb /= GRID_W

      const bg = new Uint8Array(GRID_W * GRID_H)
      const TOL = 214
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
        const x = p % GRID_W, y = (p / GRID_W) | 0
        consider(x + 1, y); consider(x - 1, y); consider(x, y + 1); consider(x, y - 1)
      }

      // TIGHT protected ellipse — covers the face only, not the shadow lobe to
      // its left, so the "chat-bubble" artifact gets removed.
      const faceCx = GRID_W * 0.52, faceCy = GRID_H * 0.30
      const faceRx = GRID_W * 0.22, faceRy = GRID_H * 0.27
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const nx = (x - faceCx) / faceRx, ny = (y - faceCy) / faceRy
          if (nx * nx + ny * ny <= 1) bg[y * GRID_W + x] = 0
        }
      }

      // ── build dot list ───────────────────────────────────────────────
      const dots: Dot[] = []
      const cell = cssW / GRID_W
      const maxR = cell * 0.62
      const neckY = cssH * 0.46
      const mouthCx = cssW * 0.52, mouthCy = cssH * 0.35
      const mouthRx = cssW * 0.16, mouthRy = cssH * 0.045

      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const p = y * GRID_W + x
          if (bg[p]) continue
          const i = p * 4
          const L = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
          const dark = 1 - L
          const cx = x * cell + cell / 2
          const cy = y * cell + cell / 2
          const head = cy < neckY ? Math.min(1, (neckY - cy) / (cssH * 0.30)) : 0
          const mnx = (cx - mouthCx) / mouthRx, mny = (cy - mouthCy) / mouthRy
          const md = mnx * mnx + mny * mny
          dots.push({
            cx, cy,
            // wider radius + alpha range => more contour, same dot count
            r: maxR * (0.20 + 0.92 * Math.pow(dark, 0.82)),
            a: 0.42 + 0.58 * dark,
            seed: (x * 7 + y * 13) % 100,
            head,
            mouth: md < 1 ? 1 - md : 0,
          })
        }
      }

      // ── visible canvas (retina) ──────────────────────────────────────
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      const whiteR = cell * 0.62 // fills cell gaps so tiles never show through

      const draw = (reveal: number, tilt: number, tMs: number) => {
        ctx.clearRect(0, 0, cssW, cssH)
        const cosT = Math.cos(tilt)
        const idle = prefersReduced ? 0 : 1

        // Resolve each dot's animated position once (shared by both passes).
        const px: number[] = []
        const py: number[] = []
        const pv: number[] = []
        for (let k = 0; k < dots.length; k++) {
          const d = dots[k]
          let rv = 1
          if (reveal < 1) {
            const dist = Math.hypot(d.cx - cssW / 2, d.cy - cssH * 0.4)
            const startR = (dist / (cssW * 0.7)) * 0.5
            rv = Math.min(1, Math.max(0, (reveal - startR) / 0.5))
          }
          let dx = d.cx, dy = d.cy
          if (d.head > 0 && tilt > 0.0001) {
            const rel = d.cy - neckY
            dy = neckY + (rel * cosT + (-rel) * (1 - cosT) * 0.9) * d.head + rel * (1 - d.head)
          }
          if (d.mouth > 0 && tilt > 0.0001) {
            const relX = (d.cx - mouthCx) / mouthRx
            dy += relX * relX * 4.5 * d.mouth * (tilt / MAX_TILT)
          }
          if (idle) {
            const ph = tMs * 0.0016 + d.seed * 0.12
            dx += Math.cos(ph) * 0.2
            dy += Math.sin(ph * 1.1) * 0.2
          }
          px[k] = dx; py[k] = dy; pv[k] = rv
        }

        // Pass 1 — white base so the tile grid never shows through the figure.
        ctx.fillStyle = '#ffffff'
        for (let k = 0; k < dots.length; k++) {
          if (pv[k] <= 0) continue
          ctx.globalAlpha = 0.92 * pv[k]
          ctx.beginPath()
          ctx.arc(px[k], py[k], whiteR * Math.max(0.7, pv[k]), 0, Math.PI * 2)
          ctx.fill()
        }

        // Pass 2 — ink dots (the portrait).
        ctx.fillStyle = '#0a1628'
        for (let k = 0; k < dots.length; k++) {
          if (pv[k] <= 0) continue
          const d = dots[k]
          ctx.globalAlpha = d.a * pv[k]
          ctx.beginPath()
          ctx.arc(px[k], py[k], d.r * pv[k], 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      const tiltFor = () => {
        const vh = window.innerHeight || 800
        return Math.min(1, Math.max(0, window.scrollY / (vh * 0.5))) * MAX_TILT
      }

      let start = 0
      let curTilt = 0
      const frame = (t: number) => {
        if (cancelled) return
        if (!start) start = t
        const reveal = prefersReduced ? 1 : Math.min(1, (t - start) / 1200)
        const eased = 1 - Math.pow(1 - reveal, 3)
        const onScreen = window.scrollY < (window.innerHeight || 800) * 1.25
        if (onScreen) {
          const target = tiltFor()
          curTilt += (target - curTilt) * 0.16
          draw(eased, prefersReduced ? tiltFor() : curTilt, t)
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [src])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Animated dot-style portrait of Ashwin Anand"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 82%, transparent 99%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black 82%, transparent 99%)',
        borderRadius: 20,
      }}
    />
  )
}
