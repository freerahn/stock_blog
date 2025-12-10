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
  { 
    ssr: false,
    loading: () => <div>에디터 로딩 중...</div>
  }
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
  const [editorContent, setEditorContent] = useState('');
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
    setEditorContent('');
    setShowEditor(true);
    // 에디터가 준비되면 자동으로 빈 내용으로 설정됨
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setTitle(post.metaData.title);
    setExcerpt(post.metaData.excerpt || '');
    setEditorContent(post.content || '');
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
    console.log('저장 버튼 클릭');
    console.log('제목:', title);
    console.log('에디터 ref:', editorRef.current);
    console.log('에디터 content state:', editorContent);

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    // 에디터 인스턴스 안전하게 가져오기
    let content = editorContent; // 먼저 state에서 가져오기 시도

    // state가 비어있으면 ref에서 직접 가져오기 시도
    if (!content.trim()) {
      try {
        let editorInstance = null;

        // 방법 1: ref.current에서 getInstance 찾기
        if (editorRef.current) {
          // dynamic import로 인해 ref가 래퍼 객체일 수 있음
          // 실제 Editor 컴포넌트를 찾기
          const refObj = editorRef.current as any;
          
          // ref.current가 React 컴포넌트 인스턴스인 경우
          if (refObj.getInstance && typeof refObj.getInstance === 'function') {
            editorInstance = refObj.getInstance();
          }
          // ref.current.editorInstance 같은 속성
          else if (refObj.editorInstance) {
            editorInstance = refObj.editorInstance;
          }
          // ref.current가 직접 인스턴스인 경우 (getInstance 메서드가 인스턴스에 있을 수 있음)
          else if (typeof refObj === 'object') {
            // 모든 속성을 확인하여 에디터 인스턴스 찾기
            for (const key in refObj) {
              if (refObj[key] && typeof refObj[key] === 'object') {
                const candidate = refObj[key];
                if (candidate.getMarkdown && typeof candidate.getMarkdown === 'function') {
                  editorInstance = candidate;
                  break;
                } else if (candidate.getHTML && typeof candidate.getHTML === 'function') {
                  editorInstance = candidate;
                  break;
                }
              }
            }
          }
        }

        // 방법 2: DOM에서 직접 찾기 (최후의 수단)
        if (!editorInstance) {
          const editorDOM = document.querySelector('.toastui-editor-contents');
          if (editorDOM) {
            // DOM 요소의 데이터 속성에서 인스턴스 찾기 시도
            const editorContainer = editorDOM.closest('.toastui-editor');
            if (editorContainer) {
              // 에디터 컨테이너에서 인스턴스 찾기
              const instance = (editorContainer as any).__editorInstance || 
                               (window as any).__toastuiEditorInstance;
              if (instance && typeof instance.getMarkdown === 'function') {
                editorInstance = instance;
              }
            }
          }
        }

        if (editorInstance) {
          if (typeof editorInstance.getMarkdown === 'function') {
            content = editorInstance.getMarkdown() || '';
          } else if (typeof editorInstance.getHTML === 'function') {
            content = editorInstance.getHTML() || '';
          }
        }
      } catch (error: any) {
        console.error('에디터 내용 가져오기 실패:', error);
      }
    }

    console.log('최종 content 길이:', content.length);
    console.log('최종 content (처음 100자):', content.substring(0, 100));

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
    setEditorContent('');
  };

  // 에디터 ref 콜백
  const handleEditorRef = useCallback((ref: any) => {
    if (ref) {
      editorRef.current = ref;
      // 에디터가 준비되었는지 확인
      setTimeout(() => {
        setEditorReady(true);
      }, 500);
    }
  }, []);

  // DOM에서 에디터 인스턴스 찾기 (Toast UI Editor는 DOM에 마운트됨)
  const getEditorInstanceFromDOM = useCallback(() => {
    try {
      // Toast UI Editor는 .toastui-editor-contents 또는 .ProseMirror를 사용
      const editorElement = document.querySelector('.toastui-editor-contents, .ProseMirror');
      if (editorElement) {
        // window 객체에서 에디터 인스턴스 찾기 시도
        // 또는 DOM 요소에서 직접 접근
        return editorElement;
      }
    } catch (error) {
      console.error('DOM에서 에디터 찾기 실패:', error);
    }
    return null;
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
              <div id="toast-editor-container">
                <Editor
                  initialValue={editingPost?.content || ''}
                  previewStyle="vertical"
                  height="600px"
                  initialEditType="wysiwyg"
                  useCommandShortcut={true}
                  ref={handleEditorRef}
                  language="ko-KR"
                  onChange={() => {
                    // 에디터 내용 변경 시 state 업데이트
                    try {
                      // DOM에서 에디터 찾기
                      const editorEl = document.querySelector('.toastui-editor');
                      if (editorEl) {
                        // Toast UI Editor는 DOM에 인스턴스를 저장할 수 있음
                        const instance = (editorEl as any).__editorInstance || 
                                       (editorEl as any).editorInstance ||
                                       (window as any).toastui?.Editor?.getInstances?.()?.[0];
                        
                        if (instance) {
                          if (typeof instance.getMarkdown === 'function') {
                            const markdown = instance.getMarkdown() || '';
                            setEditorContent(markdown);
                          } else if (typeof instance.getHTML === 'function') {
                            const html = instance.getHTML() || '';
                            setEditorContent(html);
                          }
                        } else {
                          // ref를 통해 시도
                          const refObj = editorRef.current as any;
                          if (refObj) {
                            let inst = null;
                            if (refObj.getInstance && typeof refObj.getInstance === 'function') {
                              inst = refObj.getInstance();
                            } else if (refObj.editorInstance) {
                              inst = refObj.editorInstance;
                            }
                            
                            if (inst) {
                              if (typeof inst.getMarkdown === 'function') {
                                setEditorContent(inst.getMarkdown() || '');
                              } else if (typeof inst.getHTML === 'function') {
                                setEditorContent(inst.getHTML() || '');
                              }
                            }
                          }
                        }
                      }
                    } catch (error) {
                      console.error('onChange 에러:', error);
                    }
                  }}
                  onLoad={(editorType: string) => {
                    setEditorReady(true);
                    // 에디터 로드 후 DOM에서 인스턴스 찾기
                    setTimeout(() => {
                      const editorEl = document.querySelector('.toastui-editor');
                      if (editorEl && editorRef.current) {
                        // 에디터 인스턴스를 ref에 저장 시도
                        const instance = (editorEl as any).__editorInstance;
                        if (instance) {
                          (editorRef.current as any).editorInstance = instance;
                        }
                      }
                    }, 100);
                  }}
                />
              </div>
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
