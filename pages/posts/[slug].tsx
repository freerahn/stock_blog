import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPostBySlug, getAllPostSlugs, getAllPosts, Post } from '@/lib/utils';
import { format } from 'date-fns';
import ko from 'date-fns/locale/ko';
import { useState, useEffect } from 'react';

interface PostDetailProps {
  post: Post;
  recentPosts: Post[];
}

export default function PostDetail({ post, recentPosts }: PostDetailProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link href="/" className="logo">
              Stock Blog
            </Link>
            <nav>
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="post-detail-container">
        <div className="post-content-wrapper">
          <article className="post-content">
            <h1 className="post-detail-title">{post.metaData.title}</h1>
            <div className="post-detail-date">
              {format(new Date(post.metaData.date), 'yyyy년 MM월 dd일', {
                locale: ko,
              })}
            </div>
            <div className="post-detail-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>
          </article>
        </div>

        {!isMobile && (
          <aside className="sidebar">
            <div className="sidebar-content">
              <h2 className="sidebar-title">최근 글</h2>
              <ul className="sidebar-post-list">
                {recentPosts.map((recentPost) => (
                  <li key={recentPost.slug} className="sidebar-post-item">
                    <Link
                      href={`/posts/${recentPost.slug}`}
                      className="sidebar-post-link"
                    >
                      {recentPost.metaData.title}
                    </Link>
                    <div className="sidebar-post-date">
                      {format(
                        new Date(recentPost.metaData.date),
                        'yyyy.MM.dd',
                        { locale: ko }
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {isMobile && (
          <aside className="sidebar">
            <div className="sidebar-content">
              <h2 className="sidebar-title">최근 글</h2>
              <ul className="sidebar-post-list">
                {recentPosts.map((recentPost) => (
                  <li key={recentPost.slug} className="sidebar-post-item">
                    <Link
                      href={`/posts/${recentPost.slug}`}
                      className="sidebar-post-link"
                    >
                      {recentPost.metaData.title}
                    </Link>
                    <div className="sidebar-post-date">
                      {format(
                        new Date(recentPost.metaData.date),
                        'yyyy.MM.dd',
                        { locale: ko }
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllPostSlugs();
  const paths = slugs.map((slug) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      notFound: true,
    };
  }

  // 최근 게시글 5개 가져오기 (현재 게시글 제외)
  const allPosts = getAllPosts();
  const recentPosts = allPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 5);

  return {
    props: {
      post,
      recentPosts,
    },
  };
};

