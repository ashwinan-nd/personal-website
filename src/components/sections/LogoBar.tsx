'use client'

import { useReducedMotion } from 'framer-motion'

/**
 * Grayed "worked with" marquee between the hero and interests.
 *
 * Company names are rendered as clean, uniform grayscale wordmarks in the
 * site's own typeface (not trademarked logo artwork). If you drop an official
 * logo asset you're entitled to use at /public/logos/<slug>.svg, set `asset`
 * on that entry and it renders the real logo, auto-grayscaled via CSS filter.
 *
 * Continuous seamless loop with symmetric edge fades; pauses for reduced-motion.
 */
type Logo = { name: string; slug: string; asset?: boolean; tracking?: string; weight?: number; lower?: boolean }

const LOGOS: Logo[] = [
  { name: 'ASUW', slug: 'asuw', weight: 800, tracking: '-0.01em' },
  { name: 'Seattle Kraken', slug: 'kraken', weight: 600, tracking: '0.14em' },
  { name: 'WWF', slug: 'wwf', weight: 800, tracking: '0.02em' },
  { name: 'Zuper', slug: 'zuper', weight: 600, lower: true, tracking: '-0.01em' },
  { name: 'Tesla', slug: 'tesla', weight: 500, tracking: '0.36em' },
  { name: 'Delta', slug: 'delta', weight: 600, tracking: '0.12em' },
  { name: 'AWS', slug: 'aws', weight: 800, lower: true, tracking: '0.02em' },
]

function Mark({ logo }: { logo: Logo }) {
  if (logo.asset) {
    // Real logo asset (grayscaled). Add the file to /public/logos/<slug>.svg.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={`/logos/${logo.slug}.svg`}
        alt={logo.name}
        className="h-6 md:h-7 w-auto"
        style={{ filter: 'grayscale(1) brightness(0) opacity(0.34)' }}
      />
    )
  }
  return (
    <span
      style={{ fontWeight: logo.weight ?? 700, letterSpacing: logo.tracking ?? '0.02em', fontSize: 22, lineHeight: 1 }}
      className={logo.lower ? 'lowercase' : logo.name.length <= 4 ? '' : 'uppercase text-[0.86em]'}
    >
      {logo.name === 'Seattle Kraken' ? 'Kraken' : logo.name}
    </span>
  )
}

export default function LogoBar() {
  const reduce = useReducedMotion()
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
          className="flex w-max items-center text-[#0a1628]/34"
          style={{ gap: 72, paddingRight: 72, animation: reduce ? undefined : 'logo-marquee 34s linear infinite' }}
        >
          {strip.map((logo, i) => (
            <li
              key={`${logo.slug}-${i}`}
              aria-label={logo.name}
              aria-hidden={i >= LOGOS.length}
              className="shrink-0 hover:text-[#0a1628]/55 transition-colors select-none"
            >
              <Mark logo={logo} />
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
