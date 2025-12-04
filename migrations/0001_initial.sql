-- 게시글 테이블 생성
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  tags TEXT DEFAULT '[]',
  images TEXT DEFAULT '[]',
  author TEXT DEFAULT 'investa',
  stockSymbol TEXT,
  stockName TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_created_at ON posts(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_stock_symbol ON posts(stockSymbol);


