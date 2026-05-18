'use client'

import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function GlassCard({ children, className = '', hover = true, onClick }: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={`rounded-2xl ${className}`}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      whileHover={
        hover
          ? {
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.15)',
              y: -8,
              boxShadow: '0 20px 60px rgba(0,214,255,0.06), 0 0 0 1px rgba(0,214,255,0.08)',
            }
          : undefined
      }
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
