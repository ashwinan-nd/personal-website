'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

const SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'JPM', 'AMD', 'PLTR']

interface Quote {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface CandleData {
  timestamps: number[]
  closes: number[]
}

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

export default function StockTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selected, setSelected] = useState('NVDA')
  const [candles, setCandles] = useState<CandleData | null>(null)
  const [lineProgress, setLineProgress] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const load = () => {
      fetch('/api/stocks')
        .then(r => r.json())
        .then((d: Quote[]) => { setQuotes(d); setLastUpdated(new Date()) })
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setCandles(null)
    setLineProgress(0)
    fetch(`/api/stocks/candles?symbol=${selected}`)
      .then(r => r.json())
      .then((d: CandleData) => {
        setCandles(d)
        setTimeout(() => {
          const start = Date.now()
          const dur = 1400
          const tick = () => {
            const p = Math.min(1, (Date.now() - start) / dur)
            setLineProgress(p)
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, 80)
      })
      .catch(() => {})
  }, [selected])

  const selectedQuote = quotes.find(q => q.symbol === selected) ?? null

  return (
    <div className="w-full flex flex-col gap-3" style={{ height: 290 }}>
      <TickerStrip quotes={quotes} selected={selected} onSelect={setSelected} />

      <div className="flex-1">
        {candles && candles.closes.length > 1 ? (
          <StockChart
            symbol={selected}
            candles={candles}
            quote={selectedQuote}
            lineProgress={lineProgress}
          />
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
        @keyframes ticker-scroll {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
      `}</style>
    </div>
  )
}

function TickerStrip({
  quotes,
  selected,
  onSelect,
}: {
  quotes: Quote[]
  selected: string
  onSelect: (s: string) => void
}) {
  if (quotes.length === 0) {
    return <div className="h-9 rounded-full bg-[#f5f7fb] animate-pulse shrink-0" />
  }

  // Double the list so the CSS animation can loop seamlessly
  const doubled = [...quotes, ...quotes]

  return (
    <div
      className="relative overflow-hidden shrink-0"
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        maskImage:
          'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          width: 'max-content',
          padding: '3px 0',
          animation: 'ticker-scroll 30s linear infinite',
        }}
      >
        {doubled.map((q, i) => (
          <TickerChip
            key={`${q.symbol}-${i}`}
            quote={q}
            isSelected={q.symbol === selected}
            onClick={() => onSelect(q.symbol)}
          />
        ))}
      </div>
    </div>
  )
}

function TickerChip({
  quote,
  isSelected,
  onClick,
}: {
  quote: Quote
  isSelected: boolean
  onClick: () => void
}) {
  const pos = quote.changePercent >= 0
  return (
    <motion.button
      onClick={onClick}
      style={{
        ...GLASS,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 13px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 500,
        color: 'rgba(10,22,40,0.78)',
        flexShrink: 0,
        outline: isSelected ? '2px solid rgba(10,22,40,0.22)' : '2px solid transparent',
        outlineOffset: 1,
        transition: 'outline-color 0.2s',
      }}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20 }}
    >
      <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.04em' }}>
        {quote.symbol}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: pos ? '#16a34a' : '#dc2626',
        }}
      >
        {pos ? '+' : ''}{quote.changePercent.toFixed(2)}%
      </span>
    </motion.button>
  )
}

function StockChart({
  symbol,
  candles,
  quote,
  lineProgress,
}: {
  symbol: string
  candles: CandleData
  quote: Quote | null
  lineProgress: number
}) {
  const { closes } = candles
  if (closes.length < 2) return null

  const W = 480, H = 185
  const PAD = { t: 14, r: 24, b: 28, l: 46 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const currentPrice = quote?.price ?? closes[closes.length - 1]
  const changePercent = quote?.changePercent ?? 0
  const pos = changePercent >= 0

  // 1-yr CAGR clamped to a sane range for 5-yr projection
  const rawCAGR = closes[0] > 0 ? (currentPrice / closes[0]) - 1 : 0.10
  const cagr = Math.max(-0.20, Math.min(0.65, rawCAGR))
  const projEnd = currentPrice * Math.pow(1 + cagr, 5)

  const HIST_FRAC = 0.44
  const minP = Math.min(...closes, projEnd) * 0.95
  const maxP = Math.max(...closes, projEnd) * 1.05

  const toX = (i: number, n: number) => PAD.l + (i / (n - 1)) * cW * HIST_FRAC
  const toY = (p: number) => {
    const range = maxP - minP
    if (range === 0) return PAD.t + cH / 2
    return PAD.t + cH - ((p - minP) / range) * cH
  }

  const histPath = closes
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${toX(i, closes.length).toFixed(1)},${toY(c).toFixed(1)}`)
    .join(' ')

  const projX0 = PAD.l + cW * HIST_FRAC
  const projX1 = PAD.l + cW
  const projY0 = toY(currentPrice)
  const projY1 = toY(projEnd)

  const nowYear = new Date().getFullYear()

  const yLabels = [0, 1, 2, 3].map(i => ({
    price: minP + (maxP - minP) * (i / 3),
    y: toY(minP + (maxP - minP) * (i / 3)),
  }))

  const fmt = (p: number) =>
    p >= 1000 ? `$${(p / 1000).toFixed(1)}k` : `$${Math.round(p)}`

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[#0a1628] text-lg">
            {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : '—'}
          </span>
          <span
            className="font-mono text-[11px] font-medium"
            style={{ color: pos ? '#16a34a' : '#dc2626' }}
          >
            {pos ? '+' : ''}{changePercent.toFixed(2)}% today
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="font-mono text-[9px] text-[#0a1628]/35 tracking-widest uppercase">
            Live · {symbol}
          </span>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" style={{ overflow: 'visible' }}>
        {yLabels.map(({ price, y }, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + cW} y2={y} stroke="rgba(10,22,40,0.05)" strokeWidth="0.6" />
            <text x={PAD.l - 5} y={y + 3.5} textAnchor="end" fontSize="7.5" fill="rgba(10,22,40,0.28)" fontFamily="monospace">
              {fmt(price)}
            </text>
          </g>
        ))}

        {/* Now divider */}
        <line x1={projX0} y1={PAD.t} x2={projX0} y2={PAD.t + cH}
          stroke="rgba(10,22,40,0.10)" strokeWidth="0.7" strokeDasharray="3 3" />

        {/* Historical line */}
        <path
          d={histPath}
          fill="none"
          stroke="#0a1628"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={2200}
          strokeDashoffset={2200 * (1 - lineProgress)}
        />

        {lineProgress > 0.95 && (
          <circle cx={projX0} cy={projY0} r="3.5" fill="#0a1628" />
        )}

        {lineProgress > 0.97 && (
          <motion.line
            x1={projX0} y1={projY0} x2={projX1} y2={projY1}
            stroke="#1b3a6b"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />
        )}

        {lineProgress > 0.97 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            <text x={projX1 + 4} y={projY1 - 5} fontSize="7.5" fill="rgba(27,58,107,0.65)" fontFamily="monospace">
              {fmt(Math.round(projEnd))}
            </text>
            <text x={projX1 + 4} y={projY1 + 6} fontSize="7" fill="rgba(27,58,107,0.45)" fontFamily="monospace">
              {cagr >= 0 ? '+' : ''}{Math.round(cagr * 100)}% CAGR
            </text>
          </motion.g>
        )}

        {[
          { label: String(nowYear - 1), x: PAD.l },
          { label: 'Now', x: projX0 },
          { label: String(nowYear + 5), x: projX1 },
        ].map(({ label, x }) => (
          <text key={label} x={x} y={H - 2} textAnchor="middle" fontSize="7.5" fill="rgba(10,22,40,0.28)" fontFamily="monospace">
            {label}
          </text>
        ))}

        {lineProgress > 0.97 && (
          <text x={(projX0 + projX1) / 2} y={PAD.t + 5} textAnchor="middle" fontSize="6.5" fill="rgba(27,58,107,0.28)" fontFamily="monospace">
            5-YR PROJECTION
          </text>
        )}
      </svg>
    </div>
  )
}
