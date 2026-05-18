'use client'

import { useRef, useState, useEffect } from 'react'
import {
  motion,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion'
import dynamic from 'next/dynamic'

const GlobeVisual   = dynamic(() => import('./passions/GlobeVisual'),   { ssr: false })
const FinanceVisual = dynamic(() => import('./passions/FinanceVisual'), { ssr: false })
const GPUVisual     = dynamic(() => import('./passions/GPUVisual'),     { ssr: false })
const LiteracyChart = dynamic(() => import('./passions/LiteracyChart'), { ssr: false })
const AgentNetwork  = dynamic(() => import('./passions/AgentNetwork'),  { ssr: false })

const PANEL_COUNT = 5
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]

const panels = [
  {
    number: '01',
    category: 'COSMOS',
    headline: 'Space',
    body: 'Fascinated by the systems that govern the universe, and the technologies expanding humanity beyond Earth.',
    Visual: GlobeVisual,
  },
  {
    number: '02',
    category: 'MARKETS',
    headline: 'High Finance',
    body: 'Drawn toward capital markets, macro systems, and the underlying mechanics that shape global economies.',
    Visual: FinanceVisual,
  },
  {
    number: '03',
    category: 'SILICON',
    headline: 'GPU & Hardware',
    body: 'Obsessed with computational infrastructure, parallel processing, and the hardware powering modern intelligence.',
    Visual: GPUVisual,
  },
  {
    number: '04',
    category: 'SYSTEMS',
    headline: 'Financial Literacy',
    body: 'Interested in making financial systems more understandable and accessible for everyone.',
    Visual: LiteracyChart,
  },
  {
    number: '05',
    category: 'FRONTIER',
    headline: 'Agents for Agents',
    body: 'Exploring systems where autonomous agents coordinate, reason, and build alongside one another.',
    Visual: AgentNetwork,
  },
]

export default function Passions() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const inSectionRef = useRef(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    inSectionRef.current = v > 0 && v < 1
    const idx = Math.min(PANEL_COUNT - 1, Math.floor(v * PANEL_COUNT))
    if (idx !== activeIndexRef.current) {
      activeIndexRef.current = idx
      setActiveIndex(idx)
    }
  })

  // Wheel-snap: accumulate scroll delta; advance panel after threshold
  useEffect(() => {
    let cooldown = false
    let accumulated = 0
    const THRESHOLD = 155 // px of wheel delta needed to advance one panel

    const onWheel = (e: WheelEvent) => {
      if (!inSectionRef.current) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      // Only engage when sticky: section top <= 0 and bottom > viewport height
      if (rect.top > 4 || rect.bottom < window.innerHeight - 4) return

      if (cooldown) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }

      // Reset if direction reverses
      if (accumulated !== 0 && Math.sign(e.deltaY) !== Math.sign(accumulated)) {
        accumulated = 0
      }
      accumulated += e.deltaY
      if (Math.abs(accumulated) < THRESHOLD) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }

      const dir = Math.sign(accumulated) as 1 | -1
      accumulated = 0

      const cur = activeIndexRef.current
      const next = Math.max(0, Math.min(PANEL_COUNT - 1, cur + dir))
      // At section boundary — release the event so scroll exits naturally
      if (next === cur) return

      e.preventDefault()
      e.stopImmediatePropagation()

      cooldown = true
      setTimeout(() => { cooldown = false }, 900)

      const sectionTop = containerRef.current?.offsetTop ?? 0
      const targetY = sectionTop + next * window.innerHeight

      if (window.__lenis) {
        window.__lenis.scrollTo(targetY, {
          duration: 0.82,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
        })
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' })
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false, capture: true })
    return () => window.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions)
  }, [])

  return (
    <section
      id="passions"
      ref={containerRef}
      style={{ height: `${PANEL_COUNT * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-white">

        {/* Progress dots — right-center edge */}
        <div
          className="absolute right-7 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5"
        >
          {panels.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-350"
              style={{
                width: 6,
                height: activeIndex === i ? 26 : 6,
                background: activeIndex === i ? '#0a1628' : 'rgba(10,22,40,0.18)',
              }}
            />
          ))}
        </div>

        {/* Panels */}
        {panels.map((panel, i) => (
          <Panel
            key={panel.number}
            panel={panel}
            index={i}
            activeIndex={activeIndex}
          />
        ))}
      </div>
    </section>
  )
}

function Panel({
  panel,
  index,
  activeIndex,
}: {
  panel: (typeof panels)[0]
  index: number
  activeIndex: number
}) {
  const isActive = index === activeIndex
  const isPrev = index < activeIndex

  return (
    <motion.div
      className="absolute inset-0 flex items-center"
      animate={{
        opacity: isActive ? 1 : 0,
        y: isActive ? 0 : isPrev ? -28 : 28,
        pointerEvents: isActive ? 'auto' : 'none',
      }}
      transition={{ duration: 0.48, ease: EASE }}
    >
      {/* 4-column virtual grid: text centered in cols 1-2, visual in cols 3-4 */}
      <div className="w-full grid grid-cols-2 items-center" style={{ padding: '0 4vw' }}>

        {/* Text column — centered at 25% of viewport */}
        <div className="flex justify-center">
          <div className="flex flex-col gap-7 w-full max-w-[340px]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#1b3a6b]/40 uppercase">
                {panel.category}
              </span>
              <span className="font-mono text-[10px] text-[#1b3a6b]/22">
                {panel.number}
              </span>
            </div>

            <h3
              className="font-bold text-[#0a1628] leading-[0.9] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(36px, 4.5vw, 62px)' }}
            >
              {panel.headline}
            </h3>

            <p
              className="text-[15px] leading-[1.8]"
              style={{ color: 'rgba(10,22,40,0.52)' }}
            >
              {panel.body}
            </p>
          </div>
        </div>

        {/* Visual column — centered at 75% of viewport */}
        <div className="hidden md:flex justify-center">
          <div className="w-full max-w-[480px]">
            <panel.Visual />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
