import Link from 'next/link'
import { BlogPost } from '@/types/blog'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PostCardProps {
  post: BlogPost
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`}>
      <article className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden h-full flex flex-col">
        {post.images && post.images.length > 0 && (
          <div className="w-full h-48 bg-gray-200 overflow-hidden">
            <img 
              src={post.images[0]} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h2>
          {post.stockName && (
            <p className="text-sm text-primary-600 mb-2">
              {post.stockName} ({post.stockSymbol})
            </p>
          )}
          <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            {format(new Date(post.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
          </p>
        </div>
      </article>
    </Link>
  )
}






