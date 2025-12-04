import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'investa의 투자 정보 | 주가 전망 및 투자 정보',
  description: '주식 종목 분석과 주가 전망을 제공하는 전문 블로그. 상세한 기업 분석, 투자 전략, 시장 동향을 확인하세요.',
  keywords: '주식, 종목 분석, 주가 전망, 투자, 증권, 주식 투자, 기업 분석',
  openGraph: {
    title: 'investa의 투자 정보',
    description: 'investa의 주식 종목 분석과 주가 전망을 제공하는 전문 블로그',
    type: 'website',
    locale: 'ko_KR',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="canonical" href="https://stock-blog.com" />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}


