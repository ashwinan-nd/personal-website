'use client'

import { useState, useEffect, type ComponentType } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'

const GlobeVisual   = dynamic(() => import('./passions/GlobeVisual'),   { ssr: false })
const FinanceVisual = dynamic(() => import('./passions/FinanceVisual'), { ssr: false })
const GPUVisual     = dynamic(() => import('./passions/GPUVisual'),     { ssr: false })
const LiteracyChart = dynamic(() => import('./passions/LiteracyChart'), { ssr: false })
const AgentNetwork  = dynamic(() => import('./passions/AgentNetwork'),  { ssr: false })
const CookingVisual = dynamic(() => import('./passions/CookingVisual'), { ssr: false })

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Interest = {
  id: string
  category: string
  headline: string
  blurb: string
  link?: { label: string; href: string }
  Visual: ComponentType
  /** natural height of the visual, used to scale the grid preview */
  natH: number
  /** react-three-fiber canvases mis-size inside a CSS scale() wrapper (their
   * ResizeObserver reads the post-transform width), which pushed the model
   * off-centre. Such visuals render responsively into the preview box instead. */
  responsive?: boolean
}

const interests: Interest[] = [
  {
    id: 'space',
    category: 'Cosmos',
    headline: 'Space',
    blurb:
      "Space is the new frontier, and we are in the middle of the 2nd Space Race. Useful innovation is growing. My bet: we'll be on Mars by 2033, and I'll be on the Moon by 2035.",
    Visual: GlobeVisual,
    natH: 300,
    responsive: true,
  },
  {
    id: 'finance',
    category: 'Markets',
    headline: 'High Finance',
    blurb:
      'Markets are the fastest feedback loop humans ever built. I track macro, rates, and how capital actually moves. The live prices here run through my own server proxy, so the API key never touches your browser.',
    Visual: FinanceVisual,
    natH: 300,
  },
  {
    id: 'gpu',
    category: 'Silicon',
    headline: 'GPU & Hardware',
    blurb:
      'Intelligence runs on silicon. I care about how a GPU actually works, from the compute die to the memory stacks and power delivery. Open it up and hit explode to watch the whole board come apart.',
    Visual: GPUVisual,
    natH: 330,
    responsive: true,
  },
  {
    id: 'literacy',
    category: 'Systems',
    headline: 'Financial Literacy',
    blurb:
      'Most people are never taught how money works. I wrote and pushed a resolution for a mandated financial literacy course. This knowledge should not be a privilege.',
    Visual: LiteracyChart,
    natH: 250,
  },
  {
    id: 'agents',
    category: 'Frontier',
    headline: 'Agents for Agents',
    blurb:
      'I am building the best possible agentic harness for my own work and passions. Agents that plan, verify, and ship, so I operate at a level I could not reach alone.',
    Visual: AgentNetwork,
    natH: 300,
  },
  {
    id: 'cooking',
    category: 'Craft',
    headline: 'Cooking',
    blurb:
      "Cooking is what I'd do if I chose a different career route. I love trying new cuisines and recipes, and more importantly I love cooking for those I love. If you have any recommendations, send them my way!",
    Visual: CookingVisual,
    natH: 240,
  },
]

export default function Passions() {
  const [open, setOpen] = useState<number | null>(null)
  const reduce = useReducedMotion()

  // Modal lifecycle: ESC to close, pause Lenis while open so the backdrop
  // does not scroll the page behind it.
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    window.__lenis?.stop()
    return () => {
      window.removeEventListener('keydown', onKey)
      window.__lenis?.start()
    }
  }, [open])

  return (
    <section id="passions" className="relative bg-white py-24 md:py-32 overflow-hidden">
      {/* Header — left-aligned with a left page margin; grid centered below */}
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mx-auto max-w-[880px] px-6 mb-14 md:mb-20 text-left"
      >
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#1b3a6b]/40 mb-4">
          Interests
        </p>
        <h2
          className="font-bold text-[#0a1628] leading-[0.92] tracking-[-0.04em]"
          style={{ fontSize: 'clamp(34px, 5vw, 60px)' }}
        >
          My Passions Explained
        </h2>
        <p className="mt-5 text-[15px] text-[#0a1628]/45">
          Tap a tile to bring it to center and read the back.
        </p>
      </motion.div>

      {/* 2 x 3 grid — centered, borderless, gap-based spacing */}
      <div className="mx-auto max-w-[880px] px-6 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-7">
        {interests.map((it, i) => (
          <InterestCard key={it.id} interest={it} index={i} reduce={!!reduce} onOpen={() => setOpen(i)} />
        ))}
      </div>

      {/* Flip-to-center overlay */}
      <AnimatePresence>
        {open !== null && (
          <Overlay
            interest={interests[open]}
            reduce={!!reduce}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* ── Grid pill ──────────────────────────────────────────────────────────── */
const CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(145deg, #eef1f7 0%, #e3e8f0 100%)',
  boxShadow:
    '11px 11px 26px rgba(10,22,40,0.10), -9px -9px 22px rgba(255,255,255,0.92), inset 0 1px 0 rgba(255,255,255,0.6)',
}

function InterestCard({
  interest, index, reduce, onOpen,
}: {
  interest: Interest; index: number; reduce: boolean; onOpen: () => void
}) {
  const H = 208
  const k = H / interest.natH
  return (
    // Rendered as a role="button" div (not a <button>) because the previews
    // embed their own interactive controls, and nested buttons are invalid HTML.
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() }
      }}
      initial={reduce ? undefined : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: EASE, delay: (index % 2) * 0.06 + Math.floor(index / 2) * 0.05 }}
      whileHover={reduce ? undefined : { y: -6 }}
      className="group relative text-left rounded-[28px] p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b3a6b]/40"
      style={CARD_STYLE}
      aria-label={`${interest.headline} — open details`}
    >
      {/* Expand affordance — top-right corner (no eyebrow label) */}
      <span
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full grid place-items-center text-[#1b3a6b]/45 group-hover:text-[#1b3a6b] transition-colors"
        style={{ background: 'rgba(255,255,255,0.72)', boxShadow: 'inset 0 0 0 1px rgba(10,22,40,0.06)' }}
        aria-hidden
      >
        ⤢
      </span>

      {/* Non-interactive preview. Responsive (r3f) visuals fill the box directly
          so they stay centred; others use the scale-to-fit wrapper. */}
      <div style={{ height: H, overflow: 'hidden', borderRadius: 18 }} className="pointer-events-none flex justify-center">
        {interest.responsive ? (
          <div style={{ width: '100%', height: '100%' }}>
            <interest.Visual />
          </div>
        ) : (
          <div style={{ height: interest.natH, width: `${100 / k}%`, transform: `scale(${k})`, transformOrigin: 'top center' }}>
            <interest.Visual />
          </div>
        )}
      </div>

      {/* Centered pill title */}
      <h3 className="mt-4 text-center font-bold text-[#0a1628] text-[21px] tracking-tight leading-tight">
        {interest.headline}
      </h3>
    </motion.div>
  )
}

