'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const CURRENT = 28 // % of students who feel financially prepared
const NEEDED = 82  // % target for real readiness
const MAX_BAR = 132 // px — bar track height so nothing overflows the tile

export default function LiteracyChart() {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase(1)
          setTimeout(() => setPhase(2), 900)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Bar = ({
    pct, active, color, label, delay,
  }: { pct: number; active: boolean; color: string; label: string; delay: number }) => (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* number */}
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
        transition={{ delay: delay + 0.35 }}
        className="font-bold text-[22px] leading-none text-[#0a1628] mb-2"
      >
        {pct}%
      </motion.span>
      {/* bar track (fixed height, bar grows from the baseline) */}
      <div className="w-full flex items-end justify-center" style={{ height: MAX_BAR }}>
        <motion.div
          className="w-[62%] rounded-t-md"
          style={{ background: color, height: (pct / 100) * MAX_BAR, originY: 1 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: active ? 1 : 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
      {/* baseline label */}
      <span className="mt-2.5 font-mono text-[10px] tracking-[0.12em] text-[#0a1628]/45 uppercase text-center leading-tight">
        {label}
      </span>
    </div>
  )

  return (
    <div ref={ref} className="w-full max-w-[300px] mx-auto">
      <p className="text-center font-mono text-[10px] tracking-[0.18em] uppercase text-[#0a1628]/40 mb-4">
        Students who feel financially prepared
      </p>

      <div className="flex items-end gap-10 px-2">
        <Bar pct={CURRENT} active={phase >= 1} color="rgba(27,58,107,0.28)" label={'Today'} delay={0} />
        <Bar pct={NEEDED} active={phase >= 2} color="#0a1628" label={'Should be'} delay={0.15} />
      </div>

      {/* baseline rule + gap annotation (below the bars, no overlap) */}
      <div className="mt-3 h-px bg-[#0a1628]/12" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ delay: 0.6 }}
        className="mt-3 text-center font-mono text-[10px] tracking-[0.14em] uppercase text-[#0a1628]/45"
      >
        {NEEDED - CURRENT}-point readiness gap
      </motion.p>
    </div>
  )
}
