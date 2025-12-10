import { GetStaticProps } from 'next';
import Link from 'next/link';
import { getAllPosts, Post } from '@/lib/utils';
import { format } from 'date-fns';
import ko from 'date-fns/locale/ko';

interface HomeProps {
  posts: Post[];
}

export default function Home({ posts }: HomeProps) {
  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link href="/" className="logo">
              Stock Blog
            </Link>
            <nav>
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container">
        <h1 style={{ marginBottom: '2rem', fontSize: '2rem', color: '#333' }}>
          최신 게시글
        </h1>
        <div className="post-list">
          {posts.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              아직 작성된 게시글이 없습니다.
            </p>
          ) : (
            posts.map((post) => (
              <Link key={post.slug} href={`/posts/${post.slug}`}>
                <div className="post-card">
                  <h2 className="post-title">{post.metaData.title}</h2>
                  <div className="post-date">
                    {format(new Date(post.metaData.date), 'yyyy년 MM월 dd일', {
                      locale: ko,
                    })}
                  </div>
                  {post.metaData.excerpt && (
                    <p className="post-excerpt">{post.metaData.excerpt}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts();

  return {
    props: {
      posts,
    },
  };
};

