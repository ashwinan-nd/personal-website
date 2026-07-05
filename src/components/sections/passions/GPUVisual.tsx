'use client'

import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * NVIDIA H100 PCIe — accurate physical stack, built from individual geometries.
 *
 * Layer stack (bottom → top):
 *   Backplate → PCB (w/ SMD caps) → PCIe connector → VRM inductors
 *   → GH100 die (w/ substrate + grid) + HBM3 ×6 → Thermal interface
 *   → NVLink fabric → Vapor chamber → Heatsink fins (×22 individual)
 *   → Fan shroud → Dual fans (×2, with blades)
 */

// Shared materials cache — all dark parts lifted to medium-light gray so detail reads clearly
const MAT = {
  backplate:   new THREE.MeshStandardMaterial({ color: '#727272', metalness: 0.80, roughness: 0.35 }),
  pcb:         new THREE.MeshStandardMaterial({ color: '#4e6a54', metalness: 0.15, roughness: 0.82 }),
  connector:   new THREE.MeshStandardMaterial({ color: '#6c6c6c', metalness: 0.55, roughness: 0.55 }),
  vrm:         new THREE.MeshStandardMaterial({ color: '#686240', metalness: 0.35, roughness: 0.70 }),
  inductor:    new THREE.MeshStandardMaterial({ color: '#7c7a42', metalness: 0.60, roughness: 0.48 }),
  substrate:   new THREE.MeshStandardMaterial({ color: '#4e6648', metalness: 0.12, roughness: 0.80 }),
  die:         new THREE.MeshStandardMaterial({ color: '#4e6882', metalness: 0.58, roughness: 0.32, envMapIntensity: 0.5 }),
  hbm3:        new THREE.MeshStandardMaterial({ color: '#52507a', metalness: 0.48, roughness: 0.38 }),
  hbm3bump:    new THREE.MeshStandardMaterial({ color: '#6a6292', metalness: 0.62, roughness: 0.28 }),
  tim:         new THREE.MeshStandardMaterial({ color: '#bab8a0', metalness: 0.70, roughness: 0.25 }),
  nvlink:      new THREE.MeshStandardMaterial({ color: '#52627c', metalness: 0.52, roughness: 0.48 }),
  vapor:       new THREE.MeshStandardMaterial({ color: '#9a6040', metalness: 0.82, roughness: 0.22 }),
  fin:         new THREE.MeshStandardMaterial({ color: '#9aA0a8', metalness: 0.78, roughness: 0.25 }),
  shroud:      new THREE.MeshStandardMaterial({ color: '#6c6c6c', metalness: 0.42, roughness: 0.68 }),
  fanHub:      new THREE.MeshStandardMaterial({ color: '#747474', metalness: 0.62, roughness: 0.48 }),
  fanBlade:    new THREE.MeshStandardMaterial({ color: '#7c7c7c', metalness: 0.52, roughness: 0.58 }),
  capElec:     new THREE.MeshStandardMaterial({ color: '#767244', metalness: 0.32, roughness: 0.68 }),
  capCeramic:  new THREE.MeshStandardMaterial({ color: '#6a6a6a', metalness: 0.22, roughness: 0.78 }),
  capTop:      new THREE.MeshStandardMaterial({ color: '#6a6a5a', metalness: 0.32, roughness: 0.62 }),
  pin:         new THREE.MeshStandardMaterial({ color: '#c0a830', metalness: 0.95, roughness: 0.15 }),
  solder:      new THREE.MeshStandardMaterial({ color: '#888878', metalness: 0.60, roughness: 0.40 }),
}

// Helper: lerp a group's Y toward destination
function useLerpY(naturalY: number, explodedY: number, exploded: boolean) {
  const curY = useRef(naturalY)
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current) return
    const dest = exploded ? explodedY : naturalY
    curY.current += (dest - curY.current) * 0.09
    groupRef.current.position.y = curY.current
  })
  return groupRef
}

// ── Backplate ───────────────────────────────────────────────────────────────
function Backplate({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.64, -2.65, exploded)
  const bolts = useMemo(() => [
    [-1.6, 0.8], [1.6, 0.8], [-1.6, -0.8], [1.6, -0.8],
  ] as [number, number][], [])

  return (
    <group ref={ref} position={[0, -0.64, 0]}>
      <mesh material={MAT.backplate} castShadow>
        <boxGeometry args={[3.8, 0.05, 2.0]} />
      </mesh>
      {/* Mounting bolt bosses */}
      {bolts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.035, z]} material={MAT.connector} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.025, 8]} />
        </mesh>
      ))}
    </group>
  )
}

