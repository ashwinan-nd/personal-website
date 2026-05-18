'use client'

import { useRef, useState, useCallback } from 'react'

interface MagnetState {
  x: number
  y: number
}

interface UseMagnetReturn {
  ref: React.RefObject<HTMLElement | null>
  x: number
  y: number
  onMouseMove: (e: React.MouseEvent) => void
  onMouseLeave: () => void
  onMouseEnter: () => void
  isHovered: boolean
}

export function useMagnet(strength: number = 0.3): UseMagnetReturn {
  const ref = useRef<HTMLElement | null>(null)
  const [{ x, y }, setPosition] = useState<MagnetState>({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const offsetX = (e.clientX - centerX) * strength
      const offsetY = (e.clientY - centerY) * strength
      const maxOffset = 10
      setPosition({
        x: Math.max(-maxOffset, Math.min(maxOffset, offsetX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, offsetY)),
      })
    },
    [strength]
  )

  const onMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 })
    setIsHovered(false)
  }, [])

  const onMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  return { ref, x, y, onMouseMove, onMouseLeave, onMouseEnter, isHovered }
}
