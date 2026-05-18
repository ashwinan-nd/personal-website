'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef(false)
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    // Direct DOM transform — truly zero latency
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }

    const onOver = (e: MouseEvent) => {
      const isHov = !!(e.target as HTMLElement).closest('a,button,[data-hover]')
      if (isHov !== hoverRef.current) {
        hoverRef.current = isHov
        setHovering(isHov)
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mouseenter', () => setVisible(true))
    window.addEventListener('mouseleave', () => setVisible(false))
    setVisible(true)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return (
    <div
      ref={outerRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      aria-hidden
    >
      {/* Single circle — translate(-50%,-50%) keeps it centered at cursor regardless of size */}
      <div
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          width: hovering ? 28 : 18,
          height: hovering ? 28 : 18,
          borderRadius: '50%',
          background: hovering ? 'rgba(26,58,107,0.18)' : 'rgba(26,58,107,0.10)',
          border: '1.5px solid rgba(26,58,107,0.32)',
          opacity: visible ? 1 : 0,
          transition:
            'width 0.16s cubic-bezier(0.34,1.56,0.64,1), height 0.16s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease, background 0.14s ease',
        }}
      />
    </div>
  )
}
