'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** image in /public */
  src: string
  className?: string
}

// Internal geometry resolution (CSS px). Display size is controlled by CSS.
const RENDER_W = 300
const GRID_W = 96 // higher density → Adam-Hickey-level fine detail
const MAX_TILT = 0.52 // radians the head nods forward at full scroll (~30°)

type Dot = {
  cx: number; cy: number; r: number; a: number
  dist: number
  head: number  // 0 = body, 1..0 blend factor above the neck pivot
  mouth: number // 0..1 weight inside the mouth region (for the smile morph)
  bottomFade: number // 0..1 alpha multiplier for the dissolving bottom
}

/**
 * Animated halftone dot-field portrait.
 * - Samples the photo onto a dense grid, removes the wall via border flood-fill
 *   with a protected face ellipse so the whole face is always present.
 * - Only the head (above the neck pivot) nods downward with scroll progress,
 *   and the smile flattens; both reverse on scroll up.
 * - Bottom rows fade + round off so the figure dissolves into the tile grid.
 */
export default function DotAvatar({ src, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let cancelled = false
    const cleanupFns: Array<() => void> = []

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.src = src

    img.onload = () => {
      if (cancelled) return

      const aspect = img.height / img.width
      const cssW = RENDER_W
      const cssH = Math.round(cssW * aspect)
      const GRID_H = Math.round(GRID_W * aspect)

      // ── sample photo down to a dot grid ──────────────────────────────
      const tmp = document.createElement('canvas')
      tmp.width = GRID_W
      tmp.height = GRID_H
      const tctx = tmp.getContext('2d', { willReadFrequently: true })!
      tctx.drawImage(img, 0, 0, GRID_W, GRID_H)
      const data = tctx.getImageData(0, 0, GRID_W, GRID_H).data

      const at = (x: number, y: number) => (y * GRID_W + x) * 4
      const diff = (i: number, r: number, g: number, b: number) =>
        Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b)

      // seed = average of the top row (reliably the wall above the head)
      let sr = 0, sg = 0, sb = 0
      for (let x = 0; x < GRID_W; x++) { const i = at(x, 0); sr += data[i]; sg += data[i + 1]; sb += data[i + 2] }
      sr /= GRID_W; sg /= GRID_W; sb /= GRID_W

      // border flood-fill removes the connected wall (incl. its shadow)
      const bg = new Uint8Array(GRID_W * GRID_H)
      const TOL = 190
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

      // Protect a central face ellipse from removal so the whole face is present.
      const faceCx = GRID_W * 0.52, faceCy = GRID_H * 0.30
      const faceRx = GRID_W * 0.27, faceRy = GRID_H * 0.26
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
      const cxc = cssW / 2, cyc = cssH * 0.40
      let maxDist = 1
      let minY = cssH, maxY = 0

      // Neck pivot: head is everything above; body stays put.
      const neckY = cssH * 0.44
      // Mouth region for the smile morph (front-facing portrait).
      const mouthCx = cssW * 0.52, mouthCy = cssH * 0.335
      const mouthRx = cssW * 0.17, mouthRy = cssH * 0.055

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
          if (cy < minY) minY = cy
          if (cy > maxY) maxY = cy

          // head blend: 1 well above neck, easing to 0 at the pivot (no seam)
          const head = cy < neckY ? Math.min(1, (neckY - cy) / (cssH * 0.30)) : 0

          // mouth weight (elliptical falloff)
          const mnx = (cx - mouthCx) / mouthRx, mny = (cy - mouthCy) / mouthRy
          const md = mnx * mnx + mny * mny
          const mouth = md < 1 ? 1 - md : 0

          dots.push({
            cx, cy,
            r: maxR * (0.34 + 0.66 * dark),
            a: 0.5 + 0.5 * dark,
            dist,
            head,
            mouth,
            bottomFade: 1,
          })
        }
      }

      // Bottom dissolve: fade + round off the lowest ~26% of the figure.
      const figH = maxY - minY
      const fadeStart = maxY - figH * 0.26
      for (const d of dots) {
        if (d.cy > fadeStart) {
          const t = (d.cy - fadeStart) / (maxY - fadeStart) // 0..1 downward
          // vertical fade
          let f = 1 - t
          // round the bottom corners: fade dots far from centre near the base
          const edge = Math.abs(d.cx - cxc) / (cssW * 0.5)
          f *= 1 - Math.max(0, (edge - 0.55) / 0.45) * t
          d.bottomFade = Math.max(0, f)
        }
      }

      // ── visible canvas (retina) ──────────────────────────────────────
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      const draw = (reveal: number, tilt: number) => {
        ctx.clearRect(0, 0, cssW, cssH)
        ctx.fillStyle = '#0a1628'
        const cosT = Math.cos(tilt)
        for (const d of dots) {
          // entrance reveal (center-out)
          let rv = 1
          if (reveal < 1) {
            const start = (d.dist / maxDist) * 0.5
            rv = Math.min(1, Math.max(0, (reveal - start) / 0.5))
            if (rv <= 0) continue
          }

          let dx = d.cx
          let dy = d.cy

          // head nods forward around the neck pivot (foreshorten + drop)
          if (d.head > 0 && tilt > 0.0001) {
            const rel = d.cy - neckY // negative above pivot
            const foreshort = rel * cosT
            const drop = (-rel) * (1 - cosT) * 0.65
            dy = neckY + (foreshort + drop) * d.head + rel * (1 - d.head)
          }

          // smile flattens: push the mouth corners down as the head tilts
          if (d.mouth > 0 && tilt > 0.0001) {
            const relX = (d.cx - mouthCx) / mouthRx
            dy += (relX * relX) * 4.2 * d.mouth * (tilt / MAX_TILT)
          }

          const rr = d.r * rv
          ctx.globalAlpha = d.a * rv * d.bottomFade
          ctx.beginPath()
          ctx.arc(dx, dy, rr, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // scroll → head tilt (hero is ~100vh)
      const tiltTarget = () => {
        const vh = window.innerHeight || 800
        return Math.min(1, Math.max(0, window.scrollY / (vh * 0.5))) * MAX_TILT
      }

      if (prefersReduced) {
        draw(1, tiltTarget())
        const onScrollRM = () => draw(1, tiltTarget())
        window.addEventListener('scroll', onScrollRM, { passive: true })
        cleanupFns.push(() => window.removeEventListener('scroll', onScrollRM))
        return
      }

      // Animation loop: run during the entrance reveal, then only while the
      // tilt is still easing toward its scroll-derived target (idle = no work).
      let reveal = 0
      let curTilt = 0
      let revealStart = 0
      let running = true

      const frame = (t: number) => {
        if (cancelled) return
        if (!revealStart) revealStart = t
        reveal = Math.min(1, (t - revealStart) / 1300)
        const eased = 1 - Math.pow(1 - reveal, 3)
        const target = tiltTarget()
        curTilt += (target - curTilt) * 0.14
        draw(eased, curTilt)

        const settled = reveal >= 1 && Math.abs(target - curTilt) < 0.0006
        if (settled) { running = false; return }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      const kick = () => {
        if (!running && !cancelled) { running = true; raf = requestAnimationFrame(frame) }
      }
      window.addEventListener('scroll', kick, { passive: true })
      cleanupFns.push(() => window.removeEventListener('scroll', kick))
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      cleanupFns.forEach((fn) => fn())
    }
  }, [src])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Animated dot-style portrait of Ashwin Anand"
    />
  )
}
