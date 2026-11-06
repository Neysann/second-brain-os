'use client';

import React from 'react';
import { Flame, BookOpen, Check, Plus } from 'lucide-react';
import { useDailyLife } from '@/context/DailyLifeContext';
import { useReading } from '@/context/ReadingContext';
import { IslandThemeTokens } from './islandTheme';

interface IslandHabitsReadingTabProps {
  themeTokens: IslandThemeTokens;
}

export const IslandHabitsReadingTab: React.FC<IslandHabitsReadingTabProps> = ({
  themeTokens,
}) => {
  const { habits, habitHistory, toggleHabitDate, currentStreak } = useDailyLife();
  const { books, logProgress } = useReading();

  const isNothing = themeTokens.mode === 'nothing';
  const isCyberpunk = themeTokens.mode === 'cyberpunk';
  const numFontClass = isNothing ? 'font-ndot' : isCyberpunk ? 'font-mono' : 'tabular-nums';

  const todayStr = new Date().toISOString().split('T')[0];

  const activeBook = React.useMemo(() => {
    return (
      books.find((b) => b.status === 'reading') ||
      books.find((b) => b.status === 'to_read') ||
      null
    );
  }, [books]);

  const isMangaLike = activeBook?.kind === 'manga' || activeBook?.kind === 'novel';

  const bookProgressPct = React.useMemo(() => {
    if (!activeBook) return 0;
    if (activeBook.unit === 'percent') return Math.min(100, activeBook.progress || 0);
    if (activeBook.totalPages > 0) {
      return Math.min(100, Math.round(((activeBook.progress || 0) / activeBook.totalPages) * 100));
    }
    return 0;
  }, [activeBook]);

  return (
    <div className="grid grid-cols-12 gap-3.5 h-full px-5 pb-3.5 pt-1 select-none">
      {/* Colonne Gauche (7 cols) : Habitudes */}
      <div className="col-span-7 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`text-[11px] font-medium text-zinc-400 ${
              isNothing ? 'font-ndot uppercase tracking-wider text-[10px]' : ''
            }`}
          >
            Habitudes du jour
          </span>
          {currentStreak > 0 && (
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold ${numFontClass}`}
              style={{ color: themeTokens.accentHex }}
            >
              <Flame className="w-3 h-3 fill-current" />
              <span>{currentStreak}j</span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-none">
          {habits.map((h) => {
            const done = !!habitHistory[h.id]?.[todayStr];
            return (
              <button
                key={h.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHabitDate(h.id, todayStr);
                }}
                style={done ? themeTokens.subtleActiveStyle : undefined}
                className={`w-full h-8.5 px-3 rounded-xl flex items-center justify-between gap-2 text-left transition-all active:scale-[0.99] cursor-pointer ${
                  done
                    ? 'border text-zinc-300'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs flex-shrink-0">{h.icon || '•'}</span>
                  <span className={`text-xs font-medium truncate ${done ? 'line-through opacity-75' : ''}`}>
                    {h.name}
                  </span>
                </div>
                <div
                  style={done ? themeTokens.primaryBtnStyle : undefined}
                  className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    done ? themeTokens.primaryBtnTextClass : 'border border-zinc-500'
                  }`}
                >
                  {done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colonne Droite (5 cols) : Lecture rapide */}
      <div className="col-span-5 flex flex-col justify-between h-full p-3 rounded-2xl bg-white/[0.045] border border-white/[0.06]">
        {!activeBook ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen className="w-5 h-5 text-zinc-500 mb-1.5" />
            <p className="text-xs text-zinc-400">Aucune lecture en cours</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              {activeBook.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeBook.coverUrl}
                  alt={activeBook.title}
                  className="w-9 h-12 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/15"
                />
              ) : (
                <div
                  className="w-9 h-12 rounded-lg border flex items-center justify-center flex-shrink-0"
                  style={themeTokens.subtleActiveStyle}
                >
                  <BookOpen className="w-4 h-4" style={{ color: themeTokens.accentHex }} />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                  {activeBook.title}
                </div>
                <div className={`text-[10px] text-zinc-400 truncate mt-0.5 ${numFontClass}`}>
                  {activeBook.progress || 0}
                  {activeBook.unit === 'percent'
                    ? '%'
                    : activeBook.totalPages > 0
                    ? ` / ${activeBook.totalPages}`
                    : isMangaLike
                    ? ' ch.'
                    : ' p.'}
                </div>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden my-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${bookProgressPct}%`,
                  ...themeTokens.progressFillStyle,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  logProgress(activeBook.id, isMangaLike ? 1 : 5);
                }}
                style={themeTokens.primaryBtnStyle}
                className={`h-8 rounded-xl hover:brightness-110 text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer ${themeTokens.primaryBtnTextClass}`}
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span className={numFontClass}>{isMangaLike ? '1 ch' : '5 p'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  logProgress(activeBook.id, isMangaLike ? 3 : 10);
                }}
                className={`h-8 rounded-xl bg-white/[0.09] hover:bg-white/[0.16] text-white text-[11px] font-medium flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer ${numFontClass}`}
              >
                <Plus className="w-3 h-3" />
                <span>{isMangaLike ? '3 ch' : '10 p'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
