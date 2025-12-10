import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Post, getAllPosts } from '@/lib/utils';
import { format } from 'date-fns';
import ko from 'date-fns/locale/ko';

// Toast UI Editor를 동적으로 로드 (SSR 비활성화)
const Editor = dynamic(
  () => import('@toast-ui/react-editor').then((mod) => mod.Editor),
  { ssr: false }
);

interface AdminPost extends Post {
  editing?: boolean;
}

export default function Admin() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const editorRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      // Cloudflare Pages Functions 또는 Next.js API routes
      const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
        ? '/api/posts' // Cloudflare Pages Functions는 자동으로 /api/posts로 라우팅
        : '/api/posts';
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
    }
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setTitle('');
    setExcerpt('');
    setShowEditor(true);
    // 에디터가 준비되면 자동으로 빈 내용으로 설정됨
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setTitle(post.metaData.title);
    setExcerpt(post.metaData.excerpt || '');
    setShowEditor(true);
    // 에디터가 준비되면 useEffect에서 설정됨
  };

  const handleDeletePost = async (slug: string, title: string) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
        ? '/api/posts'
        : '/api/posts';
        
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, title }),
      });

      if (response.ok) {
        setTimeout(() => {
          loadPosts();
          setLoading(false);
        }, 1000);
        alert('게시글이 삭제되었습니다. GitHub에 반영되는데 시간이 걸릴 수 있습니다.');
      } else {
        const data = await response.json();
        alert(data.error || '게시글 삭제에 실패했습니다.');
        setLoading(false);
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleSavePost = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 에디터 인스턴스 안전하게 가져오기
    let content = '';

    if (!editorRef.current) {
      alert('에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      let editorInstance = null;

      // getInstance 메서드로 인스턴스 가져오기
      if (typeof editorRef.current.getInstance === 'function') {
        editorInstance = editorRef.current.getInstance();
      } else if (editorRef.current.editorInstance) {
        // 직접 인스턴스 접근
        editorInstance = editorRef.current.editorInstance;
      } else {
        // ref 자체가 인스턴스일 수 있음
        editorInstance = editorRef.current;
      }

      if (editorInstance) {
        // getMarkdown 메서드 시도
        if (typeof editorInstance.getMarkdown === 'function') {
          content = editorInstance.getMarkdown() || '';
        } 
        // getHTML 메서드 시도 (WYSIWYG 모드)
        else if (typeof editorInstance.getHTML === 'function') {
          const html = editorInstance.getHTML() || '';
          // HTML이 있으면 그대로 사용 (나중에 마크다운으로 변환 가능)
          content = html;
        }
        // getText 메서드 시도
        else if (typeof editorInstance.getText === 'function') {
          content = editorInstance.getText() || '';
        }
      }
    } catch (error) {
      console.error('에디터 내용 가져오기 실패:', error);
      alert('에디터 내용을 가져오는 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = '/api/posts';
        
      const method = editingPost ? 'PUT' : 'POST';
      const body = editingPost
        ? {
            slug: editingPost.slug,
            title,
            content,
            excerpt,
          }
        : {
            title,
            content,
            excerpt,
          };

      console.log('API 호출:', { apiUrl, method, body: { ...body, content: content.substring(0, 50) + '...' } });

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('API 응답:', { status: response.status, ok: response.ok });

      if (response.ok) {
        const data = await response.json();
        console.log('저장 성공:', data);
        setShowEditor(false);
        setEditingPost(null);
        setTitle('');
        setExcerpt('');
        // GitHub API를 사용하는 경우 약간의 지연 후 로드
        setTimeout(() => {
          loadPosts();
          setLoading(false);
        }, editingPost ? 1000 : 2000);
        alert(editingPost ? '게시글이 수정되었습니다. GitHub에 반영되는데 시간이 걸릴 수 있습니다.' : '게시글이 작성되었습니다. GitHub에 반영되는데 시간이 걸릴 수 있습니다.');
      } else {
        const errorText = await response.text();
        console.error('API 에러 응답:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `서버 오류: ${response.status}` };
        }
        alert(errorData.error || `게시글 저장에 실패했습니다. (${response.status})`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('게시글 저장 실패:', error);
      alert(`게시글 저장에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingPost(null);
    setTitle('');
    setExcerpt('');
  };

  // 에디터 ref 콜백
  const handleEditorRef = useCallback((ref: any) => {
    if (ref) {
      editorRef.current = ref;
      // 에디터가 준비되었는지 확인
      setTimeout(() => {
        try {
          if (ref && typeof ref.getInstance === 'function') {
            const instance = ref.getInstance();
            if (instance) {
              setEditorReady(true);
            }
          }
        } catch (error) {
          console.error('에디터 준비 확인 실패:', error);
        }
      }, 500);
    }
  }, []);

  // 에디터가 준비되면 초기값 설정
  useEffect(() => {
    if (!showEditor) return;

    const timer = setTimeout(() => {
      try {
        if (editorRef.current && typeof editorRef.current.getInstance === 'function') {
          const editorInstance = editorRef.current.getInstance();
          if (editorInstance && typeof editorInstance.setMarkdown === 'function') {
            if (editingPost && editingPost.content) {
              // 수정 모드: 기존 내용 설정
              editorInstance.setMarkdown(editingPost.content);
            } else if (!editingPost) {
              // 새 글 모드: 빈 내용
              editorInstance.setMarkdown('');
            }
          }
        }
      } catch (error) {
        console.error('에디터 초기화 실패:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [showEditor, editingPost]);

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
            </nav>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">게시글 관리</h1>
          {!showEditor && (
            <button 
              className="btn btn-primary" 
              onClick={handleNewPost}
              disabled={loading}
            >
              새 글 작성
            </button>
          )}
        </div>

        {showEditor ? (
          <div className="editor-form">
            <div className="form-group">
              <label className="form-label">제목</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">요약 (선택사항)</label>
              <input
                type="text"
                className="form-input"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="게시글 요약을 입력하세요"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">내용</label>
              <Editor
                initialValue={editingPost?.content || ''}
                previewStyle="vertical"
                height="600px"
                initialEditType="wysiwyg"
                useCommandShortcut={true}
                ref={handleEditorRef}
                language="ko-KR"
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                취소
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSavePost}
                disabled={loading}
              >
                {loading ? '처리 중...' : editingPost ? '수정' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-post-list">
            {posts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                작성된 게시글이 없습니다.
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.slug} className="admin-post-item">
                  <div className="admin-post-info">
                    <div className="admin-post-title">{post.metaData.title}</div>
                    <div className="admin-post-date">
                      {format(new Date(post.metaData.date), 'yyyy년 MM월 dd일', {
                        locale: ko,
                      })}
                    </div>
                  </div>
                  <div className="admin-post-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEditPost(post)}
                      disabled={loading}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDeletePost(post.slug, post.metaData.title)}
                      disabled={loading}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
