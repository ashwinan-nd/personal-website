'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* Satellites in orbit — same style as satellitemap.space but navy/holographic */
const SATELLITES = [
  { r: 1.32, speed: 0.52, inc: 28,  phase: 0.0 },
  { r: 1.48, speed: 0.34, inc: 51,  phase: 1.3 },
  { r: 1.38, speed: 0.71, inc: -20, phase: 2.5 },
  { r: 1.58, speed: 0.25, inc: 97,  phase: 0.7 },
  { r: 1.28, speed: 0.88, inc: -8,  phase: 3.8 },
  { r: 1.52, speed: 0.41, inc: 65,  phase: 5.1 },
  { r: 1.42, speed: 0.60, inc: 40,  phase: 2.0 },
  { r: 1.62, speed: 0.20, inc: 82,  phase: 4.3 },
]

function buildGrid(r: number) {
  const objs: THREE.LineLoop[] = []
  // Latitude rings
  for (let lat = -75; lat <= 75; lat += 15) {
    const pts: THREE.Vector3[] = []
    const latR = (lat * Math.PI) / 180
    const cosLat = Math.cos(latR)
    const sinLat = Math.sin(latR)
    for (let i = 0; i <= 72; i++) {
      const lon = (i / 72) * Math.PI * 2
      pts.push(new THREE.Vector3(r * cosLat * Math.cos(lon), r * sinLat, r * cosLat * Math.sin(lon)))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color: '#1b3a6b', transparent: true, opacity: 0.3 })
    objs.push(new THREE.LineLoop(geo, mat))
  }
  // Longitude meridians
  for (let lon = 0; lon < 360; lon += 20) {
    const pts: THREE.Vector3[] = []
    const lonR = (lon * Math.PI) / 180
    for (let i = 0; i <= 72; i++) {
      const lat = ((i / 72) * Math.PI) - Math.PI / 2
      pts.push(new THREE.Vector3(r * Math.cos(lat) * Math.cos(lonR), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lonR)))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color: '#1b3a6b', transparent: true, opacity: 0.22 })
    objs.push(new THREE.LineLoop(geo, mat))
  }
  return objs
}

function buildOrbitRing(radius: number, inc: number) {
  const pts: THREE.Vector3[] = []
  const incR = (inc * Math.PI) / 180
  for (let i = 0; i <= 128; i++) {
    const t = (i / 128) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * Math.sin(incR) * radius, Math.sin(t) * radius))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color: '#2563eb', transparent: true, opacity: 0.12 })
  return new THREE.Line(geo, mat)
}

function Globe() {
  const groupRef = useRef<THREE.Group>(null)

  const { gridObjs, orbitRings } = useMemo(() => ({
    gridObjs: buildGrid(1.01),
    orbitRings: SATELLITES.map((s) => buildOrbitRing(s.r, s.inc)),
  }), [])

  return (
    <group ref={groupRef}>
      {/* Atmosphere glow — large transparent sphere */}
      <mesh>
        <sphereGeometry args={[1.12, 48, 48]} />
        <meshPhongMaterial color="#0050ff" emissive="#0030cc" emissiveIntensity={0.08} transparent opacity={0.06} side={THREE.FrontSide} depthWrite={false} />
      </mesh>

      {/* Core globe sphere */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          color="#0a1628"
          emissive="#1b3a6b"
          emissiveIntensity={0.22}
          transparent
          opacity={0.55}
          wireframe={false}
        />
      </mesh>

      {/* Lat/lon grid lines */}
      {gridObjs.map((obj, i) => <primitive key={i} object={obj} />)}

      {/* Orbit path rings */}
      {orbitRings.map((obj, i) => <primitive key={`orbit-${i}`} object={obj} />)}

      {/* Satellites */}
      {SATELLITES.map((s, i) => <Satellite key={i} {...s} />)}
    </group>
  )
}

function Satellite({ r, speed, inc, phase }: { r: number; speed: number; inc: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const incR = (inc * Math.PI) / 180

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * speed + phase
    ref.current.position.set(
      Math.cos(t) * r,
      Math.sin(t) * Math.sin(incR) * r,
      Math.sin(t) * r
    )
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.022, 8, 8]} />
      <meshBasicMaterial color="#ef4444" />
    </mesh>
  )
}

export default function GlobeVisual() {
  return (
    <div className="w-full h-72 relative select-none" data-hover>
      <Canvas
        camera={{ position: [0, 0.8, 3.4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        frameloop="always"
      >
        {/* Inner glow point light */}
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#2563eb" />
        <ambientLight intensity={0.45} color="#aac4ff" />
        <pointLight position={[5, 4, 3]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-4, -3, -4]} intensity={0.25} color="#1b3a6b" />

        <Globe />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.65}
          autoRotate
          autoRotateSpeed={0.6}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.9}
        />
      </Canvas>
      <p className="absolute bottom-0 left-0 right-0 text-center font-mono text-[9px] tracking-widest text-[#0a1628]/22 uppercase pointer-events-none">
        drag to explore
      </p>
    </div>
  )
}
