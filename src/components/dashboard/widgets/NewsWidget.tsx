'use client';

import React from 'react';
import { Newspaper, Flame, ExternalLink } from 'lucide-react';

const NEWS_ITEMS = [
  {
    title: 'Nouveaux modèles de raisonnement IA disponibles en production',
    time: 'Il y a 30 min',
    source: 'TechPulse',
  },
  {
    title: 'Frameworks Web 2026 : adoption massive du rendu sans hydratation',
    time: 'Il y a 2h',
    source: 'DevTrends',
  },
  {
    title: 'Cybersécurité : les bonnes pratiques de chiffrement pour vos notes',
    time: 'Il y a 4h',
    source: 'SecurityLab',
  },
];

export const NewsWidget: React.FC = () => {
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
        <span className="flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Actualités</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-rose-500 dark:text-rose-400 font-mono">
          <Flame className="w-3 h-3" /> Live
        </span>
      </div>

      {/* Liste de news */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
        {NEWS_ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="p-2 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-zinc-200/90 dark:border-zinc-800/60 transition-colors"
          >
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer">
              {item.title}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1 font-mono">
              <span>{item.source}</span>
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsWidget;
