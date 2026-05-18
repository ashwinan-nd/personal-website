'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface ChartData {
  timestamps: number[]
  closes: number[]
  currentPrice: number
}

const CAGR = 0.10
const PROJ_YEARS = 5

function project(base: number, years: number) {
  return base * Math.pow(1 + CAGR, years)
}

function formatPrice(p: number) {
  return p.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function SP500Chart() {
  const [data, setData] = useState<ChartData | null>(null)
  const [lineProgress, setLineProgress] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(() => {
    fetch('/api/sp500')
      .then((r) => r.json())
      .then((d: ChartData) => {
        setData(d)
        setLastUpdated(new Date())
        // Re-animate line on fresh data
        setLineProgress(0)
        setTimeout(() => {
          const start = Date.now()
          const dur = 1500
          const tick = () => {
            const p = Math.min(1, (Date.now() - start) / dur)
            setLineProgress(p)
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, 80)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchData()
    // Refresh every 60 seconds for live feel
    const id = setInterval(fetchData, 60_000)
    return () => clearInterval(id)
  }, [fetchData])

  if (!data) {
    return (
      <div className="w-full h-52 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#1b3a6b]/30 border-t-[#1b3a6b] animate-spin" />
      </div>
    )
  }

  const { closes, currentPrice } = data

  const W = 480, H = 210
  const PAD = { t: 14, r: 18, b: 32, l: 46 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const projEnd = project(currentPrice, PROJ_YEARS)
  const minP = Math.min(...closes) * 0.96
  const maxP = projEnd * 1.04

  const HIST_FRAC = 0.42

  const toX = (i: number, n: number) => PAD.l + (i / (n - 1)) * cW * HIST_FRAC
  const toY = (p: number) => PAD.t + cH - ((p - minP) / (maxP - minP)) * cH

  const histPath = closes
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${toX(i, closes.length).toFixed(1)},${toY(c).toFixed(1)}`)
    .join(' ')

  const projX0 = PAD.l + cW * HIST_FRAC
  const projX1 = PAD.l + cW
  const projY0 = toY(currentPrice)
  const projY1 = toY(projEnd)

  const nowYear = new Date().getFullYear()
  const yLabels = [0, 1, 2, 3, 4].map((i) => {
    const price = minP + ((maxP - minP) * i) / 4
    return { price: Math.round(price), y: toY(price) }
  })

  const changePct = closes.length > 1
    ? ((currentPrice / closes[0] - 1) * 100).toFixed(1)
    : '0.0'
  const changePos = parseFloat(changePct) >= 0

  return (
    <div className="w-full">
      {/* Live header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-bold text-[#0a1628] text-2xl">{formatPrice(currentPrice)}</span>
          <span
            className="text-[13px] font-medium"
            style={{ color: changePos ? '#16a34a' : '#dc2626' }}
          >
            {changePos ? '+' : ''}{changePct}% YTD
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="font-mono text-[10px] text-[#0a1628]/35 tracking-widest uppercase">Live</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* Grid */}
        {yLabels.map(({ price, y }) => (
          <g key={price}>
            <line x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y} stroke="rgba(10,22,40,0.055)" strokeWidth="0.6" />
            <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="8" fill="rgba(10,22,40,0.33)" fontFamily="monospace">
              {price >= 1000 ? `${(price / 1000).toFixed(1)}k` : price}
            </text>
          </g>
        ))}

        {/* Vertical divider: now */}
        <line x1={projX0} y1={PAD.t} x2={projX0} y2={PAD.t + cH} stroke="rgba(10,22,40,0.1)" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* Historical line */}
        <path
          d={histPath}
          fill="none"
          stroke="#0a1628"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1800}
          strokeDashoffset={1800 * (1 - lineProgress)}
        />

        {/* Dot at current */}
        {lineProgress > 0.95 && (
          <circle cx={projX0} cy={projY0} r="4.5" fill="#0a1628" />
        )}

        {/* Projection line — dashed, appears after history drawn */}
        {lineProgress > 0.97 && (
          <motion.line
            x1={projX0} y1={projY0} x2={projX1} y2={projY1}
            stroke="#1b3a6b"
            strokeWidth="1.8"
            strokeDasharray="5 4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}

        {/* Projection end label */}
        {lineProgress > 0.97 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
            <text x={projX1 + 4} y={projY1 - 6} fontSize="8" fill="rgba(27,58,107,0.65)" fontFamily="monospace">
              {formatPrice(Math.round(projEnd))}
            </text>
            <text x={projX1 + 4} y={projY1 + 6} fontSize="7.5" fill="rgba(27,58,107,0.45)" fontFamily="monospace">
              +{Math.round((project(currentPrice, PROJ_YEARS) / currentPrice - 1) * 100)}%
            </text>
          </motion.g>
        )}

        {/* X labels */}
        {[
          { label: String(nowYear - 1), x: PAD.l },
          { label: 'Now', x: projX0 },
          { label: `${nowYear + PROJ_YEARS}`, x: projX1 },
        ].map(({ label, x }) => (
          <text key={label} x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(10,22,40,0.33)" fontFamily="monospace">
            {label}
          </text>
        ))}

        {/* Projection zone label */}
        {lineProgress > 0.97 && (
          <text x={(projX0 + projX1) / 2} y={PAD.t + 5} textAnchor="middle" fontSize="7" fill="rgba(27,58,107,0.3)" fontFamily="monospace">
            {PROJ_YEARS}-YR PROJECTION · {CAGR * 100}% CAGR
          </text>
        )}
      </svg>

      <p className="font-mono text-[9px] text-[#0a1628]/25 tracking-wide mt-0.5">
        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
      </p>
    </div>
  )
}
