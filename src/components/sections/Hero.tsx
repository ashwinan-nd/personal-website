'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'
import TileGrid from '@/components/ui/TileGrid'
import GlassButton from '@/components/ui/GlassButton'

const DotAvatar = dynamic(() => import('./DotAvatar'), { ssr: false })

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [tilesActive, setTilesActive] = useState(true)
  const [nameHover, setNameHover] = useState(false)
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

  // Line-reveal (Adam-Hickey style): each line rises out of a clip mask.
  const lineReveal = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { y: '112%' },
          animate: { y: '0%' },
          transition: { duration: 1.0, ease: EASE, delay },
        }

  const fromBelow = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } }

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

      {/* Content — nudged up slightly */}
      <div className="relative z-10 flex flex-col items-center px-6" style={{ transform: 'translateY(-3vh)' }}>
        {/* Avatar + name unit */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
          {/* Dot avatar — scroll-driven head tilt */}
          <div className="relative flex items-center justify-center shrink-0">
            <motion.div
              className="relative w-[172px] sm:w-[210px] md:w-[262px]"
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <DotAvatar src="/ashwin-frames.png" className="block w-full h-auto" />
            </motion.div>
          </div>

          {/* Name → tagline hover/focus swap. Both layers occupy the same box
              (tagline absolute) so nothing shifts; keyboard-focusable. */}
          <div
            className="relative inline-block outline-none"
            tabIndex={0}
            onMouseEnter={() => setNameHover(true)}
            onMouseLeave={() => setNameHover(false)}
            onFocus={() => setNameHover(true)}
            onBlur={() => setNameHover(false)}
            aria-label="Ashwin Anand — Building enterprise systems and 0-to-1 systems that make hard problems simple"
          >
            <motion.h1
              animate={{ opacity: shouldReduceMotion ? 1 : nameHover ? 0 : 1 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="font-bold text-[#0a1628] leading-[0.86] tracking-[-0.045em] select-none text-center md:text-left"
              style={{ fontSize: 'clamp(56px, 9vw, 118px)' }}
            >
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span className="block" {...lineReveal(0.1)}>Ashwin</motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span className="block" {...lineReveal(0.22)}>Anand</motion.span>
              </span>
            </motion.h1>

            {/* Tagline — smaller, same color, left-aligned, ~3-4 words/line */}
            <motion.p
              aria-hidden={!nameHover}
              initial={false}
              animate={{ opacity: shouldReduceMotion ? 0 : nameHover ? 1 : 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="absolute top-0 left-0 h-full flex flex-col justify-center font-bold text-[#0a1628] leading-[1.08] tracking-[-0.02em] text-left pointer-events-none"
              style={{ fontSize: 'clamp(22px, 3vw, 40px)', width: 'min(64vw, 540px)' }}
            >
              Building enterprise systems and 0-to-1 systems that make hard problems simple.
            </motion.p>
          </div>
        </div>

        {/* Nav buttons — under the avatar + name unit */}
        <motion.div
          {...fromBelow}
          transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
          className="hero-nav flex items-center justify-center gap-3 flex-wrap transition-opacity duration-200"
          style={{ marginTop: 'clamp(32px, 5vh, 60px)' }}
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
