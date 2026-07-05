'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

type DigestSection = { label: string; body?: string; bullets?: string[] }
type Project = {
  id: string
  name: string
  tagline: string
  description: string
  href: string
  preview: string
  stack: string[]
  digest: {
    oneLiner: string
    sections: DigestSection[]
  }
}

const projects: Project[] = [
  {
    id: 'launch-lunar',
    name: 'Launch Lunar',
    tagline: 'Space simulator',
    description:
      'A real-time satellite tracker and lunar launch-trajectory simulator. 33,000+ tracked objects from live orbital catalogs, in a 3D Earth you can fly around.',
    href: 'https://github.com/ashwinan-nd/launchlunar',
    preview: '/preview-launchlunar.png',
    stack: ['Vite', 'Three.js', 'satellite.js', 'mathjs', 'GSAP'],
    digest: {
      oneLiner: 'A launch simulator built on a live catalog of everything in orbit.',
      sections: [
        {
          label: 'Problem',
          body:
            'As more orbital objects and infrastructure launch into orbit, the more management and tracking we need as missions to deep space and interplanetary travel become more abundant. The data to reason about that is scattered. I wanted one place to see the whole sky and plan a launch against it.',
        },
        {
          label: 'What it does',
          bullets: [
            'Pulls the live catalog — 33,000+ satellites, debris, Starlink, GPS, and stations — from CelesTrak, N2YO, and SATCAT.',
            'Propagates every orbit with satellite.js (SGP4) and draws them around a 3D Earth you can spin and zoom.',
            'Lets you set a rocket, a launch site, and a window, then flies a trajectory out to the Moon.',
            'Search or filter by object class to pull one object out of the swarm.',
          ],
        },
        {
          label: 'How I built it',
          bullets: [
            'Got one Earth and one orbit propagating correctly first, then scaled the renderer up to the whole catalog.',
            'Collapsed all 33k objects into a single Three.js instanced-points mesh — thousands of separate meshes tanked the frame rate.',
            'Moved propagation off the main thread and cached the catalog so a reload does not re-hit every API.',
            'Wrote the transfer-orbit math in mathjs, then used GSAP to move the camera between Earth, Trajectory, and Moon views.',
            'Color-coded by object class and faded distant debris so the swarm stays readable.',
          ],
        },
        {
          label: 'Design',
          body:
            'Mission-control look: dark canvas, category-colored objects, and a left rail of parameters that never blocks the view. The three modes share one camera language so switching never disorients you.',
        },
        {
          label: 'Next',
          body: 'A physics-accurate lunar transfer model, and collision-risk scoring across the whole tracked set.',
        },
      ],
    },
  },
  {
    id: 'personal-website',
    name: 'Personal Website',
    tagline: 'Portfolio',
    description:
      "I wanted a face to go with the name — this site is an extension of who I am. I'm a visual learner, so I built something you experience instead of read.",
    href: 'https://github.com/ashwinan-nd/personal-website',
    preview: '/preview-website.png',
    stack: ['Next.js', 'React', 'TypeScript', 'Three.js', 'Framer Motion'],
    digest: {
      oneLiner: 'My portfolio, built like a product and an extension of who I am.',
      sections: [
        {
          label: 'Why',
          body:
            "Putting a face to the name matters to me, so the first thing you see is me. This site is an extension of who I am, not a resume. I'm a visual learner — I would rather show you how I think than list it out, so every section is something you play with.",
        },
        {
          label: 'What it does',
          bullets: [
            'Opens on a halftone portrait of me that looks up and down on a loop.',
            'Ties every section together with a tile grid that reacts to your cursor.',
            'Passions are live 3D toys: an orbital globe, a GPU you can explode, and a market chart on real prices.',
            'Live prices run through my own server proxy, so the API key never touches your browser.',
          ],
        },
        {
          label: 'How I built it',
          bullets: [
            'Next.js App Router, with the heavy Three.js code split behind dynamic imports so first paint stays fast.',
            'Made the portrait a halftone loop, then rounded and faded its bottom so it melts into the page instead of sitting in a box.',
            'Built each passion as its own self-contained canvas, then centered them against the shared grid.',
            'Proxied Finnhub and market data through server route handlers; the key lives in an env var, never the client bundle.',
            'Kept a strict layout so sections never collide, and made every animation respect reduced-motion.',
          ],
        },
        {
          label: 'Design',
          body:
            'One calm system: a single navy ink, soft neomorphic surfaces, and the tile grid under everything. Motion earns attention instead of fighting it.',
        },
        {
          label: 'Status',
          body: 'Live and iterated on constantly. This page is the latest cut.',
        },
      ],
    },
  },
]

