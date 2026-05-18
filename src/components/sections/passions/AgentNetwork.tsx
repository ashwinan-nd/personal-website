'use client'

import { useEffect, useRef } from 'react'

// tier: 0=central fixed dark hub, 1=orbit hubs, 2=medium, 3=small
interface Node {
  x: number; y: number
  vx: number; vy: number
  r: number
  mass: number
  pulse: number; pulseSpeed: number
  tier: 0 | 1 | 2 | 3
  driftPhase: number
  driftFreq: number
}

interface Packet { from: number; to: number; t: number; speed: number }

const LINK_DIST = 170

const NODE_COLOR = ['#0a1628', '#1b3a6b', 'rgba(27,58,107,0.62)', 'rgba(27,58,107,0.36)']
const NODE_GLOW  = [0.28, 0.20, 0.14, 0.09]

function initNodes(W: number, H: number): Node[] {
  const cx = W / 2, cy = H / 2
  const nodes: Node[] = []

  // Tier 0 — single fixed central node
  nodes.push({
    x: cx, y: cy,
    vx: 0, vy: 0,
    r: 13, mass: 999,
    pulse: 0, pulseSpeed: 0.018,
    tier: 0,
    driftPhase: 0, driftFreq: 0,
  })

  // Tier 1 — 4 orbit hubs
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    nodes.push({
      x: cx + Math.cos(a) * 72, y: cy + Math.sin(a) * 58,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: 9, mass: 4,
      pulse: Math.random() * Math.PI * 2, pulseSpeed: 0.020,
      tier: 1,
      driftPhase: Math.random() * Math.PI * 2,
      driftFreq: 0.0025 + Math.random() * 0.003,
    })
  }

  // Tier 2 — 8 medium nodes
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const d = 115 + Math.random() * 50
    nodes.push({
      x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.78,
      vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
      r: 6, mass: 2,
      pulse: Math.random() * Math.PI * 2, pulseSpeed: 0.026,
      tier: 2,
      driftPhase: Math.random() * Math.PI * 2,
      driftFreq: 0.003 + Math.random() * 0.004,
    })
  }

  // Tier 3 — 11 small peripheral nodes
  for (let i = 0; i < 11; i++) {
    nodes.push({
      x: W * 0.15 + Math.random() * W * 0.70,
      y: H * 0.15 + Math.random() * H * 0.70,
      vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55,
      r: 3.2, mass: 1,
      pulse: Math.random() * Math.PI * 2, pulseSpeed: 0.036,
      tier: 3,
      driftPhase: Math.random() * Math.PI * 2,
      driftFreq: 0.004 + Math.random() * 0.005,
    })
  }

  return nodes
}

