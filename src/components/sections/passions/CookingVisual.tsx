'use client'

import { useReducedMotion } from 'framer-motion'

/**
 * Detailed frying-pan animation: a riveted metal pan tosses a browned pancake
 * in a continuous loop over a layered gas flame (blue base + flickering orange
 * tongues), with diced ingredients dropping in, an oil sheen, and rising steam.
 * Pure SVG + CSS keyframes so it stays cheap and 60fps.
 *
 * Cycle (2.8s): pan jerks up → food launches + full 360 flip → lands → rest.
 */
export default function CookingVisual() {
  const reduce = useReducedMotion()
  const anim = (name: string, dur: string, extra = '') =>
    reduce ? undefined : `${name} ${dur} ${extra} infinite`

  return (
    <div className="w-full h-full flex items-center justify-center select-none" data-hover>
      <svg viewBox="0 0 340 250" className="w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="ckPanBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa0a8" />
            <stop offset="40%" stopColor="#565c66" />
            <stop offset="100%" stopColor="#2c3037" />
          </linearGradient>
          <radialGradient id="ckPanInner" cx="50%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#565b63" />
            <stop offset="55%" stopColor="#33373d" />
            <stop offset="100%" stopColor="#212429" />
          </radialGradient>
          <linearGradient id="ckRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b9bec5" />
            <stop offset="48%" stopColor="#e6e9ed" />
            <stop offset="100%" stopColor="#7c828b" />
          </linearGradient>
          <linearGradient id="ckHandle" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b3f47" />
            <stop offset="55%" stopColor="#23262c" />
            <stop offset="100%" stopColor="#14161a" />
          </linearGradient>
          <radialGradient id="ckPancake" cx="42%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#f0c98a" />
            <stop offset="55%" stopColor="#d29a54" />
            <stop offset="100%" stopColor="#9c6a2e" />
          </radialGradient>
          <radialGradient id="ckFlameO" cx="50%" cy="82%" r="72%">
            <stop offset="0%" stopColor="#ffe27a" />
            <stop offset="45%" stopColor="#ff9d2e" />
            <stop offset="100%" stopColor="#f6551d" />
          </radialGradient>
          <radialGradient id="ckFlameB" cx="50%" cy="90%" r="60%">
            <stop offset="0%" stopColor="#bfe3ff" />
            <stop offset="60%" stopColor="#5aa9ff" />
            <stop offset="100%" stopColor="#2f6fd6" />
          </radialGradient>
          <radialGradient id="ckOil" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* ── Burner grate ─────────────────────────────────────────── */}
        <g stroke="#1c1f24" strokeWidth="3" strokeLinecap="round" opacity="0.9">
          <line x1="112" y1="212" x2="228" y2="212" />
          <line x1="150" y1="206" x2="150" y2="222" />
          <line x1="190" y1="206" x2="190" y2="222" />
        </g>

        {/* ── Gas flame (blue base + flickering orange tongues) ────── */}
        <g style={{ transformOrigin: '170px 196px', animation: anim('ck-flame', '0.4s', 'ease-in-out') }}>
          {[150, 162, 170, 178, 190].map((x, i) => (
            <path
              key={i}
              d={`M${x} 200 C${x - 7} 188 ${x - 4} 172 ${x} 160 C${x + 4} 172 ${x + 7} 188 ${x} 200 Z`}
              fill="url(#ckFlameO)"
              opacity={0.9}
              style={{ transformOrigin: `${x}px 196px`, animation: anim(`ck-lick${i % 3}`, `${0.34 + (i % 3) * 0.06}s`, 'ease-in-out') }}
            />
          ))}
          {[156, 170, 184].map((x, i) => (
            <path key={`b${i}`} d={`M${x} 200 C${x - 4} 192 ${x - 2} 184 ${x} 178 C${x + 2} 184 ${x + 4} 192 ${x} 200 Z`} fill="url(#ckFlameB)" opacity="0.95" />
          ))}
        </g>

        {/* ── Steam ────────────────────────────────────────────────── */}
        {[150, 170, 190].map((x, i) => (
          <path key={`s${i}`} d={`M${x} 150 q-6 -10 0 -20 q6 -10 0 -20`} fill="none" stroke="#cfd6df" strokeWidth="2.4" strokeLinecap="round"
            opacity="0" style={{ transformOrigin: `${x}px 130px`, animation: anim(`ck-steam${i % 2}`, '2.8s', 'ease-out') }} />
        ))}

        {/* ── Ingredients dropping in ──────────────────────────────── */}
        <g>
          <circle cx="170" cy="-4" r="5.5" fill="#c0392b" style={{ transformOrigin: '170px 0', animation: anim('ck-drop1', '2.8s', 'ease-in') }} />
          <rect x="184" y="-6" width="10" height="10" rx="2.5" fill="#4e8a3f" style={{ transformOrigin: '189px 0', animation: anim('ck-drop2', '2.8s', 'ease-in') }} />
          <circle cx="154" cy="-4" r="4.5" fill="#e6b23a" style={{ transformOrigin: '154px 0', animation: anim('ck-drop3', '2.8s', 'ease-in') }} />
        </g>

        {/* ── Food (pancake + toppings) — launches and flips ───────── */}
        <g style={{ transformOrigin: '170px 168px', animation: anim('ck-toss', '2.8s', 'cubic-bezier(0.4,0,0.2,1)') }}>
          <g style={{ transformOrigin: '170px 168px', animation: anim('ck-flip', '2.8s', 'linear') }}>
            <ellipse cx="170" cy="168" rx="46" ry="15" fill="url(#ckPancake)" />
            <ellipse cx="170" cy="164" rx="46" ry="13.5" fill="#e3ad64" />
            {/* browning spots */}
            <circle cx="156" cy="162" r="3.2" fill="#9c6a2e" opacity="0.6" />
            <circle cx="182" cy="166" r="2.6" fill="#9c6a2e" opacity="0.55" />
            <circle cx="170" cy="160" r="2.2" fill="#8a5a24" opacity="0.5" />
            {/* toppings */}
            <circle cx="162" cy="160" r="3" fill="#c0392b" />
            <rect x="176" y="158" width="7" height="7" rx="1.6" fill="#4e8a3f" />
            <circle cx="172" cy="166" r="2.4" fill="#e6b23a" />
          </g>
        </g>

        {/* ── Pan (jerks up during toss) ───────────────────────────── */}
        <g style={{ transformOrigin: '170px 182px', animation: anim('ck-pan', '2.8s', 'cubic-bezier(0.4,0,0.2,1)') }}>
          {/* Handle with grip rivets */}
          <g transform="rotate(-9 216 184)">
            <rect x="216" y="176" width="120" height="16" rx="8" fill="url(#ckHandle)" />
            <circle cx="244" cy="184" r="2.2" fill="#0c0d10" />
            <circle cx="266" cy="184" r="2.2" fill="#0c0d10" />
            <circle cx="332" cy="171" r="4.5" fill="#0c0d10" />
          </g>
          {/* Pan body */}
          <ellipse cx="170" cy="185" rx="82" ry="28" fill="url(#ckPanBody)" />
          {/* Inner well */}
          <ellipse cx="170" cy="180" rx="75" ry="22" fill="url(#ckPanInner)" />
          {/* Oil sheen */}
          <ellipse cx="158" cy="176" rx="26" ry="7" fill="url(#ckOil)" />
          {/* Rim */}
          <ellipse cx="170" cy="179" rx="75" ry="22" fill="none" stroke="url(#ckRim)" strokeWidth="3.6" />
          {/* Rim rivets where handle meets body */}
          <circle cx="238" cy="180" r="2.4" fill="#8b9099" />
          <circle cx="238" cy="187" r="2.4" fill="#8b9099" />
        </g>

        <style>{`
          @keyframes ck-flame { 0%,100%{transform:scaleY(1) scaleX(1);opacity:.95} 50%{transform:scaleY(1.14) scaleX(.95);opacity:1} }
          @keyframes ck-lick0 { 0%,100%{transform:scaleY(1) translateX(0)} 50%{transform:scaleY(1.24) translateX(-1px)} }
          @keyframes ck-lick1 { 0%,100%{transform:scaleY(1.1)} 50%{transform:scaleY(.9)} }
          @keyframes ck-lick2 { 0%,100%{transform:scaleY(.95) translateX(0)} 50%{transform:scaleY(1.2) translateX(1px)} }
          @keyframes ck-steam0 { 0%,55%{opacity:0;transform:translateY(0)} 70%{opacity:.5} 100%{opacity:0;transform:translateY(-34px)} }
          @keyframes ck-steam1 { 0%,60%{opacity:0;transform:translateY(0)} 74%{opacity:.45} 100%{opacity:0;transform:translateY(-38px)} }
          @keyframes ck-toss { 0%{transform:translateY(0)} 18%{transform:translateY(-8px)} 40%{transform:translateY(-98px)} 60%{transform:translateY(-98px)} 82%{transform:translateY(-4px)} 100%{transform:translateY(0)} }
          @keyframes ck-flip { 0%,16%{transform:rotateX(0)} 40%{transform:rotateX(180deg)} 60%{transform:rotateX(200deg)} 84%,100%{transform:rotateX(360deg)} }
          @keyframes ck-pan { 0%,10%{transform:translateY(0) rotate(0)} 16%{transform:translateY(-11px) rotate(-4deg)} 26%{transform:translateY(0) rotate(1deg)} 100%{transform:translateY(0) rotate(0)} }
          @keyframes ck-drop1 { 0%,70%{transform:translateY(0);opacity:0} 73%{opacity:1} 88%,100%{transform:translateY(168px);opacity:0} }
          @keyframes ck-drop2 { 0%,60%{transform:translateY(0) rotate(0);opacity:0} 63%{opacity:1} 80%,100%{transform:translateY(170px) rotate(180deg);opacity:0} }
          @keyframes ck-drop3 { 0%,66%{transform:translateY(0);opacity:0} 69%{opacity:1} 84%,100%{transform:translateY(168px);opacity:0} }
        `}</style>
      </svg>
    </div>
  )
}