export default function OpenSource() {
  const [openDigest, setOpenDigest] = useState<string | null>(null)
  const active = projects.find((p) => p.id === openDigest) ?? null

  return (
    <section id="opensource" className="relative bg-white pt-6 md:pt-10 pb-44 overflow-hidden">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header — left-aligned title with page margin, subtitle beneath */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-20"
        >
          <h2
            className="font-bold text-[#0a1628] leading-[0.92] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)', marginBottom: 'clamp(22px, 3.5vh, 34px)' }}
          >
            Exploring ideas
            <br />
            in public.
          </h2>
          <p className="text-[17px] text-[#0a1628]/48 leading-relaxed">
            Personal projects, constantly being worked on.
          </p>
        </motion.div>

        {/* Project pills — slightly longer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-7">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              isOpen={openDigest === p.id}
              onToggleDigest={() => setOpenDigest((cur) => (cur === p.id ? null : p.id))}
            />
          ))}
        </div>

        {/* Product digest — expands below the section, section width, no dimming */}
        <AnimatePresence initial={false}>
          {active && (
            <ProductDigest key={active.id} project={active} onClose={() => setOpenDigest(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom blend into Contact's TileGrid — sits inside the bottom padding,
          below the cards, so it never washes out card content. */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-0"
        style={{
          height: 110,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.85) 60%, white 100%)',
        }}
      />
    </section>
  )
}

function ProjectCard({
  project, index, isOpen, onToggleDigest,
}: {
  project: Project; index: number; isOpen: boolean; onToggleDigest: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
      className="group flex flex-col rounded-3xl overflow-hidden bg-[#f5f7fb] shadow-[0_10px_40px_rgba(10,22,40,0.06)] hover:shadow-[0_16px_54px_rgba(10,22,40,0.11)] transition-shadow duration-300"
    >
      {/* Live preview */}
      <a
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block w-full aspect-[16/10] overflow-hidden bg-[#0a1628]"
        aria-label={`${project.name} on GitHub`}
      >
        <Image
          src={project.preview}
          alt={`${project.name} preview`}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute top-3 right-3 w-8 h-8 rounded-full grid place-items-center bg-white/85 backdrop-blur text-[#0a1628]/70 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          ↗
        </span>
      </a>

      {/* Body — taller pill; description clamped to 2 lines; chips and CTA
          kept apart so they never collide. */}
      <div className="flex flex-col flex-1 p-7 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] tracking-[0.26em] uppercase text-[#1b3a6b]/40">
            {project.tagline}
          </span>
        </div>
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#0a1628] text-[22px] tracking-tight hover:text-[#1b3a6b] transition-colors w-fit"
        >
          {project.name}
        </a>
        <p
          className="mt-3 text-[14px] text-[#0a1628]/55 leading-relaxed overflow-hidden"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.8em' }}
        >
          {project.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span
              key={s}
              className="font-mono text-[10px] tracking-wide px-2.5 py-1 rounded-full bg-white text-[#0a1628]/45 shadow-[inset_0_0_0_1px_rgba(10,22,40,0.06)]"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Long narrow "Read Product Digest" button — pushed to the bottom */}
        <button
          type="button"
          onClick={onToggleDigest}
          aria-expanded={isOpen}
          className="mt-auto pt-7 w-full flex justify-center"
        >
          <span className="w-full py-3 rounded-full text-center font-mono text-[11px] tracking-[0.2em] uppercase text-white bg-[#0a1628] hover:bg-[#1b3a6b] transition-colors">
            {isOpen ? 'Hide Product Digest' : 'Read Product Digest'}
          </span>
        </button>
      </div>
    </motion.div>
  )
}

function ProductDigest({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="overflow-hidden"
    >
      <div className="relative mt-10 rounded-3xl bg-[#f5f7fb] shadow-[0_16px_56px_rgba(10,22,40,0.12)] ring-1 ring-[#0a1628]/[0.06]">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Collapse product digest"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full grid place-items-center bg-white text-[#0a1628]/60 hover:text-[#0a1628] shadow-[0_4px_16px_rgba(10,22,40,0.12)] transition-colors"
        >
          ✕
        </button>

        {/* Scoped-scroll body:
            data-lenis-prevent lets native scroll handle the wheel while the
            cursor is inside; overscroll-contain stops scroll-chaining to the
            page. Cursor outside → the page scrolls normally. */}
        <div
          data-lenis-prevent
          className="overflow-y-auto px-8 py-9 md:px-12 md:py-11"
          style={{ maxHeight: '66vh', overscrollBehavior: 'contain' }}
        >
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#1b3a6b]/45 mb-4">
            Product Digest · {project.name}
          </p>
          <h3
            className="font-bold text-[#0a1628] leading-[1.05] tracking-[-0.03em] mb-8"
            style={{ fontSize: 'clamp(24px, 3.4vw, 38px)' }}
          >
            {project.digest.oneLiner}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-8 gap-y-9">
            {project.digest.sections.map((sec) => (
              <div key={sec.label} className="contents">
                <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#0a1628]/40 md:pt-1">
                  {sec.label}
                </p>
                <div>
                  {sec.body && (
                    <p className="text-[15px] md:text-[16px] leading-[1.7] text-[#0a1628]/68">
                      {sec.body}
                    </p>
                  )}
                  {sec.bullets && (
                    <ul className="space-y-3">
                      {sec.bullets.map((b, i) => (
                        <li key={i} className="flex gap-3 text-[15px] md:text-[16px] leading-[1.6] text-[#0a1628]/68">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#1b3a6b]/40 shrink-0" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-7 border-t border-[#0a1628]/8">
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-[#1b3a6b] hover:text-[#2563eb] transition-colors"
            >
              View {project.name} on GitHub <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
