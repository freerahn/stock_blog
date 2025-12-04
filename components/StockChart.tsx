'use client'

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface StockChartProps {
  stockSymbol: string
  stockName: string
}

interface StockDataPoint {
  date: string
  price: number
}

type Period = '1d' | '1w' | '3m' | '1y' | '3y'

export default function StockChart({ stockSymbol, stockName }: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('3m')
  const [allStockData, setAllStockData] = useState<StockDataPoint[]>([])

  // 전체 데이터 로드 (3년치)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getStockData(stockSymbol, '3y')
        setAllStockData(data)
        setLoading(false)
      } catch (err) {
        console.error('Error loading stock data:', err)
        setError('주가 데이터를 불러오는 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }
    loadData()
  }, [stockSymbol])

  // 기간 변경 시 그래프 업데이트
  useEffect(() => {
    if (!canvasRef.current || allStockData.length === 0 || loading) return

    const filteredData = filterDataByPeriod(allStockData, period)

    if (filteredData.length === 0) {
      setError('해당 기간의 데이터가 없습니다.')
      return
    }

    // 기존 차트가 있으면 제거
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // 날짜와 가격 배열 생성
    const labels = filteredData.map((point) => formatDate(point.date, period))
    const prices = filteredData.map((point) => point.price)

    // Chart.js로 그래프 생성
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${stockName} 주가`,
            data: prices,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                return `주가: ${context.parsed.y.toLocaleString()}원`
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: false,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: '주가 (원)',
            },
            ticks: {
              callback: function (value) {
                return value.toLocaleString() + '원'
              },
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
      },
    })

    // 컴포넌트 언마운트 시 차트 정리
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [allStockData, period, stockName, loading])

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod)
  }

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">주가 데이터를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full mb-8">
      {/* 기간 선택 버튼 */}
      <div className="flex gap-2 mb-4 justify-center flex-wrap">
        <button
          onClick={() => handlePeriodChange('1d')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            period === '1d'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          1일
        </button>
        <button
          onClick={() => handlePeriodChange('1w')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            period === '1w'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          1주일
        </button>
        <button
          onClick={() => handlePeriodChange('3m')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            period === '3m'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          3개월
        </button>
        <button
          onClick={() => handlePeriodChange('1y')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            period === '1y'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          1년
        </button>
        <button
          onClick={() => handlePeriodChange('3y')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            period === '3y'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          3년
        </button>
      </div>

      {/* 그래프 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ height: '400px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>

    </div>
  )
}

// 기간별 데이터 필터링
function filterDataByPeriod(data: StockDataPoint[], period: Period): StockDataPoint[] {
  if (data.length === 0) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let startDate = new Date(today)

  switch (period) {
    case '1d':
      // 최근 1일 (당일)
      startDate = new Date(today)
      break
    case '1w':
      // 최근 1주일
      startDate.setDate(today.getDate() - 7)
      break
    case '3m':
      // 최근 3개월
      startDate.setMonth(today.getMonth() - 3)
      break
    case '1y':
      // 최근 1년
      startDate.setFullYear(today.getFullYear() - 1)
      break
    case '3y':
      // 최근 3년
      startDate.setFullYear(today.getFullYear() - 3)
      break
  }

  startDate.setHours(0, 0, 0, 0)

  return data.filter((point) => {
    const pointDate = new Date(point.date)
    pointDate.setHours(0, 0, 0, 0)
    return pointDate >= startDate && pointDate <= today
  })
}

// 주가 데이터 가져오기 함수
async function getStockData(stockSymbol: string, range: '3m' | '3y' = '3y'): Promise<StockDataPoint[]> {
  try {
    // Yahoo Finance API를 통한 주가 데이터 가져오기 시도
    const apiRange = range === '3y' ? '3y' : '3mo'
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}.KS?interval=1d&range=${apiRange}`
    )

    if (response.ok) {
      const data = await response.json()
      const result = data.chart?.result?.[0]

      if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
        const timestamps = result.timestamp
        const closes = result.indicators.quote[0].close

        return timestamps
          .map((timestamp: number, index: number) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            price: Math.round(closes[index] || 0),
          }))
          .filter((point: StockDataPoint) => point.price > 0)
      }
    }
  } catch (error) {
    console.warn('Yahoo Finance API 실패, 시뮬레이션 데이터 사용:', error)
  }

  // API 실패 시 시뮬레이션 데이터 생성
  return generateSimulatedStockData(stockSymbol, range)
}

// 시뮬레이션 주가 데이터 생성
function generateSimulatedStockData(stockSymbol: string, range: '3m' | '3y' = '3y'): StockDataPoint[] {
  const data: StockDataPoint[] = []
  const today = new Date()
  const startDate = new Date(today)

  if (range === '3y') {
    startDate.setFullYear(today.getFullYear() - 3)
  } else {
    startDate.setMonth(today.getMonth() - 3)
  }

  // 종목 코드에 따른 기본 주가 설정
  const basePrices: { [key: string]: number } = {
    '079160': 6000, // CJ CGV
    '084990': 5000, // 헬릭스미스
    '035720': 4000, // 카티스
  }

  const basePrice = basePrices[stockSymbol] || 5000
  let currentPrice = basePrice

  // 기간 동안의 일별 데이터 생성
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    // 주말 제외
    if (d.getDay() === 0 || d.getDay() === 6) continue

    // 랜덤 변동 (-3% ~ +3%)
    const changePercent = (Math.random() - 0.5) * 6
    currentPrice = currentPrice * (1 + changePercent / 100)

    // 주가가 너무 낮아지지 않도록 제한
    if (currentPrice < basePrice * 0.5) {
      currentPrice = basePrice * 0.5
    }

    data.push({
      date: d.toISOString().split('T')[0],
      price: Math.round(currentPrice),
    })
  }

  return data
}

// 날짜 포맷팅 함수
function formatDate(dateString: string, period: Period): string {
  const date = new Date(dateString)
  
  if (period === '1d') {
    // 1일: 시간까지 표시
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } else if (period === '1w') {
    // 1주일: 월/일
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  } else if (period === '3m') {
    // 3개월: 월/일
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  } else if (period === '1y') {
    // 1년: 월/일
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  } else {
    // 3년: 년/월
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}/${month}`
  }
}