// ── PCB with SMD components ─────────────────────────────────────────────────
function PCB({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.52, -1.95, exploded)

  const electrolyticCaps = useMemo(() => [
    [-1.45, -0.72], [-1.55, -0.50], [-1.62, -0.28], [-1.48, -0.06],
    [-1.56, 0.18],  [-1.44, 0.40],  [-1.60, 0.62],
    [1.45, -0.72],  [1.58, -0.48],  [1.44, -0.22],
  ] as [number, number][], [])

  const ceramicCaps = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      x: -1.1 + (i % 7) * 0.38 + (Math.sin(i * 2.3) * 0.06),
      z: -0.55 + Math.floor(i / 7) * 0.42 + (Math.cos(i * 1.7) * 0.04),
    })), [])

  return (
    <group ref={ref} position={[0, -0.52, 0]}>
      {/* Main board */}
      <mesh material={MAT.pcb} receiveShadow>
        <boxGeometry args={[3.8, 0.09, 2.0]} />
      </mesh>
      {/* Electrolytic caps — tall cylinders */}
      {electrolyticCaps.map(([x, z], i) => (
        <group key={i} position={[x, 0.055, z]}>
          <mesh material={MAT.capElec} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.12, 8]} />
          </mesh>
          {/* Cap top vent cross */}
          <mesh material={MAT.capTop} position={[0, 0.063, 0]}>
            <cylinderGeometry args={[0.042, 0.042, 0.008, 8]} />
          </mesh>
        </group>
      ))}
      {/* Ceramic SMD caps */}
      {ceramicCaps.map((c, i) => (
        <mesh key={i} position={[c.x, 0.055, c.z]} material={MAT.capCeramic} castShadow>
          <boxGeometry args={[0.055, 0.03, 0.032]} />
        </mesh>
      ))}
      {/* PCIe edge finger contacts */}
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={i} position={[1.60 + i * 0.008, 0.05, 0.95]} material={MAT.pin} castShadow>
          <boxGeometry args={[0.006, 0.04, 0.045]} />
        </mesh>
      ))}
    </group>
  )
}

// ── PCIe 5.0 Power Connector ────────────────────────────────────────────────
function PowerConnector({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.40, -1.32, exploded)
  return (
    <group ref={ref} position={[0, -0.40, 0]}>
      <mesh material={MAT.connector} castShadow>
        <boxGeometry args={[0.52, 0.26, 0.44]} />
      </mesh>
      {/* 16 individual pins */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[-0.225 + i * 0.03, -0.10, 0]} material={MAT.pin} castShadow>
          <boxGeometry args={[0.018, 0.14, 0.018]} />
        </mesh>
      ))}
    </group>
  )
}

// ── VRM Assembly ────────────────────────────────────────────────────────────
function VRMAssembly({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.34, -0.82, exploded)
  const inductors = useMemo(() => [
    -0.35, -0.15, 0.05, 0.25, 0.45,
  ] as number[], [])

  return (
    <group ref={ref} position={[0, -0.34, 0]}>
      <mesh material={MAT.vrm} castShadow>
        <boxGeometry args={[1.12, 0.22, 0.30]} />
      </mesh>
      {inductors.map((z, i) => (
        <group key={i} position={[-0.32 + i * 0.16, 0.135, 0]}>
          {/* Inductor body */}
          <mesh material={MAT.inductor} castShadow>
            <boxGeometry args={[0.11, 0.10, 0.11]} />
          </mesh>
          {/* Winding coil ring */}
          <mesh material={MAT.solder} castShadow rotation={[0, 0, 0]}>
            <torusGeometry args={[0.038, 0.012, 6, 14]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── GH100 Die (814 mm² — the largest compute die ever taped out) ────────────
function GH100Die({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.24, -0.14, exploded)

  const gridLines = useMemo(() => {
    const lines: THREE.Line[] = []
    const S = 0.52   // half-size of die
    const STEPS = 7  // grid subdivisions visible on die surface
    const mat = new THREE.LineBasicMaterial({ color: '#1a2a3a', transparent: true, opacity: 0.35 })

    for (let i = 1; i < STEPS; i++) {
      const t = -S + (i / STEPS) * S * 2
      const gX = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-S, 0.078, t), new THREE.Vector3(S, 0.078, t),
      ])
      lines.push(new THREE.Line(gX, mat))
      const gZ = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(t, 0.078, -S), new THREE.Vector3(t, 0.078, S),
      ])
      lines.push(new THREE.Line(gZ, mat))
    }
    return lines
  }, [])

  return (
    <group ref={ref} position={[0, -0.24, 0]}>
      {/* Green organic substrate */}
      <mesh material={MAT.substrate} castShadow>
        <boxGeometry args={[1.22, 0.038, 1.22]} />
      </mesh>
      {/* Silicon die — slightly raised, blue-tinted */}
      <mesh material={MAT.die} position={[0, 0.075, 0]} castShadow>
        <boxGeometry args={[1.05, 0.14, 1.05]} />
      </mesh>
      {/* Die surface grid (compute tile matrix) */}
      {gridLines.map((obj, i) => <primitive key={i} object={obj} />)}
      {/* Solder bump rows at die edge */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-0.48 + i * 0.106, 0.011, 0.56]} material={MAT.solder} castShadow>
          <sphereGeometry args={[0.018, 6, 6]} />
        </mesh>
      ))}
    </group>
  )
}

