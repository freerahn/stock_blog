'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPost } from '@/types/blog'

export default function WritePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    images: [],
    author: 'investa',
    stockSymbol: '',
    stockName: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: formData.title || '',
        content: formData.content || '',
        excerpt: formData.excerpt || formData.content?.substring(0, 200) || '',
        tags: formData.tags || [],
        images: formData.images || [],
        author: formData.author || 'investa',
        stockSymbol: formData.stockSymbol || undefined,
        stockName: formData.stockName || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const { savePost } = await import('@/lib/posts-client')
      savePost(newPost)
      router.push(`/posts/${newPost.id}`)
    } catch (error) {
      console.error('Error saving post:', error)
      alert('글 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    })
  }

  const addImage = () => {
    if (imageInput.trim() && !formData.images?.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...(formData.images || []), imageInput.trim()],
      })
      setImageInput('')
    }
  }

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images?.filter(img => img !== image) || [],
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">새 글 작성</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목 *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="글 제목을 입력하세요"
          />
        </div>

        {/* 종목 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stockName" className="block text-sm font-medium text-gray-700 mb-2">
              종목명
            </label>
            <input
              type="text"
              id="stockName"
              value={formData.stockName}
              onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="예: 삼성전자"
            />
          </div>
          <div>
            <label htmlFor="stockSymbol" className="block text-sm font-medium text-gray-700 mb-2">
              종목코드
            </label>
            <input
              type="text"
              id="stockSymbol"
              value={formData.stockSymbol}
              onChange={(e) => setFormData({ ...formData, stockSymbol: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="예: 005930"
            />
          </div>
        </div>

        {/* 요약 */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            요약 (SEO용)
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="글 요약을 입력하세요 (메타 설명에 사용됩니다)"
          />
        </div>

        {/* 본문 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            본문 * (Markdown 지원)
          </label>
          <textarea
            id="content"
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder="글 내용을 입력하세요 (Markdown 형식 지원)"
          />
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            태그 (SEO용)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="태그를 입력하고 Enter를 누르세요"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map((tag) => (
              <span
                key={tag}
                className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-primary-700 hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 이미지 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지 URL
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="이미지 URL을 입력하고 Enter를 누르세요"
            />
            <button
              type="button"
              onClick={addImage}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              추가
            </button>
          </div>
          {formData.images && formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`이미지 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 작성자 */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
            작성자
          </label>
          <input
            type="text"
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="작성자 이름"
          />
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '글 발행하기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

