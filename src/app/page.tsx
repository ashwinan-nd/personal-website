import Hero from '@/components/sections/Hero'
import LogoBar from '@/components/sections/LogoBar'
import Passions from '@/components/sections/Passions'
import OpenSource from '@/components/sections/OpenSource'
import Contact from '@/components/sections/Contact'

export default function Home() {
  return (
    <main>
      <Hero />
      <LogoBar />
      <Passions />
      <OpenSource />
      <Contact />
    </main>
  )
}
