import { BlogPost } from '@/types/blog'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface RecentPostsProps {
  posts: BlogPost[]
  currentPostId?: string
}

export default function RecentPosts({ posts, currentPostId }: RecentPostsProps) {
  const filteredPosts = posts.filter(post => post.id !== currentPostId)

  if (filteredPosts.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">최신글</h3>
      <ul className="space-y-4">
        {filteredPosts.slice(0, 5).map((post) => (
          <li key={post.id}>
            <Link 
              href={`/posts/${post.id}`}
              className="block hover:text-primary-600 transition"
            >
              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {post.title}
              </h4>
              <p className="text-sm text-gray-500">
                {format(new Date(post.createdAt), 'yyyy.MM.dd', { locale: ko })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}


