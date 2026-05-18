'use client'

import { useEffect, useRef, useCallback } from 'react'

const TILE_SIZE = 68
const RADIUS = 140
const MAX_Z = 22

interface TileGridProps {
  active?: boolean
}

export default function TileGrid({ active = true }: TileGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tilesRef = useRef<HTMLDivElement[]>([])
  const rafRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
    // When going inactive, reset all tiles
    if (!active) {
      tilesRef.current.forEach((tile) => {
        tile.style.transform = 'translateZ(0px) scale(1)'
        tile.style.background = 'rgba(26,58,107,0.04)'
        tile.style.boxShadow = 'none'
        tile.style.borderColor = 'rgba(26,58,107,0.07)'
      })
    }
  }, [active])

  const buildGrid = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.offsetWidth
    const h = container.offsetHeight
    const cols = Math.ceil(w / TILE_SIZE) + 1
    const rows = Math.ceil(h / TILE_SIZE) + 1

    container.innerHTML = ''
    tilesRef.current = []

    container.style.gridTemplateColumns = `repeat(${cols}, ${TILE_SIZE}px)`
    container.style.gridTemplateRows = `repeat(${rows}, ${TILE_SIZE}px)`

    const fragment = document.createDocumentFragment()
    for (let i = 0; i < rows * cols; i++) {
      const tile = document.createElement('div')
      tile.style.cssText = [
        `width:${TILE_SIZE}px`,
        `height:${TILE_SIZE}px`,
        'background:rgba(26,58,107,0.04)',
        'border:1px solid rgba(26,58,107,0.07)',
        'border-radius:6px',
        'transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1),background 0.35s ease,box-shadow 0.35s ease,border-color 0.35s ease',
        'will-change:transform',
        'position:relative',
      ].join(';')
      fragment.appendChild(tile)
      tilesRef.current.push(tile)
    }
    container.appendChild(fragment)
  }, [])

  const animate = useCallback(() => {
    if (activeRef.current) {
      const { x: mx, y: my } = mouseRef.current
      tilesRef.current.forEach((tile) => {
        const rect = tile.getBoundingClientRect()
        const cx = rect.left + TILE_SIZE / 2
        const cy = rect.top + TILE_SIZE / 2
        const dx = mx - cx
        const dy = my - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < RADIUS) {
          const p = 1 - dist / RADIUS
          const smooth = p * p * (3 - 2 * p) // smoothstep
          const z = smooth * MAX_Z
          const sc = 1 + smooth * 0.07
          const bg = 0.04 + smooth * 0.16
          const sh = smooth * 0.18

          tile.style.transform = `translateZ(${z.toFixed(1)}px) scale(${sc.toFixed(3)})`
          tile.style.background = `rgba(26,58,107,${bg.toFixed(3)})`
          tile.style.boxShadow = `0 ${(z * 0.8).toFixed(1)}px ${(z * 2).toFixed(1)}px rgba(26,58,107,${sh.toFixed(3)})`
          tile.style.borderColor = `rgba(26,58,107,${(0.07 + smooth * 0.13).toFixed(3)})`
        } else {
          tile.style.transform = 'translateZ(0px) scale(1)'
          tile.style.background = 'rgba(26,58,107,0.04)'
          tile.style.boxShadow = 'none'
          tile.style.borderColor = 'rgba(26,58,107,0.07)'
        }
      })
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    buildGrid()

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafRef.current = requestAnimationFrame(animate)

    const ro = new ResizeObserver(buildGrid)
    if (containerRef.current) ro.observe(containerRef.current)

    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [buildGrid, animate])

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '900px', perspectiveOrigin: '50% 50%' }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 grid"
        style={{ transformStyle: 'preserve-3d' }}
      />
      {/* Bottom fade — tiles dissolve gradually into the next section */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '36%',
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.28) 40%, rgba(255,255,255,0.70) 68%, rgba(255,255,255,0.96) 86%, white 100%)',
        }}
      />
    </div>
  )
}
