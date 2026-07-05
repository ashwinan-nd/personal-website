'use client'

import { useReducedMotion } from 'framer-motion'

/**
 * Realistic skillet-over-gas-flame stir-fry.
 *
 * Built to match a real cooking reference: a black cast-iron skillet seen in
 * slight perspective (elliptical rim + visible side wall + riveted handle) over
 * a layered gas flame (dark-blue inner cones, lighter-blue outer, orange tips),
 * holding a colourful sizzle of diced vegetables and a browned protein with an
 * oil sheen, and steam rising off the top. Pure SVG + CSS keyframes for 60fps.
 */
export default function CookingVisual() {
  const reduce = useReducedMotion()
  const anim = (name: string, dur: string, extra = '') =>
    reduce ? undefined : `${name} ${dur} ${extra} infinite`

  // Diced ingredients scattered in the pan (x, y, r, color, sizzle phase index)
  const food: [number, number, number, string, number][] = [
    [150, 176, 7.5, '#d13b2f', 0], // red pepper
    [172, 181, 6.5, '#5a9e3f', 1], // green pepper
    [192, 176, 7, '#e8a92e', 2],   // yellow pepper
    [161, 187, 6, '#e37b2a', 0],   // carrot
    [182, 189, 5.5, '#efe4cf', 1], // onion
    [140, 186, 6, '#e8a92e', 2],   // yellow pepper
    [203, 186, 5.5, '#5a9e3f', 1], // green pepper
    [130, 178, 5, '#d13b2f', 2],   // red pepper
  ]

  return (
    <div className="w-full h-full flex items-center justify-center select-none" data-hover>
      <svg viewBox="0 0 340 250" className="w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          {/* Pan */}
          <radialGradient id="ckPanInner" cx="46%" cy="34%" r="74%">
            <stop offset="0%" stopColor="#3c3f45" />
            <stop offset="55%" stopColor="#25282d" />
            <stop offset="100%" stopColor="#141619" />
          </radialGradient>
          <linearGradient id="ckPanWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2d32" />
            <stop offset="100%" stopColor="#0c0d10" />
          </linearGradient>
          <linearGradient id="ckRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4a4e55" />
            <stop offset="45%" stopColor="#9aa0a8" />
            <stop offset="100%" stopColor="#33363b" />
          </linearGradient>
          <linearGradient id="ckHandle" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2b2e34" />
            <stop offset="55%" stopColor="#161819" />
            <stop offset="100%" stopColor="#0a0b0d" />
          </linearGradient>
          <radialGradient id="ckOil" cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor="rgba(255,240,200,0.45)" />
            <stop offset="100%" stopColor="rgba(255,240,200,0)" />
          </radialGradient>
          {/* Flame */}
          <radialGradient id="ckFlameB" cx="50%" cy="88%" r="62%">
            <stop offset="0%" stopColor="#cfe8ff" />
            <stop offset="55%" stopColor="#4aa0ff" />
            <stop offset="100%" stopColor="#2456c8" />
          </radialGradient>
          <radialGradient id="ckFlameO" cx="50%" cy="78%" r="70%">
            <stop offset="0%" stopColor="#ffe487" />
            <stop offset="50%" stopColor="#ff9d2e" />
            <stop offset="100%" stopColor="#f0531b" />
          </radialGradient>
          <radialGradient id="ckFoodHi" cx="38%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* ── Burner grate ─────────────────────────────────────────── */}
        <g stroke="#1a1d22" strokeWidth="3.4" strokeLinecap="round" opacity="0.85">
          <line x1="118" y1="214" x2="222" y2="214" />
          <line x1="150" y1="207" x2="150" y2="223" />
          <line x1="190" y1="207" x2="190" y2="223" />
        </g>

        {/* ── Gas flame ring: row of blue cones with orange tips ────── */}
        <g style={{ transformOrigin: '170px 200px', animation: anim('ck-flame', '0.5s', 'ease-in-out') }}>
          {[130, 143, 156, 170, 184, 197, 210].map((x, i) => {
            const h = 30 + (i % 3) * 9
            const base = 202
            return (
              <g key={i} style={{ transformOrigin: `${x}px ${base}px`, animation: anim(`ck-lick${i % 3}`, `${0.34 + (i % 3) * 0.07}s`, 'ease-in-out') }}>
                <path d={`M${x} ${base - h - 9} C${x - 5} ${base - h + 4} ${x - 3} ${base - h + 2} ${x} ${base - h + 11} C${x + 3} ${base - h + 2} ${x + 5} ${base - h + 4} ${x} ${base - h - 9} Z`} fill="url(#ckFlameO)" opacity="0.92" />
                <path d={`M${x} ${base} C${x - 9} ${base - 13} ${x - 5} ${base - h + 6} ${x} ${base - h} C${x + 5} ${base - h + 6} ${x + 9} ${base - 13} ${x} ${base} Z`} fill="url(#ckFlameB)" opacity="0.9" />
                <path d={`M${x} ${base} C${x - 3.5} ${base - 6} ${x - 2} ${base - h * 0.6} ${x} ${base - h * 0.62} C${x + 2} ${base - h * 0.6} ${x + 3.5} ${base - 6} ${x} ${base} Z`} fill="#173e9e" opacity="0.95" />
              </g>
            )
          })}
        </g>

        {/* ── Steam ────────────────────────────────────────────────── */}
        {[148, 170, 192].map((x, i) => (
          <path key={`s${i}`} d={`M${x} 150 q-7 -11 0 -22 q7 -11 0 -22`} fill="none" stroke="#d7dde5" strokeWidth="2.6" strokeLinecap="round"
            opacity="0" style={{ transformOrigin: `${x}px 130px`, animation: anim(`ck-steam${i % 2}`, '3s', 'ease-out') }} />
        ))}

        {/* ── Skillet (drawn as a group so it can gently shake) ─────── */}
        <g style={{ transformOrigin: '170px 180px', animation: anim('ck-pan', '3s', 'cubic-bezier(0.4,0,0.2,1)') }}>
          {/* Handle */}
          <g transform="rotate(-8 214 182)">
            <rect x="214" y="175" width="118" height="15" rx="7.5" fill="url(#ckHandle)" />
            <rect x="214" y="175" width="118" height="4" rx="2" fill="#3a3e44" opacity="0.7" />
            <circle cx="246" cy="182.5" r="2" fill="#050506" />
            <circle cx="268" cy="182.5" r="2" fill="#050506" />
            <circle cx="326" cy="169" r="4" fill="#050506" />
          </g>
          {/* Side wall (gives depth) */}
          <path d="M92 176 A78 26 0 0 0 248 176 L246 190 A76 22 0 0 1 94 190 Z" fill="url(#ckPanWall)" />
          {/* Inner well */}
          <ellipse cx="170" cy="176" rx="78" ry="26" fill="url(#ckPanInner)" />
          {/* Oil sheen */}
          <ellipse cx="150" cy="170" rx="34" ry="10" fill="url(#ckOil)" />
          {/* Outer rim highlight */}
          <ellipse cx="170" cy="176" rx="78" ry="26" fill="none" stroke="url(#ckRim)" strokeWidth="3.4" />

          {/* Food — sizzling diced ingredients */}
          {food.map(([x, y, r, color, ph], i) => (
            <g key={i} style={{ transformOrigin: `${x}px ${y}px`, animation: anim(`ck-sizzle${ph}`, `${0.5 + ph * 0.12}s`, 'ease-in-out') }}>
              <ellipse cx={x} cy={y + r * 0.7} rx={r * 1.05} ry={r * 0.5} fill="#000" opacity="0.28" />
              <circle cx={x} cy={y} r={r} fill={color} />
              <circle cx={x} cy={y} r={r} fill="url(#ckFoodHi)" />
              {/* char fleck */}
              <circle cx={x - r * 0.3} cy={y + r * 0.35} r={r * 0.22} fill="#3a2411" opacity="0.4" />
            </g>
          ))}
          {/* Browned protein cube, centre */}
          <g style={{ transformOrigin: '170px 178px', animation: anim('ck-sizzle1', '0.62s', 'ease-in-out') }}>
            <ellipse cx="170" cy="184" rx="13" ry="5.5" fill="#000" opacity="0.3" />
            <rect x="159" y="169" width="22" height="15" rx="4" fill="#9c5a2c" />
            <rect x="159" y="169" width="22" height="6" rx="3" fill="#b8794a" />
            <rect x="159" y="169" width="22" height="15" rx="4" fill="url(#ckFoodHi)" />
            <path d="M162 176 h16 M162 180 h16" stroke="#5e3316" strokeWidth="1.4" opacity="0.6" />
          </g>
        </g>

        <style>{`
          @keyframes ck-flame { 0%,100%{transform:scaleY(1) scaleX(1);opacity:.95} 50%{transform:scaleY(1.16) scaleX(.94);opacity:1} }
          @keyframes ck-lick0 { 0%,100%{transform:scaleY(1) translateX(0)} 50%{transform:scaleY(1.26) translateX(-1px)} }
          @keyframes ck-lick1 { 0%,100%{transform:scaleY(1.12)} 50%{transform:scaleY(.88)} }
          @keyframes ck-lick2 { 0%,100%{transform:scaleY(.94) translateX(0)} 50%{transform:scaleY(1.22) translateX(1px)} }
          @keyframes ck-steam0 { 0%,45%{opacity:0;transform:translateY(0)} 62%{opacity:.5} 100%{opacity:0;transform:translateY(-34px)} }
          @keyframes ck-steam1 { 0%,55%{opacity:0;transform:translateY(0)} 70%{opacity:.45} 100%{opacity:0;transform:translateY(-40px)} }
          @keyframes ck-sizzle0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
          @keyframes ck-sizzle1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.6px)} }
          @keyframes ck-sizzle2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
          @keyframes ck-pan { 0%,92%,100%{transform:translateY(0) rotate(0)} 96%{transform:translateY(-2px) rotate(-0.6deg)} }
        `}</style>
      </svg>
    </div>
  )
}
