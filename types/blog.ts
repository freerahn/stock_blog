export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
  stockSymbol?: string;
  stockName?: string;
}







