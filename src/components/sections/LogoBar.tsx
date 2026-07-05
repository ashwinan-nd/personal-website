'use client'

import { useReducedMotion } from 'framer-motion'

/**
 * Grayed "worked with" marquee between the hero and interests.
 *
 * Real company logo files (supplied by Ashwin, in /public/logos) are rendered
 * grayscaled with preserved aspect ratio. Any without a file fall back to a
 * clean grayscale wordmark. Continuous seamless loop with symmetric edge fades.
 */
type Logo = { name: string; src?: string; wordmark?: string; lower?: boolean; weight?: number; tracking?: string; h?: number }

// Heights are tuned so the TEXT/wordmark inside each logo renders at roughly the
// same cap-height (not so the overall logos match) — mark-heavy logos (WWF panda,
// Delta) scale up so their lettering matches wordmark-only logos (Tesla, Zuper).
const LOGOS: Logo[] = [
  { name: 'ASUW', src: '/logos/asuw.png', h: 50 },
  { name: 'Seattle Kraken', src: '/logos/kraken.avif', h: 44 },
  { name: 'World Wildlife Fund', src: '/logos/wwf.webp', h: 62 },
  { name: 'Zuper', src: '/logos/zuper.png', h: 44 },
  { name: 'Tesla', src: '/logos/tesla.png', h: 64 },
  { name: 'Delta Air Lines', src: '/logos/delta.png', h: 76 },
  { name: 'AWS', src: '/logos/aws.png', h: 50 },
]

function Mark({ logo }: { logo: Logo }) {
  if (logo.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logo.src}
        alt={logo.name}
        style={{ height: logo.h ?? 28, width: 'auto', filter: 'opacity(0.92)' }}
        className="object-contain"
      />
    )
  }
  return (
    <span
      style={{ fontWeight: logo.weight ?? 700, letterSpacing: logo.tracking ?? '0.02em', fontSize: 22, lineHeight: 1 }}
      className={logo.lower ? 'lowercase' : 'uppercase text-[0.86em]'}
    >
      {logo.wordmark ?? logo.name}
    </span>
  )
}

export default function LogoBar() {
  const reduce = useReducedMotion()
  const strip = [...LOGOS, ...LOGOS]

  return (
    <section
      aria-label="Companies Ashwin has worked with"
      className="relative bg-white w-full pt-0 pb-4 overflow-hidden -mt-5"
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
              key={`${logo.name}-${i}`}
              aria-label={logo.name}
              aria-hidden={i >= LOGOS.length}
              className="shrink-0 select-none flex items-center"
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
