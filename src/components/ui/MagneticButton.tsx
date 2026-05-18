'use client'

import { motion } from 'framer-motion'
import { useMagnet } from '@/components/animations/useMagnet'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  strength?: number
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function MagneticButton({
  children,
  className = '',
  style,
  strength = 0.3,
  onClick,
  href,
  target,
  rel,
  type = 'button',
}: MagneticButtonProps) {
  const { ref, x, y, onMouseMove, onMouseLeave, onMouseEnter, isHovered } = useMagnet(strength)

  const sharedProps = {
    animate: { x, y, scale: isHovered ? 1.04 : 1 },
    transition: { type: 'spring' as const, stiffness: 150, damping: 15, mass: 0.5 },
    onMouseMove,
    onMouseLeave,
    onMouseEnter,
    className,
    style,
  }

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        {...sharedProps}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      {...sharedProps}
    >
      {children}
    </motion.button>
  )
}
