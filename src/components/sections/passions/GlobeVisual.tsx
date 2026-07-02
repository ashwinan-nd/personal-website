'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* Colored orbital objects around Earth — modeled after LunarLauncher, scaled
   down. Each carries a distinct hue so the constellation reads as varied
   payloads rather than identical dots. */
const SATELLITES = [
  { r: 1.14, speed: 0.52, inc: 28,  phase: 0.0, color: '#ef4444', size: 0.028 },
  { r: 1.22, speed: 0.34, inc: 51,  phase: 1.3, color: '#38bdf8', size: 0.026 },
  { r: 1.17, speed: 0.71, inc: -20, phase: 2.5, color: '#f59e0b', size: 0.030 },
  { r: 1.30, speed: 0.25, inc: 97,  phase: 0.7, color: '#22c55e', size: 0.025 },
  { r: 1.10, speed: 0.88, inc: -8,  phase: 3.8, color: '#a855f7', size: 0.027 },
  { r: 1.26, speed: 0.41, inc: 65,  phase: 5.1, color: '#ffffff', size: 0.024 },
  { r: 1.19, speed: 0.60, inc: 40,  phase: 2.0, color: '#2563eb', size: 0.029 },
  { r: 1.34, speed: 0.20, inc: 82,  phase: 4.3, color: '#f97316', size: 0.026 },
]

/* The Moon — noticeably larger than the satellites, on a wider, slower orbit */
const MOON = { r: 2.05, speed: 0.16, inc: 12, phase: 1.0, size: 0.17 }

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
  const mat = new THREE.LineBasicMaterial({ color: '#2563eb', transparent: true, opacity: 0.32 })
  return new THREE.Line(geo, mat)
}

/* Surface texture: scattered points on the sphere read as a dotted, data-globe
   landmass so the sphere no longer looks flat/untextured. */
function buildSurfaceDots(count: number) {
  const positions = new Float32Array(count * 3)
  const R = 1.008
  for (let i = 0; i < count; i++) {
    // fibonacci sphere for even coverage, with a little clustering
    const y = 1 - (i / (count - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const theta = i * 2.399963 // golden angle
    const cluster = 0.6 + 0.4 * Math.abs(Math.sin(theta * 3) * Math.cos(y * 5))
    positions[i * 3] = Math.cos(theta) * rad * R * cluster + Math.cos(theta) * rad * R * (1 - cluster)
    positions[i * 3 + 1] = y * R
    positions[i * 3 + 2] = Math.sin(theta) * rad * R
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({ color: '#7fb0ff', size: 0.022, transparent: true, opacity: 0.7, sizeAttenuation: true })
  return new THREE.Points(geo, mat)
}

function Globe() {
  const groupRef = useRef<THREE.Group>(null)

  const { gridObjs, orbitRings, moonRing, surfaceDots } = useMemo(() => ({
    gridObjs: buildGrid(1.01),
    orbitRings: SATELLITES.map((s) => buildOrbitRing(s.r, s.inc)),
    moonRing: buildOrbitRing(MOON.r, MOON.inc),
    surfaceDots: buildSurfaceDots(520),
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
          emissiveIntensity={0.28}
          transparent
          opacity={0.72}
          wireframe={false}
        />
      </mesh>

      {/* Surface texture dots */}
      <primitive object={surfaceDots} />

      {/* Lat/lon grid lines */}
      {gridObjs.map((obj, i) => <primitive key={i} object={obj} />)}

      {/* Orbit path rings */}
      {orbitRings.map((obj, i) => <primitive key={`orbit-${i}`} object={obj} />)}
      <primitive object={moonRing} />

      {/* Colored orbital objects */}
      {SATELLITES.map((s, i) => <Satellite key={i} {...s} />)}

      {/* Moon */}
      <Moon />
    </group>
  )
}

function Satellite({ r, speed, inc, phase, color, size }: {
  r: number; speed: number; inc: number; phase: number; color: string; size: number
}) {
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
      <sphereGeometry args={[size, 10, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function Moon() {
  const ref = useRef<THREE.Mesh>(null)
  const incR = (MOON.inc * Math.PI) / 180

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * MOON.speed + MOON.phase
    ref.current.position.set(
      Math.cos(t) * MOON.r,
      Math.sin(t) * Math.sin(incR) * MOON.r,
      Math.sin(t) * MOON.r
    )
    ref.current.rotation.y += 0.004
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[MOON.size, 24, 24]} />
      <meshStandardMaterial color="#b9bec6" emissive="#3a4252" emissiveIntensity={0.18} roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

export default function GlobeVisual() {
  return (
    <div className="w-full h-72 relative select-none" data-hover>
      <Canvas
        camera={{ position: [0, 0.35, 4.3], fov: 38 }}
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
          target={[0, 0, 0]}
          autoRotate
          autoRotateSpeed={0.6}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.9}
        />
      </Canvas>
      <p className="absolute bottom-0 left-0 right-0 text-center font-mono text-[11px] tracking-widest text-[#0a1628]/30 uppercase pointer-events-none">
        drag to explore
      </p>
    </div>
  )
}
