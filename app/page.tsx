import PostsList from '@/components/PostsList'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          investa의 투자 정보
        </h1>
        <p className="text-lg text-gray-600">
          전문적인 주식 종목 분석과 주가 전망을 제공합니다
        </p>
      </div>
      <ErrorBoundary>
        <PostsList />
      </ErrorBoundary>
    </div>
  )
}
