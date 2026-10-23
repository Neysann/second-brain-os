'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { Book, BookStatus, ReadingDayLog, ReadingProfile } from '@/types/reading';
import { useAuth } from './AuthContext';
import {
  subscribeToBooks,
  saveBook,
  deleteBookById,
  subscribeToReadingProfile,
  saveReadingProfile,
  getLocalBooks,
  getLocalReadingProfile,
} from '@/lib/dataService';

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
  const { user } = useAuth();
  const currentUserId = user?.uid;

  const [books, setBooks] = useState<Book[]>(() => getLocalBooks(currentUserId));
  const [dayLog, setDayLog] = useState<Record<string, ReadingDayLog>>(() => getLocalReadingProfile(currentUserId).dayLog || {});
  const [yearlyGoal, setYearlyGoalState] = useState<number>(() => getLocalReadingProfile(currentUserId).yearlyGoal || 12);

  const deletedBookIdsRef = useRef<Set<string>>(new Set());

  // Abonnement temps réel synchronisé avec Firestore & LocalStorage
  useEffect(() => {
    const unsubBooks = subscribeToBooks(currentUserId, (loadedBooks) => {
      setBooks((prev) => {
        const safeLoaded = loadedBooks || [];
        const loadedIds = new Set(safeLoaded.map((b) => b.id));
        const pendingLocals = prev.filter(
          (b) =>
            !loadedIds.has(b.id) &&
            !deletedBookIdsRef.current.has(b.id) &&
            Date.now() - new Date(b.createdAt).getTime() < 15000
        );
        return [...pendingLocals, ...safeLoaded];
      });
    });

    const unsubProfile = subscribeToReadingProfile(currentUserId, (loadedProfile) => {
      if (loadedProfile) {
        setDayLog(loadedProfile.dayLog || {});
        if (loadedProfile.yearlyGoal) {
          setYearlyGoalState(loadedProfile.yearlyGoal);
        }
      }
    });

    return () => {
      unsubBooks();
      unsubProfile();
    };
  }, [currentUserId]);

  const addBook = async (data: Omit<Book, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newBook: Book = {
      ...data,
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUserId,
      createdAt: now,
      updatedAt: now,
    };
    // Mise à jour optimiste immédiate (0ms de latence)
    setBooks((prev) => [newBook, ...prev.filter((b) => b.id !== newBook.id)]);
    await saveBook(newBook, currentUserId);
  };

  const updateBook = async (book: Book) => {
    const updated: Book = {
      ...book,
      userId: book.userId || currentUserId,
      updatedAt: new Date().toISOString(),
    };
    setBooks((prev) => prev.map((b) => (b.id === book.id ? updated : b)));
    await saveBook(updated, currentUserId);
  };

  const deleteBook = async (id: string) => {
    deletedBookIdsRef.current.add(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    await deleteBookById(id, currentUserId);
  };

  const applyStatus = (book: Book, status: BookStatus): Book => {
    const now = new Date().toISOString();
    const next: Book = { ...book, status, updatedAt: now };
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

  const setStatus = async (id: string, status: BookStatus) => {
    const target = books.find((b) => b.id === id);
    if (!target) return;
    const updated = applyStatus(target, status);
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    await saveBook(updated, currentUserId);
  };

  const logProgress = async (id: string, amount: number) => {
    if (!amount || amount <= 0) return;
    const target = books.find((b) => b.id === id);
    if (!target) return;

    const max = target.unit === 'percent' ? 100 : target.totalPages > 0 ? target.totalPages : Infinity;
    const newProgress = Math.min(max, target.progress + amount);
    const effective = newProgress - target.progress;

    let updated: Book = { ...target, progress: newProgress };
    if (updated.status === 'to_read') updated = applyStatus(updated, 'reading');
    if (Number.isFinite(max) && newProgress >= max) updated = applyStatus(updated, 'done');

    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    await saveBook(updated, currentUserId);

    const key = toDateKey(new Date());
    const prev = dayLog[key] || { pages: 0, entries: 0 };
    const nextLog: Record<string, ReadingDayLog> = {
      ...dayLog,
      [key]: {
        pages: prev.pages + (target.unit === 'pages' ? effective : 0),
        entries: prev.entries + 1,
      },
    };
    setDayLog(nextLog);

    await saveReadingProfile(
      {
        userId: currentUserId,
        yearlyGoal,
        dayLog: nextLog,
      },
      currentUserId
    );
  };

  const setYearlyGoal = async (goal: number) => {
    const safe = Math.max(1, Math.round(goal) || 1);
    setYearlyGoalState(safe);
    await saveReadingProfile(
      {
        userId: currentUserId,
        yearlyGoal: safe,
        dayLog,
      },
      currentUserId
    );
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
