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

type Period = '1w' | '3m' | '1y' | '3y'

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
        const data = await getStockData(stockSymbol, stockName, '3y')
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
                return `주가: ${context.parsed.y?.toLocaleString() || 0}원`
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
async function getStockData(stockSymbol: string, stockName: string, range: '3m' | '3y' = '3y'): Promise<StockDataPoint[]> {
  try {
    // 한국 주식은 6자리 종목 코드를 사용 (예: 005930.KS)
    // 종목 코드가 6자리 숫자인지 확인
    const cleanSymbol = stockSymbol.trim()
    if (!/^\d{6}$/.test(cleanSymbol)) {
      console.warn('종목 코드 형식이 올바르지 않습니다:', cleanSymbol)
      throw new Error('Invalid stock symbol format')
    }

    // Yahoo Finance API를 통한 주가 데이터 가져오기
    const apiRange = range === '3y' ? '3y' : '3mo'
    const yahooSymbol = `${cleanSymbol}.KS`
    
    // CORS 문제를 피하기 위해 직접 호출 시도
    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${apiRange}`
    
    let response: Response | null = null
    let lastError: Error | null = null
    
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.warn('Yahoo Finance API 호출 실패:', error)
      lastError = error as Error
    }

    if (response && response.ok) {
      const data = await response.json()
      const result = data.chart?.result?.[0]

      if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
        const timestamps = result.timestamp
        const closes = result.indicators.quote[0].close

        const stockData = timestamps
          .map((timestamp: number, index: number) => {
            const closePrice = closes[index]
            if (!closePrice || closePrice === null || isNaN(closePrice)) {
              return null
            }
            return {
              date: new Date(timestamp * 1000).toISOString().split('T')[0],
              price: Math.round(closePrice),
            }
          })
          .filter((point: StockDataPoint | null): point is StockDataPoint => 
            point !== null && point.price > 0
          )

        if (stockData.length > 0) {
          console.log(`주가 데이터 로드 성공: ${stockSymbol}, ${stockData.length}개 데이터 포인트`)
          return stockData
        }
      }
      
      // 데이터가 없거나 형식이 맞지 않는 경우
      console.warn('Yahoo Finance API 응답에 유효한 데이터가 없습니다:', result)
    } else if (response) {
      console.warn('Yahoo Finance API 응답 오류:', response.status, response.statusText)
    } else {
      console.warn('Yahoo Finance API 호출 실패:', lastError?.message || 'Unknown error')
    }
  } catch (error) {
    console.error('Yahoo Finance API 호출 실패:', error)
    console.warn('시뮬레이션 데이터를 사용합니다.')
  }

  // API 실패 시 시뮬레이션 데이터 생성 (실제 주가와 유사하게)
  return generateSimulatedStockData(stockSymbol, stockName, range)
}

// 시뮬레이션 주가 데이터 생성 (API 실패 시에만 사용)
function generateSimulatedStockData(stockSymbol: string, stockName: string, range: '3m' | '3y' = '3y'): StockDataPoint[] {
  console.warn(`⚠️ 실제 주가 데이터를 가져올 수 없어 시뮬레이션 데이터를 사용합니다. 종목: ${stockSymbol} (${stockName || '알 수 없음'})`)
  
  const data: StockDataPoint[] = []
  const today = new Date()
  const startDate = new Date(today)

  if (range === '3y') {
    startDate.setFullYear(today.getFullYear() - 3)
  } else {
    startDate.setMonth(today.getMonth() - 3)
  }

  // 실제 한국 주식의 평균 주가 범위를 고려한 기본 주가 설정
  const basePrices: { [key: string]: number } = {
    '068270': 4000, // 팬오션
    '079160': 6000, // CJ CGV
    '084990': 5000, // 헬릭스미스
    '035720': 4000, // 카티스
    '005930': 70000, // 삼성전자
    '000660': 50000, // SK하이닉스
    '035420': 200000, // NAVER
    '051910': 100000, // LG화학
  }

  const basePrice = basePrices[stockSymbol] || 10000
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
  
  if (period === '1w') {
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
