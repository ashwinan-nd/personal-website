'use client'

import { useReducedMotion } from 'framer-motion'

/**
 * Grayed "worked with" logo marquee between the hero and interests.
 * Marks are simplified, single-tone grayscale representations (not exact
 * trademark artwork) so the strip reads as one cohesive Adam-Hickey-style bar.
 * Continuous seamless loop with symmetric edge fades; pauses for reduced-motion.
 */

function Wordmark({ children, tracking = '0.02em', weight = 700 }: { children: React.ReactNode; tracking?: string; weight?: number }) {
  return (
    <span style={{ fontWeight: weight, letterSpacing: tracking, fontSize: 22, lineHeight: 1 }}>
      {children}
    </span>
  )
}

const LOGOS: { name: string; node: React.ReactNode }[] = [
  { name: 'ASUW', node: <Wordmark weight={800} tracking="-0.01em">ASUW</Wordmark> },
  {
    name: 'Seattle Kraken',
    node: (
      <span className="inline-flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="10" r="5" />
          <path d="M8 14c-1 3-3 4-5 4M12 15v5M16 14c1 3 3 4 5 4M10 15c-.5 3-1.5 4-3 5M14 15c.5 3 1.5 4 3 5" />
        </svg>
        <Wordmark weight={600} tracking="0.18em"><span className="uppercase text-[0.82em]">Kraken</span></Wordmark>
      </span>
    ),
  },
  {
    name: 'World Wildlife Fund',
    node: (
      <span className="inline-flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 3c-1.6 0-2.7 1-3.4 2C7 4.4 5.4 4.7 4.6 6c-.7 1.2-.2 2.6.6 3.4C4 10.6 3.5 12.4 4.4 14c1.3 2.5 4.4 4.5 7.6 6 3.2-1.5 6.3-3.5 7.6-6 .9-1.6.4-3.4-.8-4.6.8-.8 1.3-2.2.6-3.4-.8-1.3-2.4-1.6-4-1C14.7 4 13.6 3 12 3z" />
          <circle cx="9.4" cy="10.6" r="1.1" fill="#fff" />
          <circle cx="14.6" cy="10.6" r="1.1" fill="#fff" />
        </svg>
        <Wordmark weight={800}>WWF</Wordmark>
      </span>
    ),
  },
  { name: 'Zuper', node: <Wordmark weight={600} tracking="-0.01em"><span className="lowercase">zuper</span></Wordmark> },
  { name: 'Tesla', node: <Wordmark weight={500} tracking="0.4em"><span className="uppercase">Tesla</span></Wordmark> },
  {
    name: 'Delta Air Lines',
    node: (
      <span className="inline-flex items-center gap-2">
        <svg width="20" height="18" viewBox="0 0 24 22" fill="currentColor" aria-hidden>
          <path d="M12 2 2 20h20L12 2zm0 5 5.5 10h-11L12 7z" />
        </svg>
        <Wordmark weight={600} tracking="0.1em"><span className="uppercase">Delta</span></Wordmark>
      </span>
    ),
  },
  {
    name: 'AWS',
    node: (
      <span className="inline-flex flex-col items-center leading-none">
        <Wordmark weight={800}><span className="lowercase">aws</span></Wordmark>
        <svg width="30" height="8" viewBox="0 0 30 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M2 3c8 5 18 5 26 0" />
          <path d="M24 2l3 1-1 3" />
        </svg>
      </span>
    ),
  },
]

export default function LogoBar() {
  const reduce = useReducedMotion()
  // duplicated once for a seamless -50% loop
  const strip = [...LOGOS, ...LOGOS]

  return (
    <section
      aria-label="Companies Ashwin has worked with"
      className="relative bg-white w-full pt-6 pb-4 overflow-hidden"
    >
      <p className="text-center font-mono text-[10px] tracking-[0.34em] uppercase text-[#0a1628]/32 mb-6">
        Worked with
      </p>

      <div
        className="relative mx-auto max-w-6xl"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
        }}
      >
        <ul
          className="flex w-max items-center"
          style={{
            gap: 68,
            paddingRight: 68,
            animation: reduce ? undefined : 'logo-marquee 32s linear infinite',
          }}
        >
          {strip.map((logo, i) => (
            <li
              key={`${logo.name}-${i}`}
              aria-label={logo.name}
              aria-hidden={i >= LOGOS.length}
              className="shrink-0 text-[#0a1628]/34 hover:text-[#0a1628]/55 transition-colors select-none"
            >
              {logo.node}
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes logo-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