export default function AgentNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    let nodes: Node[] | null = null
    const packets: Packet[] = []
    let t = 0

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Re-init if already running so nodes recentre
      if (nodes) {
        const w = canvas.offsetWidth, h = canvas.offsetHeight
        nodes[0].x = w / 2
        nodes[0].y = h / 2
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const spawnPacket = () => {
      if (!nodes) return
      const from = 1 + Math.floor(Math.random() * (nodes.length - 1)) // skip central
      const candidates = nodes
        .map((n, i) => ({ i, d: Math.hypot(n.x - nodes![from].x, n.y - nodes![from].y) }))
        .filter(c => c.i !== from && c.d < LINK_DIST)
      if (candidates.length) {
        const c = candidates[Math.floor(Math.random() * candidates.length)]
        packets.push({ from, to: c.i, t: 0, speed: 0.010 + Math.random() * 0.009 })
      }
    }
    const pInterval = setInterval(spawnPacket, 180)

    let raf: number
    const draw = () => {
      t++
      const w = canvas.offsetWidth, h = canvas.offsetHeight
      if (w === 0 || h === 0) { raf = requestAnimationFrame(draw); return }

      // Lazy init with real canvas size
      if (!nodes) nodes = initNodes(w, h)

      ctx.clearRect(0, 0, w, h)

      const cx = w / 2, cy = h / 2

      nodes.forEach((a, i) => {
        if (a.tier === 0) {
          // Central node: always fixed at centre
          a.x = cx; a.y = cy; a.vx = 0; a.vy = 0
          a.pulse += a.pulseSpeed
          return
        }

        // Per-node independent drift
        a.vx += Math.cos(a.driftPhase + t * a.driftFreq) * 0.050
        a.vy += Math.sin(a.driftPhase * 1.4 + t * a.driftFreq * 0.8) * 0.042

        // Spring toward centre — strength scales with tier so outer nodes drift further
        const springK = a.tier === 1 ? 0.0006 : a.tier === 2 ? 0.00040 : 0.00028
        a.vx += (cx - a.x) * springK
        a.vy += (cy - a.y) * springK

        // Repulsion between nodes
        nodes!.forEach((b, j) => {
          if (i === j) return
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          const minD = (a.r + b.r) * 4.5
          if (d < minD) {
            const f = ((minD - d) / minD) * 0.06 / a.mass
            a.vx += (dx / d) * f
            a.vy += (dy / d) * f
          }
        })

        // Mesh attraction within LINK_DIST
        nodes!.forEach((b, j) => {
          if (i === j || b.tier === 0) return
          const dx = b.x - a.x, dy = b.y - a.y
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          if (d > 45 && d < LINK_DIST) {
            const f = 0.00022 / a.mass
            a.vx += (dx / d) * f
            a.vy += (dy / d) * f
          }
        })

        a.vx *= 0.974; a.vy *= 0.974
        a.x += a.vx; a.y += a.vy
        a.x = Math.max(a.r * 2.5, Math.min(w - a.r * 2.5, a.x))
        a.y = Math.max(a.r * 2.5, Math.min(h - a.r * 2.5, a.y))
        a.pulse += a.pulseSpeed
      })

      // Edges
      nodes.forEach((a, i) => {
        nodes!.forEach((b, j) => {
          if (j <= i) return
          const d = Math.hypot(b.x - a.x, b.y - a.y)
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.18
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            const tierMax = Math.max(a.tier, b.tier)
            ctx.strokeStyle = `rgba(10,22,40,${(alpha * (1 - tierMax * 0.18)).toFixed(3)})`
            ctx.lineWidth = a.tier === 0 || b.tier === 0 ? 0.9 : 0.55
            ctx.stroke()
          }
        })
      })

      // Packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i]
        p.t += p.speed
        if (p.t >= 1) { packets.splice(i, 1); continue }
        const a = nodes[p.from], b = nodes[p.to]
        if (!a || !b) { packets.splice(i, 1); continue }
        const px = a.x + (b.x - a.x) * p.t
        const py = a.y + (b.y - a.y) * p.t
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 7)
        grd.addColorStop(0, 'rgba(27,58,107,0.88)')
        grd.addColorStop(1, 'rgba(27,58,107,0)')
        ctx.beginPath()
        ctx.arc(px, py, 7, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
      }

      // Nodes — darkest at centre, lighter outward
      nodes.forEach((node) => {
        const glow = (Math.sin(node.pulse) + 1) / 2
        const vr = node.r + glow * (node.tier === 0 ? 4 : node.tier === 1 ? 2.5 : 1.5)
        const glowR = vr * (node.tier <= 1 ? 4.5 : 3.5)
        const baseAlpha = NODE_GLOW[node.tier]

        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR)
        g.addColorStop(0, `rgba(27,58,107,${(baseAlpha + glow * 0.12).toFixed(3)})`)
        g.addColorStop(1, 'rgba(27,58,107,0)')
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()

        ctx.beginPath()
        ctx.arc(node.x, node.y, vr, 0, Math.PI * 2)
        ctx.fillStyle = NODE_COLOR[node.tier]
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      ro.disconnect()
      clearInterval(pInterval)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ height: 280, display: 'block' }}
    />
  )
}
