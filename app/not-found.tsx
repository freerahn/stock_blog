import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">페이지를 찾을 수 없습니다.</p>
        <Link
          href="/"
          className="text-primary-600 hover:text-primary-700"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
