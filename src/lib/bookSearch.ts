import { BookKind, BookSearchResult } from '@/types/reading';

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

async function searchJikan(q: string, kind: 'manga' | 'novel'): Promise<BookSearchResult[]> {
  // Romans : light novels + romans (MyAnimeList). Manga : manga/manhwa/manhua/one-shots, etc.
  const types = kind === 'novel' ? ['lightnovel', 'novel'] : ['manga', 'manhwa', 'manhua'];
  const lists = await Promise.all(
    types.map(async (type) => {
      const res = await fetch(
        `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&type=${type}&limit=6&sfw=true`
      );
      if (!res.ok) return [] as any[];
      const json = await res.json();
      return (json.data || []) as any[];
    })
  );
  const seen = new Set<number>();
  const out: BookSearchResult[] = [];
  for (const it of lists.flat()) {
    if (seen.has(it.mal_id)) continue;
    seen.add(it.mal_id);
    out.push({
      title: it.title_english || it.title,
      author: (it.authors || []).map((a: any) => a.name).join(', '),
      coverUrl: toHttps(it.images?.jpg?.large_image_url || it.images?.jpg?.image_url),
      // Chapitres si connus, sinon volumes.
      totalPages: it.chapters || it.volumes || 0,
      kind,
      source: 'jikan',
    });
  }
  return out.slice(0, 10);
}

/**
 * Recherche selon le type :
 * - roman web / manga : Jikan (MyAnimeList), repli Google Books puis OpenLibrary
 * - livre : Google Books, repli OpenLibrary
 */
export async function searchBooks(query: string, kind: BookKind = 'book'): Promise<BookSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  if (kind === 'novel' || kind === 'manga') {
    try {
      const j = await searchJikan(q, kind);
      if (j.length > 0) return j;
    } catch {
      /* repli */
    }
  }
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
