'use client'

import { motion } from 'framer-motion'

const projects: { name: string; description: string; href: string }[] = []
const GITHUB_URL = 'https://github.com/ashwinan-nd/'

export default function OpenSource() {
  return (
    <section id="opensource" className="relative bg-white pt-32 pb-36 overflow-hidden min-h-[88vh] flex flex-col" style={{ paddingLeft: '15%', paddingRight: '5%' }}>
      <div className="max-w-4xl flex-1">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#1b3a6b]/38 uppercase mb-6">
            OPEN SOURCE
          </p>
          <h2
            className="font-bold text-[#0a1628] leading-[0.92] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)', marginBottom: 'clamp(20px, 3vh, 32px)' }}
          >
            Exploring ideas
            <br />
            in public.
          </h2>
          <p
            className="text-[17px] text-[#0a1628]/48 leading-relaxed max-w-sm"
            style={{ marginBottom: 'clamp(52px, 8vh, 88px)' }}
          >
            All projects live on Github - always evolving.
          </p>
        </motion.div>

        {/* Project cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ marginBottom: 'clamp(56px, 9vh, 96px)' }}
        >
          {projects.length > 0
            ? projects.map((p, i) => <ProjectCard key={p.name} project={p} index={i} />)
            : [0, 1, 2].map((i) => <PlaceholderCard key={i} index={i} />)}
        </div>

      </div>

      {/* Bottom blend gradient into Contact's TileGrid */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '35%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0.88) 65%, white 100%)',
        }}
      />
    </section>
  )
}

function ProjectCard({
  project,
  index,
}: {
  project: { name: string; description: string; href: string }
  index: number
}) {
  return (
    <motion.a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group block p-7 rounded-2xl bg-[#f5f7fb] hover:bg-white hover:shadow-[0_8px_40px_rgba(10,22,40,0.08)] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="p-2.5 rounded-xl bg-white shadow-sm">
          <GithubIcon className="w-4 h-4 text-[#0a1628]/60" />
        </div>
        <span className="text-[#0a1628]/30 group-hover:text-[#0a1628]/60 transition-colors">↗</span>
      </div>
      <h3 className="font-semibold text-[#0a1628] text-[15px] mb-3">{project.name}</h3>
      <p className="text-[13px] text-[#0a1628]/50 leading-relaxed">{project.description}</p>
    </motion.a>
  )
}

function PlaceholderCard({ index }: { index: number }) {
  return (
    <motion.a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group block p-7 rounded-2xl bg-[#f5f7fb] hover:bg-white hover:shadow-[0_8px_40px_rgba(10,22,40,0.06)] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="p-2.5 rounded-xl bg-white shadow-sm">
          <GithubIcon className="w-4 h-4 text-[#0a1628]/25" />
        </div>
        <span className="font-mono text-[10px] tracking-widest text-[#0a1628]/22 uppercase">Soon</span>
      </div>
      <div className="space-y-2.5 mb-6">
        <div className="h-2.5 rounded-full bg-[#0a1628]/[0.07] w-3/4" />
        <div className="h-2 rounded-full bg-[#0a1628]/[0.05] w-full" />
        <div className="h-2 rounded-full bg-[#0a1628]/[0.05] w-2/3" />
      </div>
      <p className="text-[12px] text-[#0a1628]/30 group-hover:text-[#0a1628]/55 transition-colors">
        View on GitHub →
      </p>
    </motion.a>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
