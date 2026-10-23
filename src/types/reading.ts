// Types pour le suivi des lectures (livres & manga/BD)

export type BookStatus = 'to_read' | 'reading' | 'done' | 'dropped';
export type BookKind = 'book' | 'manga' | 'novel';
export type ProgressUnit = 'pages' | 'percent' | 'chapters';

export interface Book {
  id: string;
  title: string;
  author: string;
  kind: BookKind;
  coverUrl?: string;
  status: BookStatus;
  unit: ProgressUnit;
  /** Total de pages ou de chapitres selon l'unité (0 = inconnu). */
  totalPages: number;
  /** Page/chapitre actuel(le) ou pourcentage 0..100 (unit 'percent'). */
  progress: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface ReadingDayLog {
  pages: number;
  entries: number;
}

export interface BookSearchResult {
  title: string;
  author: string;
  coverUrl?: string;
  totalPages: number;
  kind?: BookKind;
  source: 'google' | 'openlibrary' | 'jikan';
}
