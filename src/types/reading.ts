// Types pour le suivi des lectures (livres & manga/BD)

export type BookStatus = 'to_read' | 'reading' | 'done' | 'dropped';
export type BookKind = 'book' | 'manga';
export type ProgressUnit = 'pages' | 'percent';

export interface Book {
  id: string;
  title: string;
  author: string;
  kind: BookKind;
  coverUrl?: string;
  status: BookStatus;
  unit: ProgressUnit;
  /** Nombre total de pages (0 = inconnu). Utilisé si unit === 'pages'. */
  totalPages: number;
  /** Page actuelle (unit 'pages') ou pourcentage 0..100 (unit 'percent'). */
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
  source: 'google' | 'openlibrary';
}