// ── HBM3 Memory Stacks ×6 (3 per side, flanking the die) ───────────────────
const HBM3_POS = [
  { x: -0.90, z: -0.38 }, { x: -0.90, z:  0.00 }, { x: -0.90, z:  0.38 },
  { x:  0.90, z: -0.38 }, { x:  0.90, z:  0.00 }, { x:  0.90, z:  0.38 },
]

function HBM3Stacks({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.24, -0.14, exploded)

  return (
    <group ref={ref} position={[0, -0.24, 0]}>
      {HBM3_POS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          {/* Stack body — 4 thin DRAM layers */}
          {[0, 0.042, 0.084, 0.126].map((dy, j) => (
            <mesh key={j} position={[0, 0.030 + dy, 0]} material={MAT.hbm3} castShadow>
              <boxGeometry args={[0.26, 0.038, 0.32]} />
            </mesh>
          ))}
          {/* TSV bumps at base */}
          {Array.from({ length: 5 }, (_, k) => (
            <mesh key={k} position={[-0.08 + k * 0.04, 0.008, 0]} material={MAT.hbm3bump} castShadow>
              <sphereGeometry args={[0.012, 5, 5]} />
            </mesh>
          ))}
          {/* Die-to-die wire bonds visible at top */}
          <mesh position={[0, 0.175, 0.16]} material={MAT.solder} castShadow>
            <boxGeometry args={[0.04, 0.012, 0.005]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Thermal Interface Material (Indium foil) ────────────────────────────────
function TIM({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.15, 0.50, exploded)
  return (
    <group ref={ref} position={[0, -0.15, 0]}>
      <mesh material={MAT.tim} castShadow>
        <boxGeometry args={[1.10, 0.012, 1.10]} />
      </mesh>
    </group>
  )
}

// ── NVLink 4.0 Fabric ───────────────────────────────────────────────────────
function NVLinkFabric({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(-0.11, 1.02, exploded)

  const traces = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    x: -0.28 + i * 0.08,
  })), [])

  return (
    <group ref={ref} position={[0, -0.11, 0]}>
      <mesh material={MAT.nvlink} castShadow>
        <boxGeometry args={[0.75, 0.048, 0.75]} />
      </mesh>
      {traces.map((t, i) => (
        <mesh key={i} position={[t.x, 0.028, 0]} material={MAT.pin} castShadow>
          <boxGeometry args={[0.006, 0.008, 0.66]} />
        </mesh>
      ))}
    </group>
  )
}

// ── Vapor Chamber (copper, replaces discrete heat pipes as primary spreader) ─
function VaporChamber({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(0.09, 1.62, exploded)

  // Embossed pipe channel ridges on the top surface
  const ridges = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    z: -0.68 + i * 0.28,
  })), [])

  return (
    <group ref={ref} position={[0, 0.09, 0]}>
      <mesh material={MAT.vapor} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.15, 1.85]} />
      </mesh>
      {ridges.map((r, i) => (
        <mesh key={i} position={[0, 0.082, r.z]} material={MAT.fin} castShadow>
          <boxGeometry args={[3.0, 0.008, 0.015]} />
        </mesh>
      ))}
    </group>
  )
}

// ── Heatsink Fins — 22 individual aluminum slabs ────────────────────────────
function HeatsinkFins({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(0.52, 2.45, exploded)

  const FIN_COUNT = 22
  const TOTAL_Z   = 1.80
  const FIN_D     = 0.054
  const spacing   = TOTAL_Z / FIN_COUNT

  return (
    <group ref={ref} position={[0, 0.52, 0]}>
      {Array.from({ length: FIN_COUNT }, (_, i) => (
        <mesh key={i} position={[0, 0, -TOTAL_Z / 2 + i * spacing + spacing / 2]} material={MAT.fin} castShadow>
          <boxGeometry args={[3.2, 0.36, FIN_D]} />
        </mesh>
      ))}
      {/* Fin base plate connecting all fins */}
      <mesh position={[0, -0.19, 0]} material={MAT.vapor} castShadow>
        <boxGeometry args={[3.2, 0.02, 1.85]} />
      </mesh>
    </group>
  )
}

// ── Fan Shroud ───────────────────────────────────────────────────────────────
function FanShroud({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(0.76, 3.12, exploded)

  // Grille slots on top face
  const slots = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    x: -1.5 + i * 0.33,
  })), [])

  return (
    <group ref={ref} position={[0, 0.76, 0]}>
      <mesh material={MAT.shroud} castShadow>
        <boxGeometry args={[3.8, 0.048, 2.0]} />
      </mesh>
      {slots.map((s, i) => (
        <mesh key={i} position={[s.x, 0.028, 0]} material={MAT.connector} castShadow>
          <boxGeometry args={[0.18, 0.005, 1.50]} />
        </mesh>
      ))}
    </group>
  )
}

