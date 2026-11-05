'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Newspaper,
  Flame,
  ExternalLink,
  RefreshCw,
  Search,
  Clock,
  Sparkles,
  Globe,
  Cpu,
  Atom,
  TrendingUp,
} from 'lucide-react';
import { WidgetSize } from '@/types/dashboard';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: 'tech' | 'science' | 'general' | 'business';
  snippet?: string;
  thumbnail?: string;
}

interface NewsWidgetProps {
  size?: WidgetSize;
}

type NewsCategory = 'all' | 'tech' | 'science' | 'general' | 'business';

const FEEDS_CONFIG: {
  url: string;
  source: string;
  category: 'tech' | 'science' | 'general' | 'business';
}[] = [
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', category: 'tech' },
  { url: 'https://news.ycombinator.com/rss', source: 'Hacker News', category: 'tech' },
  { url: 'https://www.frandroid.com/feed', source: 'Frandroid', category: 'tech' },
  { url: 'https://www.futura-sciences.com/rss/actualites.xml', source: 'Futura', category: 'science' },
  { url: 'https://www.francetvinfo.fr/titres.rss', source: 'Franceinfo', category: 'general' },
  { url: 'https://www.lemonde.fr/rss/une.xml', source: 'Le Monde', category: 'general' },
  { url: 'https://services.lesechos.fr/rss/les-echos-tech-medias.xml', source: 'Les Echos', category: 'business' },
];

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'fb-1',
    title: 'Nouveaux modèles de raisonnement IA disponibles en production',
    link: 'https://news.ycombinator.com',
    pubDate: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    source: 'TechPulse',
    category: 'tech',
    snippet: 'Les architectures multimodales et d’inférence rapide transforment les flux de travail des assistants personnels.',
  },
  {
    id: 'fb-2',
    title: 'Web standard 2026 : adoption massive du rendu sans hydratation et PWA',
    link: 'https://www.theverge.com',
    pubDate: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    source: 'The Verge',
    category: 'tech',
    snippet: 'La navigation réactive à 0ms de latence s’impose sur les applications de productivité de nouvelle génération.',
  },
  {
    id: 'fb-3',
    title: 'Exploration spatiale : nouvelles analyses atmosphériques par James Webb',
    link: 'https://www.futura-sciences.com',
    pubDate: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    source: 'Futura Sciences',
    category: 'science',
    snippet: 'Des bio-signatures potentielles analysées avec une précision spectroscopique inédite.',
  },
  {
    id: 'fb-4',
    title: 'Productivité & Souveraineté : essor des systèmes locaux et du Markdown',
    link: 'https://www.lemonde.fr',
    pubDate: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    source: 'Le Monde Tech',
    category: 'business',
    snippet: 'Les professionnels se tournent vers des Second Brains souverains garantissant l’indépendance de leurs données.',
  },
];

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Récemment';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j`;
  } catch {
    return 'Récemment';
  }
}

