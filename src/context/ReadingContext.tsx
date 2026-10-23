'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Book, BookStatus, ReadingDayLog } from '@/types/reading';

const BOOKS_KEY = 'syntropy_reading_books_v1';
const LOG_KEY = 'syntropy_reading_log_v1';
const GOAL_KEY = 'syntropy_reading_goal_v1';

export const toDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface ReadingContextType {
  books: Book[];
  dayLog: Record<string, ReadingDayLog>;
  yearlyGoal: number;
  currentStreak: number;
  bestStreak: number;
  readToday: boolean;
  addBook: (data: Omit<Book, 'id' | 'createdAt'>) => void;
  updateBook: (book: Book) => void;
  deleteBook: (id: string) => void;
  setStatus: (id: string, status: BookStatus) => void;
  /** Ajoute `amount` pages (ou % si unité percent) et alimente le streak du jour. */
  logProgress: (id: string, amount: number) => void;
  setYearlyGoal: (goal: number) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export const ReadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [dayLog, setDayLog] = useState<Record<string, ReadingDayLog>>({});
  const [yearlyGoal, setYearlyGoalState] = useState<number>(12);

  useEffect(() => {
    try {
      const b = localStorage.getItem(BOOKS_KEY);
      if (b) setBooks(JSON.parse(b));
      const l = localStorage.getItem(LOG_KEY);
      if (l) setDayLog(JSON.parse(l));
      const g = localStorage.getItem(GOAL_KEY);
      if (g) setYearlyGoalState(Number(g) || 12);
    } catch (e) {
      console.warn('Erreur chargement lectures', e);
    }
  }, []);

  const persistBooks = (next: Book[]) => {
    setBooks(next);
    localStorage.setItem(BOOKS_KEY, JSON.stringify(next));
  };
  const persistLog = (next: Record<string, ReadingDayLog>) => {
    setDayLog(next);
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  };

  const addBook = (data: Omit<Book, 'id' | 'createdAt'>) => {
    const book: Book = {
      ...data,
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    persistBooks([book, ...books]);
  };

  const updateBook = (book: Book) => persistBooks(books.map((b) => (b.id === book.id ? book : b)));

  const deleteBook = (id: string) => persistBooks(books.filter((b) => b.id !== id));

  const applyStatus = (book: Book, status: BookStatus): Book => {
    const now = new Date().toISOString();
    const next: Book = { ...book, status };
    if (status === 'reading' && !next.startedAt) next.startedAt = now;
    if (status === 'done') {
      next.finishedAt = now;
      if (!next.startedAt) next.startedAt = now;
      next.progress = next.unit === 'percent' ? 100 : next.totalPages > 0 ? next.totalPages : next.progress;
    } else {
      next.finishedAt = undefined;
    }
    return next;
  };

  const setStatus = (id: string, status: BookStatus) =>
    persistBooks(books.map((b) => (b.id === id ? applyStatus(b, status) : b)));

  const logProgress = (id: string, amount: number) => {
    if (!amount || amount <= 0) return;
    const target = books.find((b) => b.id === id);
    if (!target) return;

    const max = target.unit === 'percent' ? 100 : target.totalPages > 0 ? target.totalPages : Infinity;
    const newProgress = Math.min(max, target.progress + amount);
    const effective = newProgress - target.progress;

    let updated: Book = { ...target, progress: newProgress };
    if (updated.status === 'to_read') updated = applyStatus(updated, 'reading');
    if (Number.isFinite(max) && newProgress >= max) updated = applyStatus(updated, 'done');
    persistBooks(books.map((b) => (b.id === id ? updated : b)));

    const key = toDateKey(new Date());
    const prev = dayLog[key] || { pages: 0, entries: 0 };
    persistLog({
      ...dayLog,
      [key]: {
        pages: prev.pages + (target.unit === 'pages' ? effective : 0),
        entries: prev.entries + 1,
      },
    });
  };

  const setYearlyGoal = (goal: number) => {
    const safe = Math.max(1, Math.round(goal) || 1);
    setYearlyGoalState(safe);
    localStorage.setItem(GOAL_KEY, String(safe));
  };

  const { currentStreak, bestStreak, readToday } = useMemo(() => {
    const read = (d: Date) => (dayLog[toDateKey(d)]?.entries || 0) > 0;
    const today = new Date();
    const didToday = read(today);

    let streak = 0;
    const cursor = new Date(today);
    if (!didToday) cursor.setDate(cursor.getDate() - 1);
    while (read(cursor)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const days = Object.keys(dayLog)
      .filter((k) => dayLog[k].entries > 0)
      .sort();
    let best = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const k of days) {
      const [y, m, d] = k.split('-').map(Number);
      const cur = new Date(y, m - 1, d);
      if (prev) {
        const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      best = Math.max(best, run);
      prev = cur;
    }
    return { currentStreak: streak, bestStreak: best, readToday: didToday };
  }, [dayLog]);

  return (
    <ReadingContext.Provider
      value={{
        books,
        dayLog,
        yearlyGoal,
        currentStreak,
        bestStreak,
        readToday,
        addBook,
        updateBook,
        deleteBook,
        setStatus,
        logProgress,
        setYearlyGoal,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
};

export const useReading = () => {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error('useReading must be used within a ReadingProvider');
  return ctx;
};
