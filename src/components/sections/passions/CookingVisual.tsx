'use client'

import { useReducedMotion } from 'framer-motion'

/**
 * Gray frying pan flipping a pancake in a continuous loop, with ingredients
 * dropping in over the cycle and a flickering flame beneath. Pure SVG + CSS
 * keyframes so it stays cheap (no canvas/WebGL) and runs at 60fps.
 *
 * One cycle (2.6s): pan jerks up → food launches, does a full 360 flip →
 * lands back in the pan → brief rest → repeat. Flame flickers continuously.
 */
export default function CookingVisual() {
  const reduce = useReducedMotion()
  const anim = (name: string, dur: string, extra = '') =>
    reduce ? undefined : `${name} ${dur} ${extra} infinite`

  return (
    <div className="w-full h-full flex items-center justify-center select-none" data-hover>
      <svg viewBox="0 0 320 240" className="w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="panBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b9099" />
            <stop offset="45%" stopColor="#5c626c" />
            <stop offset="100%" stopColor="#3a3f47" />
          </linearGradient>
          <linearGradient id="panRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9aa0a8" />
            <stop offset="50%" stopColor="#c2c7cd" />
            <stop offset="100%" stopColor="#7c828b" />
          </linearGradient>
          <radialGradient id="panInner" cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#4a4f57" />
            <stop offset="100%" stopColor="#2b2f36" />
          </radialGradient>
          <linearGradient id="handle" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4a4f57" />
            <stop offset="100%" stopColor="#23262c" />
          </linearGradient>
          <radialGradient id="flameOuter" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#ffd24a" />
            <stop offset="45%" stopColor="#ff9d2e" />
            <stop offset="100%" stopColor="#ff5a1f" />
          </radialGradient>
          <radialGradient id="flameInner" cx="50%" cy="82%" r="70%">
            <stop offset="0%" stopColor="#fff4c2" />
            <stop offset="70%" stopColor="#ffcf4d" />
            <stop offset="100%" stopColor="#ff9b2e" />
          </radialGradient>
          <radialGradient id="pancake" cx="42%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#e8b774" />
            <stop offset="60%" stopColor="#cf9550" />
            <stop offset="100%" stopColor="#a5702f" />
          </radialGradient>
        </defs>

        {/* ── Flame (beneath pan) ─────────────────────────────────────── */}
        <g style={{ transformOrigin: '150px 186px', animation: anim('ck-flame', '0.42s', 'ease-in-out') }}>
          <path
            d="M150 200 C126 184 128 160 143 146 C140 162 152 166 152 154 C158 162 168 150 165 140 C182 154 176 186 150 200 Z"
            fill="url(#flameOuter)" opacity="0.92"
          />
          <path
            d="M150 198 C136 188 137 170 147 159 C146 170 155 172 155 163 C161 172 164 178 160 186 C158 193 154 196 150 198 Z"
            fill="url(#flameInner)"
          />
          {/* side licks */}
          <path d="M128 196 C118 186 122 172 130 165 C128 178 135 180 135 172 C140 182 136 192 128 196 Z"
            fill="url(#flameOuter)" opacity="0.7"
            style={{ transformOrigin: '130px 190px', animation: anim('ck-flame2', '0.5s', 'ease-in-out') }} />
          <path d="M172 196 C164 190 168 174 174 166 C173 178 180 180 180 172 C185 182 180 192 172 196 Z"
            fill="url(#flameOuter)" opacity="0.7"
            style={{ transformOrigin: '174px 190px', animation: anim('ck-flame3', '0.46s', 'ease-in-out') }} />
        </g>

        {/* ── Ingredients dropping in ─────────────────────────────────── */}
        <g>
          <circle cx="150" cy="0" r="5" fill="#c0392b"
            style={{ transformOrigin: '150px 0', animation: anim('ck-drop1', '2.6s', 'ease-in') }} />
          <rect x="164" y="0" width="9" height="9" rx="2" fill="#4e8a3f"
            style={{ transformOrigin: '168px 0', animation: anim('ck-drop2', '2.6s', 'ease-in') }} />
          <circle cx="134" cy="0" r="4" fill="#e0a92e"
            style={{ transformOrigin: '134px 0', animation: anim('ck-drop3', '2.6s', 'ease-in') }} />
        </g>

        {/* ── Food (pancake) — launches and flips ─────────────────────── */}
        <g style={{ transformOrigin: '150px 150px', animation: anim('ck-toss', '2.6s', 'cubic-bezier(0.4,0,0.2,1)') }}>
          <g style={{ transformOrigin: '150px 150px', animation: anim('ck-flip', '2.6s', 'linear') }}>
            <ellipse cx="150" cy="150" rx="42" ry="13" fill="url(#pancake)" />
            <ellipse cx="150" cy="147" rx="42" ry="12" fill="#dfa762" />
            <circle cx="138" cy="145" r="3" fill="#8a5a24" opacity="0.7" />
            <circle cx="160" cy="149" r="2.4" fill="#8a5a24" opacity="0.6" />
            <circle cx="150" cy="143" r="2" fill="#8a5a24" opacity="0.5" />
          </g>
        </g>

        {/* ── Pan (jerks up during toss) ──────────────────────────────── */}
        <g style={{ transformOrigin: '150px 165px', animation: anim('ck-pan', '2.6s', 'cubic-bezier(0.4,0,0.2,1)') }}>
          {/* Handle */}
          <rect x="196" y="158" width="118" height="15" rx="7.5" fill="url(#handle)"
            transform="rotate(-9 196 165)" />
          <circle cx="300" cy="150" r="4" fill="#15171b" transform="rotate(-9 196 165)" />
          {/* Pan body */}
          <ellipse cx="150" cy="168" rx="78" ry="26" fill="url(#panBody)" />
          {/* Inner well */}
          <ellipse cx="150" cy="163" rx="72" ry="21" fill="url(#panInner)" />
          {/* Rim highlight */}
          <ellipse cx="150" cy="162" rx="72" ry="21" fill="none" stroke="url(#panRim)" strokeWidth="3.4" />
        </g>

        <style>{`
          @keyframes ck-flame {
            0%,100% { transform: scaleY(1) scaleX(1); opacity: 0.95; }
            50%     { transform: scaleY(1.16) scaleX(0.94); opacity: 1; }
          }
          @keyframes ck-flame2 {
            0%,100% { transform: scaleY(1) translateX(0); }
            50%     { transform: scaleY(1.22) translateX(-1px); }
          }
          @keyframes ck-flame3 {
            0%,100% { transform: scaleY(1.1) translateX(0); }
            50%     { transform: scaleY(0.92) translateX(1px); }
          }
          /* Pancake vertical launch (parabola via translateY keyframes) */
          @keyframes ck-toss {
            0%   { transform: translateY(0); }
            18%  { transform: translateY(-8px); }
            40%  { transform: translateY(-92px); }
            60%  { transform: translateY(-92px); }
            82%  { transform: translateY(-4px); }
            100% { transform: translateY(0); }
          }
          /* Full 360 flip while airborne */
          @keyframes ck-flip {
            0%,16%   { transform: rotateX(0deg); }
            40%      { transform: rotateX(180deg); }
            60%      { transform: rotateX(200deg); }
            84%,100% { transform: rotateX(360deg); }
          }
          /* Pan jerk that drives the toss */
          @keyframes ck-pan {
            0%,10% { transform: translateY(0) rotate(0deg); }
            16%    { transform: translateY(-10px) rotate(-4deg); }
            26%    { transform: translateY(0) rotate(1deg); }
            100%   { transform: translateY(0) rotate(0deg); }
          }
          @keyframes ck-drop1 {
            0%,72%  { transform: translateY(0); opacity: 0; }
            74%     { opacity: 1; }
            88%,100%{ transform: translateY(150px); opacity: 0; }
          }
          @keyframes ck-drop2 {
            0%,60%  { transform: translateY(0) rotate(0deg); opacity: 0; }
            62%     { opacity: 1; }
            80%,100%{ transform: translateY(152px) rotate(180deg); opacity: 0; }
          }
          @keyframes ck-drop3 {
            0%,66%  { transform: translateY(0); opacity: 0; }
            68%     { opacity: 1; }
            84%,100%{ transform: translateY(150px); opacity: 0; }
          }
        `}</style>
      </svg>
    </div>
  )
}
