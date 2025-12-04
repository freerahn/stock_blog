'use client'

import { useEffect, useState } from 'react'
import { getAllPosts } from '@/lib/posts-client'
import { generateSitemap } from '@/lib/sitemap-generator'

export default function SitemapPage() {
  const [sitemapXml, setSitemapXml] = useState<string>('')

  useEffect(() => {
    const posts = getAllPosts()
    const sitemap = generateSitemap(posts)
    setSitemapXml(sitemap)
  }, [])

  if (!sitemapXml) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">사이트맵을 생성하는 중...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">사이트맵</h1>
        <p className="text-gray-600 mb-4">
          Google Search Console에 제출할 사이트맵입니다.
        </p>
        <div className="mb-4">
          <button
            onClick={() => {
              const blob = new Blob([sitemapXml], { type: 'application/xml' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'sitemap.xml'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            사이트맵 다운로드
          </button>
        </div>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
          <code>{sitemapXml}</code>
        </pre>
      </div>
    </div>
  )
}


