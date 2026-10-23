import { BookSearchResult } from '@/types/reading';

const toHttps = (url?: string) => (url ? url.replace(/^http:/, 'https:') : undefined);

async function searchGoogle(q: string): Promise<BookSearchResult[]> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8&printType=books`
  );
  if (!res.ok) throw new Error('Google Books indisponible');
  const json = await res.json();
  return (json.items || []).map((it: any) => {
    const v = it.volumeInfo || {};
    return {
      title: v.title + (v.subtitle ? ` — ${v.subtitle}` : ''),
      author: (v.authors || []).join(', '),
      coverUrl: toHttps(v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail),
      totalPages: v.pageCount || 0,
      source: 'google' as const,
    };
  });
}

async function searchOpenLibrary(q: string): Promise<BookSearchResult[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,cover_i,number_of_pages_median`
  );
  if (!res.ok) throw new Error('OpenLibrary indisponible');
  const json = await res.json();
  return (json.docs || []).map((d: any) => ({
    title: d.title,
    author: (d.author_name || []).join(', '),
    coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined,
    totalPages: d.number_of_pages_median || 0,
    source: 'openlibrary' as const,
  }));
}

/** Recherche Google Books, avec repli sur OpenLibrary si vide ou en erreur. */
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const g = await searchGoogle(q);
    if (g.length > 0) return g;
  } catch {
    /* repli */
  }
  try {
    return await searchOpenLibrary(q);
  } catch {
    return [];
  }
}
