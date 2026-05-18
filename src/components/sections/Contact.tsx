'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import TileGrid from '@/components/ui/TileGrid'
import GlassButton from '@/components/ui/GlassButton'

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  const [tilesActive, setTilesActive] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setTilesActive(entry.isIntersecting),
      { threshold: 0.02 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative min-h-screen flex items-center justify-center px-6 bg-white overflow-hidden"
    >
      {/* TileGrid background */}
      <div className="absolute inset-0 z-0">
        <TileGrid active={tilesActive} />
      </div>

      {/* Vignette overlays */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(255,255,255,0.55) 100%)',
        }}
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.82) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.92) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        >
          <h2
            className="font-bold text-[#0a1628] leading-[0.92] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(44px, 7vw, 88px)', marginBottom: 'clamp(52px, 8vh, 88px)' }}
          >
            Let&apos;s build
            <br />
            the future.
          </h2>

          <GlassButton href="mailto:ashwinan.nd@gmail.com">
            Email Ashwin →
          </GlassButton>
        </motion.div>
      </div>
    </section>
  )
}
