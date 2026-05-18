import { NextResponse } from 'next/server'

const TOKEN = 'd853ibpr01qrqbno6jf0d853ibpr01qrqbno6jfg'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') ?? 'NVDA'

  const to = Math.floor(Date.now() / 1000)
  const from = to - 365 * 24 * 3600 // 1 year of weekly candles

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=W&from=${from}&to=${to}&token=${TOKEN}`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    if (data.s !== 'ok') throw new Error('no data')
    return NextResponse.json({ timestamps: data.t as number[], closes: data.c as number[] })
  } catch {
    return NextResponse.json({ timestamps: [], closes: [] })
  }
}
