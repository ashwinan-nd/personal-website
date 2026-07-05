'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { label: 'Passions', href: '#passions' },
  { label: 'Public Projects', href: '#opensource' },
  { label: 'Contact', href: '#contact' },
]

// Header LinkedIn — canonical profile handle (verify if this ever 404s).
const LINKEDIN_URL = 'https://www.linkedin.com/in/ashwin-anand-/'
const GITHUB_URL = 'https://github.com/ashwinan-nd/'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Outside-click, Escape, and scroll all close the menu.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Close on scroll so the menu never lingers over section content.
  useEffect(() => {
    if (!open) return
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open])

  // Toggle a body class so the hero can hide its duplicate nav pills.
  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    return () => document.body.classList.remove('menu-open')
  }, [open])

  const buttonStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(10,22,40,0.12)',
    boxShadow: '0 2px 12px rgba(10,22,40,0.1), inset 0 1px 0 rgba(255,255,255,0.7)',
  }

  return (
    <div
      ref={menuRef}
      className="fixed top-5 right-5 z-50 flex flex-col items-center gap-[20px]"
    >
      {/* Menu toggle — dropdown is absolutely positioned so opening it never
          shifts the icons below. */}
      <div className="relative flex flex-col items-end">
        <motion.button
          onClick={() => setOpen((o) => !o)}
          style={{
            ...buttonStyle,
            background: open ? '#0a1628' : 'rgba(255,255,255,0.82)',
            transition: 'background 0.2s ease',
          }}
          whileTap={{ scale: 0.94 }}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <HamburgerIcon open={open} />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              style={{
                position: 'absolute',
                top: 50,
                right: 0,
                transformOrigin: 'top right',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(10,22,40,0.1)',
                borderRadius: 16,
                boxShadow:
                  '0 12px 36px rgba(10,22,40,0.14), 0 2px 8px rgba(10,22,40,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                padding: 7,
                width: 210,
              }}
            >
              {links.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.13 }}
                  className="group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#0a1628]/72 hover:text-[#0a1628] hover:bg-[#0a1628]/[0.055] active:bg-[#0a1628]/[0.09] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <LinkIcon which={link.label} />
                    {link.label}
                  </span>
                  <span className="text-[#0a1628]/25 group-hover:text-[#0a1628]/55 group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </motion.a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* LinkedIn icon — slides down when the menu is open so the expanded
          panel never overlaps it, and returns when the menu closes. */}
      <motion.a
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...buttonStyle, background: 'rgba(255,255,255,0.82)' }}
        animate={{ marginTop: open ? 150 : 0 }}
        transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.05 }}
        aria-label="LinkedIn profile"
        title="LinkedIn"
      >
        <LinkedInIcon />
      </motion.a>

      {/* GitHub icon */}
      <motion.a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...buttonStyle, background: 'rgba(255,255,255,0.82)' }}
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.05 }}
        aria-label="GitHub profile"
        title="GitHub"
      >
        <GithubIcon />
      </motion.a>
    </div>
  )
}

function LinkIcon({ which }: { which: string }) {
  const c = 'w-3.5 h-3.5 text-[#1b3a6b]/55 group-hover:text-[#1b3a6b] transition-colors'
  if (which === 'Passions')
    return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.35-9.5-8.5C.9 9.9 2 6.5 5 6.5c2 0 3 1.5 3 1.5s1-1.5 3-1.5c3 0 4.1 3.4 2.5 6C19 16.65 12 21 12 21z"/></svg>
  if (which === 'Public Projects')
    return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H5.2L4 17.2z"/></svg>
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <motion.line
        x1="2" y1="5" x2="14" y2="5"
        stroke={open ? 'white' : '#0a1628'}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={open ? { rotate: 45, y: 3 } : { rotate: 0, y: 0 }}
        style={{ transformOrigin: '8px 5px' }}
        transition={{ duration: 0.18 }}
      />
      <motion.line
        x1="2" y1="11" x2="14" y2="11"
        stroke={open ? 'white' : '#0a1628'}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={open ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }}
        style={{ transformOrigin: '8px 11px' }}
        transition={{ duration: 0.18 }}
      />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(10,22,40,0.75)" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
