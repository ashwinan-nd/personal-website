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
    id: 'personal-website',
    name: 'Personal Website',
    tagline: 'Portfolio',
    description:
      'My portfolio, rebuilt to behave like a product. A dot-matrix avatar rendered from a photo in the browser, scroll-driven motion, and interactive 3D tiles.',
    href: 'https://github.com/ashwinan-nd/personal-website',
    preview: '/preview-website.png',
    stack: ['Next.js', 'React', 'TypeScript', 'Three.js', 'Framer Motion'],
    digest: {
      oneLiner: 'A portfolio that behaves like a product, not a resume.',
      sections: [
        {
          label: 'Problem',
          body:
            'Most developer portfolios are static and forgettable. I wanted something that shows how I think and earns trust in the first few seconds.',
        },
        {
          label: 'What it does',
          bullets: [
            'Renders my photo as a live dot-matrix avatar entirely in the browser, with background removal calibrated from the source image.',
            'Tilts the avatar forward as you scroll, mapped continuously to scroll progress.',
            'Interactive 3D interest tiles: an orbital globe, an explodable GPU, and a live market chart.',
            'Live prices run through a server proxy so the API key never reaches the client.',
          ],
        },
        {
          label: 'How it is built',
          body:
            'Next.js App Router with React and TypeScript. Three.js and React Three Fiber for the 3D, Framer Motion for choreography, Lenis for smooth scroll, and a canvas halftone renderer for the avatar.',
        },
        {
          label: 'Status',
          body: 'Live and iterated on constantly. This page is the latest cut.',
        },
      ],
    },
  },
  {
    id: 'launch-lunar',
    name: 'Launch Lunar',
    tagline: 'Space simulator',
    description:
      'A real-time satellite tracker and lunar launch-trajectory simulator. Over 33,000 tracked objects from live orbital catalogs, in a 3D Earth you can fly around.',
    href: 'https://github.com/ashwinan-nd/launchlunar',
    preview: '/preview-launchlunar.png',
    stack: ['Vite', 'Three.js', 'satellite.js', 'mathjs', 'GSAP'],
    digest: {
      oneLiner: 'A launch simulator built on a live catalog of everything in orbit.',
      sections: [
        {
          label: 'Problem',
          body:
            'Orbital data is scattered and hard to reason about. I wanted one place to see the whole sky and plan a launch against it.',
        },
        {
          label: 'What it does',
          bullets: [
            'Tracks 33,000+ objects (satellites, debris, Starlink, GPS, stations) from CelesTrak, N2YO, and SATCAT.',
            'Propagates real orbits with satellite.js and renders them around a 3D Earth.',
            'Configure a vehicle and launch window, then simulate a trajectory to the Moon.',
            'Filter by object class and search the catalog live.',
          ],
        },
        {
          label: 'How it is built',
          body:
            'Vite and vanilla JavaScript for a tight bundle, Three.js for the 3D scene, satellite.js for SGP4 propagation, mathjs for the trajectory math, and GSAP for camera moves.',
        },
        {
          label: 'Status',
          body: 'Active build. Catalog and trajectory model are both improving.',
        },
      ],
    },
  },
]

export default function OpenSource() {
  const [openDigest, setOpenDigest] = useState<string | null>(null)
  const active = projects.find((p) => p.id === openDigest) ?? null

  return (
    <section id="opensource" className="relative bg-white pt-28 pb-36 overflow-hidden">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header — "Open source" label removed */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-16"
        >
          <h2
            className="font-bold text-[#0a1628] leading-[0.92] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)', marginBottom: 'clamp(16px, 2.5vh, 24px)' }}
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
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute top-3 right-3 w-8 h-8 rounded-full grid place-items-center bg-white/85 backdrop-blur text-[#0a1628]/70 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          ↗
        </span>
      </a>

      {/* Body */}
      <div className="flex flex-col flex-1 p-7">
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
        <p className="mt-3 text-[14px] text-[#0a1628]/55 leading-relaxed">
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

        {/* Long narrow "Read Product Digest" button */}
        <button
          type="button"
          onClick={onToggleDigest}
          aria-expanded={isOpen}
          className="mt-6 w-full py-3 rounded-full font-mono text-[11px] tracking-[0.2em] uppercase text-white bg-[#0a1628] hover:bg-[#1b3a6b] transition-colors"
        >
          {isOpen ? 'Hide Product Digest' : 'Read Product Digest'}
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
      <div className="relative mt-7 rounded-3xl bg-[#f5f7fb] shadow-[0_12px_48px_rgba(10,22,40,0.08)]">
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
