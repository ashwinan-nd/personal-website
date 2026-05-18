'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Quote { symbol: string; price: number; changePercent: number }
interface SP500Data { timestamps: number[]; closes: number[]; currentPrice: number }

const CAGR = 0.10
const PROJ_YEARS = 5

const GLASS: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,247,251,0.82) 100%)',
  backdropFilter: 'blur(16px) saturate(160%)',
  WebkitBackdropFilter: 'blur(16px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.95)',
  boxShadow: [
    '0 4px 18px rgba(10,22,40,0.09)',
    '0 1px 4px rgba(10,22,40,0.07)',
    'inset 0 1px 0 rgba(255,255,255,1)',
    'inset 0 -1px 0 rgba(10,22,40,0.035)',
  ].join(','),
}

export default function FinanceVisual() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [chartData, setChartData] = useState<SP500Data | null>(null)
  const [lineProgress, setLineProgress] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Ticker strip — Finnhub quotes for 50 stocks
  useEffect(() => {
    const load = () =>
      fetch('/api/stocks').then(r => r.json()).then((d: Quote[]) => setQuotes(d)).catch(() => {})
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  // S&P 500 chart — working Yahoo Finance proxy
  const loadChart = useCallback(() => {
    fetch('/api/sp500')
      .then(r => r.json())
      .then((d: SP500Data) => {
        setChartData(d)
        setLastUpdated(new Date())
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
    loadChart()
    const id = setInterval(loadChart, 60_000)
    return () => clearInterval(id)
  }, [loadChart])

  return (
    <div className="w-full flex flex-col gap-3" style={{ height: 290 }}>
      {/* Scrolling ticker — purely decorative, no clicks */}
      <TickerStrip quotes={quotes} />

      {/* S&P 500 chart */}
      <div className="flex-1">
        {chartData ? (
          <SP500Chart data={chartData} lineProgress={lineProgress} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-[#1b3a6b]/30 border-t-[#1b3a6b] animate-spin" />
          </div>
        )}
      </div>

      {lastUpdated && (
        <p className="font-mono text-[9px] text-[#0a1628]/25 tracking-wide shrink-0">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <style>{`
        @keyframes fin-ticker {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
      `}</style>
    </div>
  )
}

function TickerStrip({ quotes }: { quotes: Quote[] }) {
  // Use fallback symbols if data not yet loaded, so strip animates immediately
  const chips = quotes.length > 0
    ? [...quotes, ...quotes]  // doubled for seamless loop
    : []

  if (chips.length === 0) {
    return <div className="h-8 rounded-full bg-[#f5f7fb]/60 animate-pulse shrink-0" />
  }

  return (
    <div
      className="relative overflow-hidden shrink-0"
      style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)',
        maskImage:        'linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 7,
          width: 'max-content',
          padding: '2px 0',
          animation: 'fin-ticker 58s linear infinite',
        }}
      >
        {chips.map((q, i) => {
          const pos = q.changePercent >= 0
          return (
            <div
              key={`${q.symbol}-${i}`}
              style={{
                ...GLASS,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 11px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(10,22,40,0.78)',
                flexShrink: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.04em' }}>
                {q.symbol}
              </span>
              {q.changePercent !== 0 && (
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: pos ? '#16a34a' : '#dc2626' }}>
                  {pos ? '+' : ''}{q.changePercent.toFixed(2)}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SP500Chart({ data, lineProgress }: { data: SP500Data; lineProgress: number }) {
  const { closes, currentPrice } = data
  if (closes.length < 2) return null

  const W = 480, H = 190
  const PAD = { t: 14, r: 22, b: 28, l: 48 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const projEnd = currentPrice * Math.pow(1 + CAGR, PROJ_YEARS)
  const minP = Math.min(...closes) * 0.96
  const maxP = projEnd * 1.04

  const HIST_FRAC = 0.44
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
  const changePct = closes.length > 1 ? ((currentPrice / closes[0] - 1) * 100).toFixed(1) : '0.0'
  const changePos = parseFloat(changePct) >= 0

  const yLabels = [0, 1, 2, 3].map(i => ({
    price: minP + (maxP - minP) * (i / 3),
    y: toY(minP + (maxP - minP) * (i / 3)),
  }))

  const fmt = (p: number) => p >= 1000 ? `${(p / 1000).toFixed(1)}k` : String(Math.round(p))

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[#0a1628] text-lg">
            {currentPrice > 0
              ? currentPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
              : '—'}
          </span>
          <span className="font-mono text-[11px] font-medium" style={{ color: changePos ? '#16a34a' : '#dc2626' }}>
            {changePos ? '+' : ''}{changePct}% YTD
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="font-mono text-[9px] text-[#0a1628]/35 tracking-widest uppercase">S&amp;P 500 · Live</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" style={{ overflow: 'visible' }}>
        {yLabels.map(({ price, y }, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y} stroke="rgba(10,22,40,0.05)" strokeWidth="0.6" />
            <text x={PAD.l - 5} y={y + 3.5} textAnchor="end" fontSize="7.5" fill="rgba(10,22,40,0.28)" fontFamily="monospace">
              {fmt(price)}
            </text>
          </g>
        ))}

        <line x1={projX0} y1={PAD.t} x2={projX0} y2={PAD.t + cH}
          stroke="rgba(10,22,40,0.10)" strokeWidth="0.7" strokeDasharray="3 3" />

        <path
          d={histPath}
          fill="none" stroke="#0a1628" strokeWidth="2.1"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={2000}
          strokeDashoffset={2000 * (1 - lineProgress)}
        />

        {lineProgress > 0.95 && <circle cx={projX0} cy={projY0} r="3.8" fill="#0a1628" />}

        {lineProgress > 0.97 && (
          <motion.line
            x1={projX0} y1={projY0} x2={projX1} y2={projY1}
            stroke="#1b3a6b" strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        )}

        {lineProgress > 0.97 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
            <text x={projX1 + 4} y={projY1 - 5} fontSize="7.5" fill="rgba(27,58,107,0.65)" fontFamily="monospace">
              {(projEnd / 1000).toFixed(1)}k
            </text>
            <text x={projX1 + 4} y={projY1 + 6} fontSize="7" fill="rgba(27,58,107,0.45)" fontFamily="monospace">
              +{Math.round((projEnd / currentPrice - 1) * 100)}%
            </text>
          </motion.g>
        )}

        {[
          { label: String(nowYear - 1), x: PAD.l },
          { label: 'Now', x: projX0 },
          { label: `${nowYear + PROJ_YEARS}`, x: projX1 },
        ].map(({ label, x }) => (
          <text key={label} x={x} y={H - 2} textAnchor="middle" fontSize="7.5" fill="rgba(10,22,40,0.28)" fontFamily="monospace">
            {label}
          </text>
        ))}

        {lineProgress > 0.97 && (
          <text x={(projX0 + projX1) / 2} y={PAD.t + 5} textAnchor="middle" fontSize="6.5" fill="rgba(27,58,107,0.28)" fontFamily="monospace">
            {PROJ_YEARS}-YR PROJECTION · {CAGR * 100}% CAGR
          </text>
        )}
      </svg>
    </div>
  )
}
