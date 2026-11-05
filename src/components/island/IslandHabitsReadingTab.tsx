'use client';

import React from 'react';
import { Flame, BookOpen, Check, ExternalLink, Plus } from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { useReading } from '@/context/ReadingContext';

interface IslandHabitsReadingTabProps {
  accentHex: string;
}

export const IslandHabitsReadingTab: React.FC<IslandHabitsReadingTabProps> = ({ accentHex }) => {
  const { habits, habitHistory, toggleHabitDate, currentStreak } = useDailyLife();
  const { books, logProgress, currentStreak: readingStreak } = useReading();

  const todayStr = new Date().toISOString().split('T')[0];

  // Livre ou manga en cours de lecture (ou premier à lire)
  const activeBook = React.useMemo(() => {
    const reading = books.find((b) => b.status === 'reading');
    if (reading) return reading;
    return books.find((b) => b.status === 'to_read') || null;
  }, [books]);

  const openRoute = (route: string) => {
    const electron = (window as any).electronAPI;
    if (electron?.openMainAppRoute) {
      electron.openMainAppRoute(route);
    }
  };

  const completedTodayCount = React.useMemo(() => {
    return habits.filter((h) => !!habitHistory[h.id]?.[todayStr]).length;
  }, [habits, habitHistory, todayStr]);

  const isMangaLike =
    activeBook?.kind === 'manga' || activeBook?.kind === 'novel';

  const bookProgressPct = React.useMemo(() => {
    if (!activeBook) return 0;
    if (activeBook.unit === 'percent') return Math.min(100, activeBook.progress || 0);
    if (activeBook.totalPages > 0) {
      return Math.min(100, Math.round(((activeBook.progress || 0) / activeBook.totalPages) * 100));
    }
    return 0;
  }, [activeBook]);

  return (
    <div className="grid grid-cols-12 gap-3 h-[215px] px-3.5 py-2 select-none">
      {/* Colonne Gauche (7 cols) : Habitudes du Jour */}
      <div className="col-span-7 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              Habitudes ({completedTodayCount}/{habits.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[9px] font-bold">
              🔥 {currentStreak} j
            </span>
            <button
              type="button"
              onClick={() => openRoute('/habits')}
              className="text-zinc-400 hover:text-white cursor-pointer"
              title="Ouvrir Habitudes"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex-1 mt-1.5 overflow-y-auto space-y-1 pr-0.5">
          {habits.map((h) => {
            const done = !!habitHistory[h.id]?.[todayStr];
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHabitDate(h.id, todayStr)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                  done
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.07] text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">{h.icon || '✨'}</span>
                  <span
                    className={`text-xs font-semibold truncate ${
                      done ? 'line-through text-zinc-400' : 'text-zinc-100'
                    }`}
                  >
                    {h.name}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                    done ? 'bg-emerald-500 text-black' : 'border border-white/25'
                  }`}
                >
                  {done && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colonne Droite (5 cols) : Lecture Rapide */}
      <div className="col-span-5 flex flex-col justify-between h-full p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-rose-400" />
            <span>Lecture</span>
          </span>
          <button
            type="button"
            onClick={() => openRoute('/reading')}
            className="text-[9px] text-zinc-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
          >
            <span>📚 {readingStreak}j</span>
            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
          </button>
        </div>

        {!activeBook ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-1">
            <BookOpen className="w-5 h-5 text-zinc-500 mb-1" />
            <p className="text-[11px] font-semibold text-zinc-300">Aucune lecture active</p>
            <button
              type="button"
              onClick={() => openRoute('/reading')}
              className="mt-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold text-white cursor-pointer"
            >
              Ouvrir Bibliothèque
            </button>
          </div>
        ) : (
          <>
            <div className="my-auto space-y-1.5">
              <div className="flex items-center gap-2">
                {activeBook.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeBook.coverUrl}
                    alt={activeBook.title}
                    className="w-9 h-12 rounded-lg object-cover border border-white/15 flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-12 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white line-clamp-2 leading-tight">
                    {activeBook.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {activeBook.author || activeBook.kind}
                  </div>
                </div>
              </div>

              {/* Progression */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                  <span>
                    {activeBook.progress || 0}
                    {activeBook.unit === 'percent'
                      ? '%'
                      : activeBook.totalPages > 0
                      ? ` / ${activeBook.totalPages}`
                      : isMangaLike
                      ? ' chap.'
                      : ' p.'}
                  </span>
                  <span className="text-zinc-400">{bookProgressPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${bookProgressPct}%`, backgroundColor: accentHex }}
                  />
                </div>
              </div>
            </div>

            {/* Boutons d'incrément 1-clic */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {isMangaLike ? (
                <>
                  <button
                    type="button"
                    onClick={() => logProgress(activeBook.id, 1)}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-[10px] font-extrabold flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>1 chap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => logProgress(activeBook.id, 3)}
                    className="py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>3 chap</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => logProgress(activeBook.id, 5)}
                    className="py-1 px-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-[10px] font-extrabold flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>5 p.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => logProgress(activeBook.id, 10)}
                    className="py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>10 p.</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
