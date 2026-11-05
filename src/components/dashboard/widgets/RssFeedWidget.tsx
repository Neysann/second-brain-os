'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Rss, ExternalLink, BookmarkPlus, Check, Search, Sparkles } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { WidgetSize } from '@/types/dashboard';

interface ArticleItem {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  category: string;
  readTime: string;
}

const DEFAULT_ARTICLES: ArticleItem[] = [
  {
    id: 'art-1',
    title: 'Building Second Brains: How AI Augmented Workflows Redefine Knowledge',
    source: 'Dev.to / AI Digest',
    date: 'Aujourd\'hui',
    url: 'https://dev.to',
    category: 'IA & Outils',
    readTime: '4 min',
  },
  {
    id: 'art-2',
    title: 'Next.js 16 App Router Performance Patterns and SSG Best Practices',
    source: 'HackerNews',
    date: 'Hier',
    url: 'https://news.ycombinator.com',
    category: 'Architecture',
    readTime: '6 min',
  },
  {
    id: 'art-3',
    title: 'Minimalist UX Design: The Rise of Dark Mode & Glassmorphic Dashboards',
    source: 'Design Weekly',
    date: 'Il y a 2j',
    url: 'https://uiverse.io',
    category: 'Design',
    readTime: '3 min',
  },
  {
    id: 'art-4',
    title: 'Local First Software: Why Sync Engines Are Replacing Traditional Backends',
    source: 'TechCrunch Dev',
    date: 'Il y a 3j',
    url: 'https://techcrunch.com',
    category: 'Local First',
    readTime: '5 min',
  },
];

interface RssFeedWidgetProps {
  size?: WidgetSize;
}

export const RssFeedWidget: React.FC<RssFeedWidgetProps> = ({ size = 'medium' }) => {
  const { addNote } = useData();
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleSaveToResources = async (art: ArticleItem) => {
    await addNote({
      title: `[Veille] ${art.title}`,
      content: `# ${art.title}\n\nSource : **${art.source}**\nLien : ${art.url}\n\n---\n*Ressource enregistrée automatiquement depuis le widget Veille Syntropy.*`,
      category: 'resource',
      tags: ['Veille', art.category, 'RSS'],
    });
    setSavedArticles((prev) => new Set([...prev, art.id]));
  };

  // ==========================================
  // VUE 1 : FORMAT SMALL (1x1) - COMPACT TICKER
  // ==========================================
  if (size === 'small') {
    const topArt = DEFAULT_ARTICLES[0];
    const isSaved = savedArticles.has(topArt.id);

    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 truncate">
            <Rss className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="truncate">Veille</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {topArt.category}
          </span>
        </div>

        <div className="my-auto p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
          <a
            href={topArt.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-amber-600 line-clamp-2"
          >
            {topArt.title}
          </a>
          <div className="text-[9px] text-zinc-400 font-mono mt-1 flex justify-between items-center">
            <span>{topArt.source}</span>
            <span>{topArt.readTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
          <a
            href={topArt.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-600 flex items-center gap-0.5"
          >
            <span>Lire</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <button
            type="button"
            onClick={() => handleSaveToResources(topArt)}
            className="text-amber-600 dark:text-amber-400 font-medium hover:underline cursor-pointer flex items-center gap-0.5"
          >
            {isSaved ? <Check className="w-3 h-3 text-emerald-500" /> : <BookmarkPlus className="w-3 h-3" />}
            <span>{isSaved ? 'Sauvé' : 'Sauver'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 2 : FORMAT LARGE / FULL (2x2 ou 4x1) - RSS READER
  // ==========================================
  if (size === 'large' || size === 'full') {
    const categories = ['all', ...Array.from(new Set(DEFAULT_ARTICLES.map((a) => a.category)))];
    const filtered = DEFAULT_ARTICLES.filter((a) => {
      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      const matchSearch = search ? a.title.toLowerCase().includes(search.toLowerCase()) : true;
      return matchCat && matchSearch;
    });

    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none gap-3">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Rss className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Agrégateur de Veille Technologique</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {DEFAULT_ARTICLES.length} flux
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">Enregistrez en un clic dans vos Ressources Second Brain</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrer les articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-6 pr-2 py-1 text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none w-32 sm:w-44"
              />
            </div>
            <Link
              href="/resources"
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
            >
              <span>Ressources</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Onglets catégories */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {cat === 'all' ? 'Tous les flux' : cat}
            </button>
          ))}
        </div>

        {/* Grille d'articles */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[220px] scrollbar-thin pr-1">
          {filtered.map((art) => {
            const isSaved = savedArticles.has(art.id);
            return (
              <div
                key={art.id}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:border-amber-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mb-1">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{art.category}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-amber-500 line-clamp-2"
                  >
                    {art.title}
                  </a>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[10px]">
                  <span className="text-zinc-400 font-mono">{art.source}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveToResources(art)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {isSaved ? <Check className="w-2.5 h-2.5" /> : <BookmarkPlus className="w-2.5 h-2.5" />}
                      <span>{isSaved ? 'Enregistré' : 'Sauvegarder'}</span>
                    </button>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMAT MEDIUM (2x1) - STANDARD LIST
  // ==========================================
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
        <span className="flex items-center gap-1.5">
          <Rss className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Flux RSS / Veille</span>
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">3 sources actives</span>
      </div>

      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
        {DEFAULT_ARTICLES.slice(0, 3).map((art) => {
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
                  className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-amber-500 transition-colors line-clamp-1 flex-1"
                >
                  {art.title}
                </a>
                <button
                  type="button"
                  onClick={() => handleSaveToResources(art)}
                  className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
                    isSaved
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title={isSaved ? 'Déjà enregistré dans vos Ressources' : 'Sauvegarder dans mes Ressources'}
                >
                  {isSaved ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span className="truncate max-w-[140px]">{art.source}</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{art.category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RssFeedWidget;
