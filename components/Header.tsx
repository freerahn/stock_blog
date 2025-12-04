import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            investa의 투자 정보
          </Link>
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-primary-600 transition"
            >
              홈
            </Link>
            <Link 
              href="/admin/write" 
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              글 작성
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}