export const NewsWidget: React.FC<NewsWidgetProps> = ({ size = 'medium' }) => {
  const [items, setItems] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Charger depuis le cache local au montage
  useEffect(() => {
    try {
      const cached = localStorage.getItem('syntropy_news_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (_) {}
  }, []);

  const fetchFeed = async (feed: typeof FEEDS_CONFIG[0]): Promise<NewsItem[]> => {
    try {
      const electronAPI = (window as unknown as { electronAPI?: { fetchUrl?: (url: string) => Promise<{ success: boolean; data: string }> } })?.electronAPI;

      let xmlText = '';
      if (electronAPI?.fetchUrl) {
        // En desktop natif : contournement transparent du CORS via Electron
        const res = await electronAPI.fetchUrl(feed.url);
        if (res.success && res.data) {
          xmlText = res.data;
        }
      }

      if (!xmlText) {
        // En mode Web : passage via le proxy rss2json public fiable
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
        const res = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok' && Array.isArray(json.items)) {
            return json.items.slice(0, 6).map((entry: any, idx: number) => ({
              id: `${feed.source}-${entry.guid || idx}-${Date.now()}`,
              title: entry.title ? entry.title.replace(/<[^>]*>/g, '').trim() : 'Actualité sans titre',
              link: entry.link || '#',
              pubDate: entry.pubDate || new Date().toISOString(),
              source: feed.source,
              category: feed.category,
              snippet: entry.description ? entry.description.replace(/<[^>]*>/g, '').slice(0, 140).trim() + '...' : undefined,
              thumbnail: entry.thumbnail || entry.enclosure?.link,
            }));
          }
        }
      } else {
        // Parseur XML natif pour Electron
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const entryNodes = doc.querySelectorAll('item, entry');
        const parsedList: NewsItem[] = [];

        entryNodes.forEach((node, idx) => {
          if (idx >= 6) return;
          const title = node.querySelector('title')?.textContent || '';
          const link = node.querySelector('link')?.textContent || node.querySelector('link')?.getAttribute('href') || '#';
          const pubDate = node.querySelector('pubDate, updated, published')?.textContent || new Date().toISOString();
          const desc = node.querySelector('description, summary, content')?.textContent || '';
          const cleanDesc = desc ? desc.replace(/<[^>]*>/g, '').slice(0, 140).trim() + '...' : undefined;

          if (title) {
            parsedList.push({
              id: `${feed.source}-${idx}-${title.slice(0, 10)}`,
              title: title.trim(),
              link,
              pubDate,
              source: feed.source,
              category: feed.category,
              snippet: cleanDesc,
            });
          }
        });

        if (parsedList.length > 0) return parsedList;
      }
    } catch (_) {}

    return [];
  };

  const refreshNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = FEEDS_CONFIG.map((feed) => fetchFeed(feed));
      const results = await Promise.allSettled(promises);
      const collected: NewsItem[] = [];

      results.forEach((res) => {
        if (res.status === 'fulfilled' && res.value.length > 0) {
          collected.push(...res.value);
        }
      });

      if (collected.length > 0) {
        // Trier par date la plus récente
        collected.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        setItems(collected);
        setLastUpdated(new Date());
        try {
          localStorage.setItem('syntropy_news_cache', JSON.stringify(collected.slice(0, 30)));
        } catch (_) {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Rafraîchir toutes les 30 minutes automatiquement
  useEffect(() => {
    refreshNews();
    const interval = setInterval(refreshNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshNews]);

  // Filtrage des articles
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const topItem = filteredItems[0] || items[0] || FALLBACK_NEWS[0];

  // =========================================================================
  // 1. AFFICHAGE SMALL (1x1) : La Une Phare & Métrique d'Actu
  // =========================================================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        {/* Header */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-blue-500" />
            <span>À la Une</span>
          </span>
          <button
            onClick={refreshNews}
            className={`p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${isLoading ? 'animate-spin' : ''}`}
            title="Rafraîchir les actualités"
          >
            <RefreshCw className="w-3 h-3 text-zinc-400" />
          </button>
        </div>

        {/* Article Phare */}
        <a
          href={topItem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-2.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Flame className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
            <span>{topItem.source}</span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-400 font-mono lowercase">{formatRelativeTime(topItem.pubDate)}</span>
          </div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-3 leading-snug group-hover:text-blue-500 transition-colors">
            {topItem.title}
          </h4>
          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold uppercase">
              {topItem.category}
            </span>
            <span className="flex items-center gap-0.5 text-blue-500 font-medium group-hover:translate-x-0.5 transition-transform">
              Lire <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        </a>

        {/* Footer métrique */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-0.5">
          <span>{filteredItems.length} dépêches</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live RSS
          </span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AFFICHAGE MEDIUM (2x1) : Flux Dépêches avec Filtres de Thèmes
  // =========================================================================
  if (size === 'medium') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none">
        {/* Header avec Catégories et Bouton Refresh */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold">Actualités en direct</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-rose-500/15 text-rose-500 font-semibold flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" /> Live
            </span>
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'tech', 'science', 'general'] as NewsCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat === 'all' ? 'Tout' : cat === 'tech' ? 'Tech' : cat === 'science' ? 'Sciences' : 'Général'}
              </button>
            ))}
            <button
              onClick={refreshNews}
              disabled={isLoading}
              className={`p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer ${isLoading ? 'animate-spin' : ''}`}
              title="Actualiser les flux"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Liste des articles défilables */}
        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[145px] pr-1 scrollbar-thin">
          {filteredItems.slice(0, 5).map((item) => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800/60 transition-all flex items-center justify-between gap-3 group cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mb-0.5 font-mono">
                  <span className="font-bold text-blue-500">{item.source}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(item.pubDate)}</span>
                </div>
                <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-blue-500 transition-colors">
                  {item.title}
                </h5>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-200 dark:border-zinc-800/60 font-mono mt-1">
          <span>Actualisé {formatRelativeTime(lastUpdated.toISOString())}</span>
          <span className="text-zinc-500">7 flux certifiés</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. AFFICHAGE LARGE & FULL (2x2 ou 4x1) : Portail d'Actu Complet
  // =========================================================================
  return (
    <div className="flex flex-col h-full p-4 select-none space-y-3">
      {/* Header avec Barre de Recherche & Thèmes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>Portail Actualités & Veille</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold flex items-center gap-1">
                <Flame className="w-2.5 h-2.5" /> En continu
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              Flux temps réel • {filteredItems.length} dépêches disponibles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une dépêche..."
              className="pl-7 pr-3 py-1 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500"
            />
          </div>

          <button
            onClick={refreshNews}
            disabled={isLoading}
            className={`p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer ${isLoading ? 'animate-spin' : ''}`}
            title="Actualiser les flux"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Barre de Catégories */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all' as NewsCategory, label: 'Toutes les actualités', icon: Sparkles },
          { id: 'tech' as NewsCategory, label: 'Tech & Intelligence Artificielle', icon: Cpu },
          { id: 'science' as NewsCategory, label: 'Sciences & Espace', icon: Atom },
          { id: 'general' as NewsCategory, label: 'France & Monde', icon: Globe },
          { id: 'business' as NewsCategory, label: 'Économie & Startups', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/60'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grille d'Articles Étendue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 overflow-y-auto max-h-[310px] pr-1 scrollbar-thin">
        {filteredItems.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-100/80 dark:hover:bg-zinc-850/60 transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 font-mono">
                <span className="font-bold text-blue-500">{item.source}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatRelativeTime(item.pubDate)}
                </span>
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors">
                {item.title}
              </h4>
              {item.snippet && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {item.snippet}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[10px]">
              <span className="px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold uppercase text-[9px]">
                {item.category}
              </span>
              <span className="flex items-center gap-1 text-blue-500 font-semibold group-hover:translate-x-0.5 transition-transform">
                Lire l'article complet <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsWidget;
