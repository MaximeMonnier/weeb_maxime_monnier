export type Article = {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
  coverImg?: string;
};

// Ce que rend la liste `/articles/`, et rien de plus : l'API y coupe le texte en
// `excerpt` et n'envoie plus `content`, qu'un `Article` complet promettrait.
export type ArticleListItem = {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  created_at: string;
  coverImg?: string;
};
