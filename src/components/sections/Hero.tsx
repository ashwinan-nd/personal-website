'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import TileGrid from '@/components/ui/TileGrid'
import GlassButton from '@/components/ui/GlassButton'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [tilesActive, setTilesActive] = useState(true)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setTilesActive(entry.isIntersecting),
      { threshold: 0.02 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fromLeft = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, x: -56 }, animate: { opacity: 1, x: 0 } }

  const fromRight = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, x: 56 }, animate: { opacity: 1, x: 0 } }

  const fromBelow = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 } }

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Tile grid — z-0 */}
      <div className="absolute inset-0 z-0">
        <TileGrid active={tilesActive} />
      </div>

      {/* Vignette + bottom fade */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 62% 62% at 50% 48%, transparent 36%, rgba(255,255,255,0.90) 100%)',
            'linear-gradient(to bottom, transparent 68%, rgba(255,255,255,0.92) 90%, white 100%)',
          ].join(','),
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Name */}
        <motion.h1
          {...fromLeft}
          transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
          className="font-bold text-[#0a1628] leading-[0.9] tracking-[-0.045em] select-none"
          style={{ fontSize: 'clamp(60px, 10vw, 120px)', marginBottom: 'clamp(28px, 4vh, 52px)' }}
        >
          Ashwin
          <br />
          Anand
        </motion.h1>

        {/* Tagline */}
        <motion.p
          {...fromRight}
          transition={{ duration: 0.9, ease: EASE, delay: 0.18 }}
          className="text-[#0a1628]/48 tracking-[-0.01em] select-none"
          style={{
            fontSize: 'clamp(16px, 2vw, 22px)',
            marginBottom: 'clamp(28px, 4vh, 52px)',
          }}
        >
          Innovating for the future.
        </motion.p>

        {/* Nav buttons */}
        <motion.div
          {...fromBelow}
          transition={{ duration: 0.8, ease: EASE, delay: 0.32 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <GlassButton href="#passions">Passions</GlassButton>
          <GlassButton href="#opensource">Public Projects</GlassButton>
          <GlassButton href="#contact">Contact</GlassButton>
        </motion.div>
      </div>

      <ScrollCue />
    </section>
  )
}

function ScrollCue() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const h = () => setVisible(window.scrollY < 50)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  return (
    <motion.div
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="w-px h-10 mx-auto"
        style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.2), transparent)' }}
      />
    </motion.div>
  )
}
