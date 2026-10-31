export type Article = {
  id: number;
  title: string;
  content: string;
  cover: string | null;
  author: string;
  is_author: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleListItem = {
  id: number;
  title: string;
  excerpt: string;
  excerpt_truncated: boolean;
  cover: string | null;
  author: string;
  created_at: string;
};