// ── Dual Fans — each with hub + 7 blades ────────────────────────────────────
const BLADE_COUNT = 7
const BLADE_OFFSET = 0.30

function FanUnit({ xPos }: { xPos: number }) {
  const blades = useMemo(
    () => Array.from({ length: BLADE_COUNT }, (_, i) => ({
      angle: (i / BLADE_COUNT) * Math.PI * 2,
    })),
    []
  )

  return (
    <group position={[xPos, 0, 0]}>
      {/* Hub */}
      <mesh material={MAT.fanHub} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.10, 16]} />
      </mesh>
      {/* Outer ring */}
      <mesh material={MAT.fanHub} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.64, 0.025, 8, 40]} />
      </mesh>
      {/* Blades */}
      {blades.map(({ angle }, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * BLADE_OFFSET, 0, Math.sin(angle) * BLADE_OFFSET]}
          rotation={[Math.PI / 2, 0, angle + 0.42]}
          material={MAT.fanBlade}
          castShadow
        >
          <boxGeometry args={[0.40, 0.030, 0.14]} />
        </mesh>
      ))}
    </group>
  )
}

function DualFans({ exploded }: { exploded: boolean }) {
  const ref = useLerpY(0.79, 3.72, exploded)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.20
  })

  return (
    <group ref={ref} position={[0, 0.84, 0]}>
      <FanUnit xPos={-0.88} />
      <FanUnit xPos={ 0.88} />
    </group>
  )
}

// ── Scene ────────────────────────────────────────────────────────────────────
function GPUScene({ exploded }: { exploded: boolean }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current && !exploded) {
      groupRef.current.rotation.y += 0.004
    }
  })

  return (
    <group ref={groupRef}>
      <Backplate      exploded={exploded} />
      <PCB            exploded={exploded} />
      <PowerConnector exploded={exploded} />
      <VRMAssembly    exploded={exploded} />
      <GH100Die       exploded={exploded} />
      <HBM3Stacks     exploded={exploded} />
      <TIM            exploded={exploded} />
      <NVLinkFabric   exploded={exploded} />
      <VaporChamber   exploded={exploded} />
      <HeatsinkFins   exploded={exploded} />
      <FanShroud      exploded={exploded} />
      <DualFans       exploded={exploded} />
    </group>
  )
}

export default function GPUVisual() {
  const [exploded, setExploded] = useState(false)

  return (
    <div className="w-full h-full min-h-[180px] flex flex-col items-center gap-2.5" data-hover>
      <div className="relative w-full flex-1 min-h-0" style={{ cursor: 'grab' }}>
        <Canvas
          camera={{ position: [0, 1.9, 5.7], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          shadows
          frameloop="always"
        >
          <ambientLight intensity={0.35} />
          <hemisphereLight args={['#aac4ff', '#0a1628', 0.4]} />
          <directionalLight position={[4, 8, 5]} intensity={1.4} castShadow
            shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <pointLight position={[-3, 3, -2]} intensity={0.8} color="#76b900" />
          <pointLight position={[3, -1, 3]} intensity={0.4} color="#4a4a4a" />
          <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#2563eb" />

          <GPUScene exploded={exploded} />

          {/* Single turntable rotation lives on the model group (GPUScene) so
              every component turns together at one shared speed. OrbitControls
              handles manual drag only — no autoRotate to avoid a second,
              compounding rotation. */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.55}
            target={[0, 0.35, 0]}
            minPolarAngle={Math.PI * 0.2}
            maxPolarAngle={Math.PI * 0.8}
          />
        </Canvas>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); setExploded(v => !v) }}
        style={{ pointerEvents: 'auto' }}
        className="font-mono text-[11px] tracking-widest uppercase px-5 py-2 rounded-full border border-[#0a1628]/12 text-[#0a1628]/45 hover:border-[#0a1628]/25 hover:text-[#0a1628]/65 transition-all duration-200"
      >
        {exploded ? '↙ Collapse' : '↗ Explode View'}
      </button>
    </div>
  )
}
