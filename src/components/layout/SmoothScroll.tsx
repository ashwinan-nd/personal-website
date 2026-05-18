'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    __lenis?: {
      scrollTo: (
        target: number,
        options?: { duration?: number; easing?: (t: number) => number; onComplete?: () => void }
      ) => void
    }
  }
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenis: import('lenis').default

    const init = async () => {
      const Lenis = (await import('lenis')).default
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')

      gsap.registerPlugin(ScrollTrigger)

      lenis = new Lenis({
        duration: 1.0,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      })

      // Expose globally so Passions can call scrollTo for panel snapping
      window.__lenis = lenis as typeof window.__lenis

      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((time: number) => lenis.raf(time * 1000))
      gsap.ticker.lagSmoothing(0)
    }

    init()
    return () => {
      lenis?.destroy()
      delete window.__lenis
    }
  }, [])

  return <>{children}</>
}
