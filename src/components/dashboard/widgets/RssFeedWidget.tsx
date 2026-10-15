'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Rss, ExternalLink, BookmarkPlus, Check } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface ArticleItem {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  category: string;
}

const DEFAULT_ARTICLES: ArticleItem[] = [
  {
    id: 'art-1',
    title: 'Building Second Brains: How AI Augmented Workflows Redefine Knowledge',
    source: 'Dev.to / AI Digest',
    date: 'Aujourd\'hui',
    url: 'https://dev.to',
    category: 'IA & Outils',
  },
  {
    id: 'art-2',
    title: 'Next.js 16 App Router Performance Patterns and SSG Best Practices',
    source: 'HackerNews',
    date: 'Hier',
    url: 'https://news.ycombinator.com',
    category: 'Architecture',
  },
  {
    id: 'art-3',
    title: 'Minimalist UX Design: The Rise of Dark Mode & Glassmorphic Dashboards',
    source: 'Design Weekly',
    date: 'Il y a 2j',
    url: 'https://uiverse.io',
    category: 'Design',
  },
];

export const RssFeedWidget: React.FC = () => {
  const { addNote } = useData();
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  const handleSaveToResources = async (art: ArticleItem) => {
    await addNote({
      title: `[Veille] ${art.title}`,
      content: `# ${art.title}\n\nSource : **${art.source}**\nLien : ${art.url}\n\n---\n*Ressource enregistrée automatiquement depuis le widget Veille Syntropy.*`,
      category: 'resource',
      tags: ['Veille', art.category, 'RSS'],
    });
    setSavedArticles((prev) => new Set([...prev, art.id]));
  };

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
        <span className="flex items-center gap-1.5">
          <Rss className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Flux RSS / Veille</span>
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">3 sources actives</span>
      </div>

      {/* Liste d'articles */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
        {DEFAULT_ARTICLES.map((art) => {
          const isSaved = savedArticles.has(art.id);
          return (
            <div
              key={art.id}
              className="p-2 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-zinc-200/90 dark:border-zinc-800/80 transition-all flex flex-col gap-1 group"
            >
              <div className="flex items-start justify-between gap-2">
                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-purple-600 dark:hover:text-purple-300 transition-colors line-clamp-1"
                >
                  {art.title}
                </a>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSaveToResources(art)}
                    disabled={isSaved}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isSaved
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'text-zinc-500 hover:text-amber-600 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                    title={isSaved ? 'Enregistré dans Ressources' : 'Sauvegarder dans Ressources'}
                  >
                    {isSaved ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                  </button>
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="truncate max-w-[150px]">{art.source}</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-medium">
                  {art.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-zinc-500 pt-1 text-center border-t border-zinc-800/60">
        Cliquez sur l'icône marque-page pour alimenter vos <Link href="/notes" className="text-purple-400 hover:underline">Ressources</Link>
      </div>
    </div>
  );
};

export default RssFeedWidget;
