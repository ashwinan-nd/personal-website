import { NextResponse } from 'next/server'

const TOKEN = process.env.FINNHUB_API_KEY ?? ''

// Top 50 US stocks by market cap
const SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN',
  'META', 'TSLA', 'LLY',  'AVGO', 'JPM',
  'WMT',  'V',    'MA',   'XOM',  'UNH',
  'ORCL', 'COST', 'JNJ',  'PG',   'HD',
  'ABBV', 'MRK',  'BAC',  'KO',   'PEP',
  'NFLX', 'CVX',  'AMD',  'CRM',  'ACN',
  'MCD',  'ADBE', 'TMO',  'AXP',  'TXN',
  'AMGN', 'QCOM', 'IBM',  'GE',   'PM',
  'RTX',  'GS',   'INTU', 'CAT',  'LIN',
  'NKE',  'PLTR', 'SPOT', 'PYPL', 'UBER',
]

export async function GET() {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (sym) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${TOKEN}`,
            { next: { revalidate: 60 } }
          )
          const d = await res.json()
          return { symbol: sym, price: d.c ?? 0, change: d.d ?? 0, changePercent: d.dp ?? 0 }
        } catch {
          return { symbol: sym, price: 0, change: 0, changePercent: 0 }
        }
      })
    )
    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
