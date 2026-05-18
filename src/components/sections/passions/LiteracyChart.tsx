'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const CURRENT = 28   // % current student preparation
const NEEDED = 82    // % needed level

export default function LiteracyChart() {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  // phase 0: hidden, 1: current bar shown, 2: needed bar shown

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase(1)
          setTimeout(() => setPhase(2), 1200)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full max-w-xs" style={{ paddingLeft: 13 }}>
      {/* Chart */}
      <div className="flex items-end gap-8 h-44 mb-4">
        {/* Current bar */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <motion.div
            className="w-full rounded-t-lg"
            style={{ background: 'rgba(27,58,107,0.25)', originY: 1 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ height: `${(CURRENT / 100) * 160}px` }} />
          </motion.div>

          {phase >= 1 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="font-bold text-2xl text-[#0a1628]"
            >
              {CURRENT}%
            </motion.span>
          )}
          <span className="font-mono text-[10px] tracking-wider text-[#0a1628]/40 uppercase text-center">
            Current
            <br />
            Prep
          </span>
        </div>

        {/* Needed bar */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <motion.div
            className="w-full rounded-t-lg"
            style={{ background: '#0a1628', originY: 1 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ height: `${(NEEDED / 100) * 160}px` }} />
          </motion.div>

          {phase >= 2 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-bold text-2xl text-[#0a1628]"
            >
              {NEEDED}%
            </motion.span>
          )}
          <span className="font-mono text-[10px] tracking-wider text-[#0a1628]/40 uppercase text-center">
            Required
            <br />
            Level
          </span>
        </div>
      </div>

      {/* Gap annotation */}
      {phase >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 h-px bg-[#0a1628]/15" />
          <span className="font-mono text-[10px] tracking-widest text-[#0a1628]/40 uppercase whitespace-nowrap">
            {NEEDED - CURRENT}pt gap
          </span>
          <div className="flex-1 h-px bg-[#0a1628]/15" />
        </motion.div>
      )}
    </div>
  )
}
