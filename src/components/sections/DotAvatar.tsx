'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** image in /public */
  src: string
  className?: string
}

// Internal geometry resolution (CSS px).
const RENDER_W = 300
const GRID_W = 98 // dot density → fine detail
// Crop the source from the bottom so the framing is head + shoulders (Adam-Hickey
// proportions), sampling only the top fraction of the photo.
const SRC_CROP = 0.66
const MAX_TILT = 0.5 // radians the head nods forward at full scroll (~29°)

type Dot = {
  cx: number; cy: number; r: number; a: number
  seed: number
  head: number  // 1 well above the neck pivot, eases to 0 at the pivot
  mouth: number // 0..1 weight inside the mouth region (smile morph)
}

/**
 * Animated halftone dot-field portrait.
 *
 * The whole field is drawn on a single canvas and re-painted every frame by a
 * continuous rAF loop that reads scroll position directly (so the motion can
 * never "stick"). Only the head (above the neck pivot) nods forward with scroll
 * and the smile flattens; a small idle breathing keeps the figure alive at rest.
 * Background wall is removed with a border flood-fill plus a protected face
 * ellipse, so the whole face is always present and no shadow silhouette remains.
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
      const srcH = Math.round(img.height * SRC_CROP) // cropped from the bottom
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

      // seed = average of the top row (the wall above the head)
      let sr = 0, sg = 0, sb = 0
      for (let x = 0; x < GRID_W; x++) { const i = at(x, 0); sr += data[i]; sg += data[i + 1]; sb += data[i + 2] }
      sr /= GRID_W; sg /= GRID_W; sb /= GRID_W

      // Aggressive border flood-fill (high tolerance) to erase the wall AND its
      // shadow. The face is protected below, so a high tolerance is safe.
      const bg = new Uint8Array(GRID_W * GRID_H)
      const TOL = 212
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

      // Protect the face + torso core so the high-tolerance fill can't bite in.
      const faceCx = GRID_W * 0.52, faceCy = GRID_H * 0.34
      const faceRx = GRID_W * 0.30, faceRy = GRID_H * 0.34
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const nx = (x - faceCx) / faceRx, ny = (y - faceCy) / faceRy
          if (nx * nx + ny * ny <= 1) bg[y * GRID_W + x] = 0
        }
      }

      // ── build dot list ───────────────────────────────────────────────
      const dots: Dot[] = []
      const cell = cssW / GRID_W
      const maxR = cell * 0.60
      const neckY = cssH * 0.52 // pivot: head above, shoulders below
      const mouthCx = cssW * 0.52, mouthCy = cssH * 0.40
      const mouthRx = cssW * 0.17, mouthRy = cssH * 0.05

      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const p = y * GRID_W + x
          if (bg[p]) continue
          const i = p * 4
          const L = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
          const dark = 1 - L
          const cx = x * cell + cell / 2
          const cy = y * cell + cell / 2
          const head = cy < neckY ? Math.min(1, (neckY - cy) / (cssH * 0.34)) : 0
          const mnx = (cx - mouthCx) / mouthRx, mny = (cy - mouthCy) / mouthRy
          const md = mnx * mnx + mny * mny
          dots.push({
            cx, cy,
            r: maxR * (0.34 + 0.66 * dark),
            a: 0.5 + 0.5 * dark,
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

      const draw = (reveal: number, tilt: number, tMs: number) => {
        ctx.clearRect(0, 0, cssW, cssH)
        ctx.fillStyle = '#0a1628'
        const cosT = Math.cos(tilt)
        const idle = prefersReduced ? 0 : 1
        for (const d of dots) {
          let rv = 1
          if (reveal < 1) {
            const dist = Math.hypot(d.cx - cssW / 2, d.cy - cssH * 0.4)
            const start = (dist / (cssW * 0.7)) * 0.5
            rv = Math.min(1, Math.max(0, (reveal - start) / 0.5))
            if (rv <= 0) continue
          }

          let dx = d.cx
          let dy = d.cy

          // head nods forward around the neck pivot (foreshorten + drop)
          if (d.head > 0 && tilt > 0.0001) {
            const rel = d.cy - neckY
            const foreshort = rel * cosT
            const drop = (-rel) * (1 - cosT) * 0.9
            dy = neckY + (foreshort + drop) * d.head + rel * (1 - d.head)
          }

          // smile flattens as the head tilts (push mouth corners down)
          if (d.mouth > 0 && tilt > 0.0001) {
            const relX = (d.cx - mouthCx) / mouthRx
            dy += relX * relX * 4.5 * d.mouth * (tilt / MAX_TILT)
          }

          // subtle idle breathing so the field feels alive at rest
          if (idle) {
            const ph = tMs * 0.0016 + d.seed * 0.12
            dx += Math.cos(ph) * 0.22
            dy += Math.sin(ph * 1.1) * 0.22
          }

          const rr = d.r * rv
          ctx.globalAlpha = d.a * rv
          ctx.beginPath()
          ctx.arc(dx, dy, rr, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      const tiltFor = () => {
        const vh = window.innerHeight || 800
        return Math.min(1, Math.max(0, window.scrollY / (vh * 0.5))) * MAX_TILT
      }

      // Continuous loop: always running while the avatar is near the top of the
      // page, so scroll changes are reflected immediately and smoothly. When the
      // hero is well out of view we skip the paint (cheap) but keep polling.
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
        // Rounded edges + a low, soft bottom fade so the figure dissolves into
        // the page without a hard photo edge or a background circle.
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 99%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 99%)',
        borderRadius: 20,
      }}
    />
  )
}