/* ── Centered flip overlay ──────────────────────────────────────────────── */
function Overlay({
  interest, reduce, onClose,
}: {
  interest: Interest; reduce: boolean; onClose: () => void
}) {
  const [flipped, setFlipped] = useState(true) // opens showing the description
  const CARD_H = 520

  const faceBase: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 22,
    overflow: 'hidden',
  }

  return (
    <>
      {/* Dim backdrop */}
      <motion.div
        className="fixed inset-0 z-[100]"
        style={{ background: 'rgba(10,22,40,0.5)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={onClose}
      />

      {/* Card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-5 pointer-events-none">
        <motion.div
          className="relative pointer-events-auto w-full"
          style={{ maxWidth: 560 }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 14 }}
          transition={{ duration: 0.42, ease: EASE }}
          role="dialog"
          aria-modal="true"
          aria-label={interest.headline}
        >
          {/* Floating controls (outside the 3D flip so they never mirror or clip) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-3 -right-3 z-20 w-10 h-10 rounded-full grid place-items-center bg-white text-[#0a1628]/70 hover:text-[#0a1628] shadow-[0_6px_20px_rgba(10,22,40,0.18)] transition-colors"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? 'Show the visual' : 'Read about this'}
            className="absolute -top-3 left-4 z-20 h-10 px-4 rounded-full grid place-items-center bg-white font-mono text-[11px] tracking-widest uppercase text-[#1b3a6b]/70 hover:text-[#1b3a6b] shadow-[0_6px_20px_rgba(10,22,40,0.16)] transition-colors"
          >
            {flipped ? '↺ Visual' : 'Read ↺'}
          </button>

          <div style={{ perspective: 1800 }}>
            <motion.div
              style={{ transformStyle: 'preserve-3d', position: 'relative', height: CARD_H }}
              initial={reduce ? false : { rotateY: 0 }}
              animate={{ rotateY: reduce ? 0 : flipped ? 180 : 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {/* FRONT — interactive visual */}
              <div style={{ ...faceBase, ...CARD_STYLE }} className="flex flex-col px-7 pt-8 pb-6">
                <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                  {/* Definite height so responsive (r3f) canvases don't expand
                      past the card — otherwise the model renders low/oversized. */}
                  <div className="w-full flex items-center justify-center" style={{ height: 380, maxHeight: '100%' }}>
                    <interest.Visual />
                  </div>
                </div>
                <div className="mt-2 shrink-0">
                  <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#1b3a6b]/42">{interest.category}</p>
                  <h3 className="font-bold text-[#0a1628] text-[22px] tracking-tight truncate">{interest.headline}</h3>
                </div>
              </div>

              {/* BACK — description */}
              <div
                style={{ ...faceBase, ...CARD_STYLE, transform: 'rotateY(180deg)' }}
                className="flex flex-col justify-center p-9"
              >
                <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#1b3a6b]/45 mb-4">
                  {interest.category}
                </p>
                <h3 className="font-bold text-[#0a1628] leading-[0.95] tracking-[-0.03em] mb-6" style={{ fontSize: 'clamp(30px, 5vw, 46px)' }}>
                  {interest.headline}
                </h3>
                <p className="text-[16px] md:text-[17px] leading-[1.7] text-[#0a1628]/62">
                  {interest.blurb}
                </p>
                {interest.link && (
                  <a
                    href={interest.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-1.5 font-medium text-[#1b3a6b] hover:text-[#2563eb] transition-colors w-fit"
                  >
                    {interest.link.label} <span aria-hidden>↗</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
