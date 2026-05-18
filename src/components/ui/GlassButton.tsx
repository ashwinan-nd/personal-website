'use client'

import { motion } from 'framer-motion'

interface GlassButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  target?: string
  rel?: string
  className?: string
}

export default function GlassButton({
  children,
  href,
  onClick,
  target,
  rel,
  className = '',
}: GlassButtonProps) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 28px',
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(10,22,40,0.78)',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,247,251,0.82) 100%)',
    backdropFilter: 'blur(16px) saturate(160%)',
    WebkitBackdropFilter: 'blur(16px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.95)',
    boxShadow: [
      '0 4px 18px rgba(10,22,40,0.09)',
      '0 1px 4px rgba(10,22,40,0.07)',
      'inset 0 1px 0 rgba(255,255,255,1)',
      'inset 0 -1px 0 rgba(10,22,40,0.035)',
    ].join(','),
    textDecoration: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  }

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        style={style}
        className={className}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      onClick={onClick}
      style={style}
      className={className}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20 }}
    >
      {children}
    </motion.button>
  )
}
