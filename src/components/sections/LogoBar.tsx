'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Grayed, static "worked with" logo strip between the hero and interests.
 * Wordmarks are rendered as uniform muted-gray typography (no brand colour,
 * no motion) so they read as one cohesive Adam-Hickey-style bar.
 */
const LOGOS: { name: string; node: React.ReactNode }[] = [
  { name: 'ASUW', node: <span className="font-extrabold tracking-tight">ASUW</span> },
  {
    name: 'Seattle Kraken',
    node: <span className="font-semibold tracking-[0.24em] uppercase text-[0.82em]">Kraken</span>,
  },
  { name: 'World Wildlife Fund', node: <span className="font-black tracking-tight">WWF</span> },
  { name: 'Zuper', node: <span className="font-semibold lowercase tracking-tight">zuper</span> },
  { name: 'Tesla', node: <span className="font-medium tracking-[0.42em] uppercase">Tesla</span> },
  {
    name: 'Delta Air Lines',
    node: (
      <span className="font-semibold tracking-[0.12em] uppercase inline-flex items-center gap-1">
        <span className="text-[0.9em]">▲</span>Delta
      </span>
    ),
  },
  { name: 'AWS', node: <span className="font-bold lowercase tracking-tight">aws</span> },
]

export default function LogoBar() {
  const reduce = useReducedMotion()
  return (
    <section
      aria-label="Companies Ashwin has worked with"
      className="relative bg-white w-full py-14 md:py-20 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.p
          initial={reduce ? undefined : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center font-mono text-[10px] tracking-[0.34em] uppercase text-[#0a1628]/32 mb-9"
        >
          Worked with
        </motion.p>

        <motion.ul
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14 lg:gap-x-16"
        >
          {LOGOS.map((logo) => (
            <li
              key={logo.name}
              aria-label={logo.name}
              className="text-[#0a1628]/34 text-[19px] md:text-[22px] leading-none select-none"
            >
              {logo.node}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
