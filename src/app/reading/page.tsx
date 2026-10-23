'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  X,
  Flame,
  Target,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  CheckCircle2,
  Loader2,
  Library,
  Check,
  BookMarked,
  Ban,
  Pencil,
} from 'lucide-react';
import { useReading, toDateKey } from '@/context/ReadingContext';
import { useTheme } from '@/context/ThemeContext';
import { Book, BookKind, BookSearchResult, BookStatus, ProgressUnit } from '@/types/reading';
import { searchBooks } from '@/lib/bookSearch';

const STATUS_META: Record<BookStatus, { label: string; chip: string }> = {
  to_read: { label: 'À lire', chip: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
  reading: { label: 'En cours', chip: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  done: { label: 'Terminé', chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  dropped: { label: 'Abandonné', chip: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const percentOf = (b: Book): number => {
  if (b.unit === 'percent') return Math.min(100, Math.round(b.progress));
  if (b.totalPages > 0) return Math.min(100, Math.round((b.progress / b.totalPages) * 100));
  return 0;
};

const progressLabel = (b: Book): string => {
  if (b.unit === 'percent') return `${Math.round(b.progress)} %`;
  const prefix = b.unit === 'chapters' ? 'ch.' : 'p.';
  return b.totalPages > 0 ? `${prefix} ${b.progress} / ${b.totalPages}` : `${prefix} ${b.progress}`;
};

const KIND_LABEL: Record<BookKind, string> = { book: 'Livre', manga: 'Manga / BD', novel: 'Roman web' };

function Cover({ book, className = '' }: { book: Pick<Book, 'title' | 'coverUrl' | 'kind'>; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (book.coverUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.coverUrl}
        alt={book.title}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-zinc-800 text-zinc-300 ${className}`}
    >
      <span className="text-3xl select-none">{book.kind === 'manga' ? '📚' : book.kind === 'novel' ? '📜' : '📖'}</span>
    </div>
  );
}

export default function ReadingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    books,
    dayLog,
    yearlyGoal,
    setYearlyGoal,
    currentStreak,
    bestStreak,
    readToday,
    deleteBook,
    setStatus,
    logProgress,
  } = useReading();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<BookKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(yearlyGoal));
  const [logInputs, setLogInputs] = useState<Record<string, string>>({});

  const card = isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const inputCls = isDark
    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
    : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400';

  const year = new Date().getFullYear();

  const doneThisYear = useMemo(
    () => books.filter((b) => b.status === 'done' && b.finishedAt && new Date(b.finishedAt).getFullYear() === year),
    [books, year]
  );

  const perMonth = useMemo(() => {
    const arr = new Array(12).fill(0);
    doneThisYear.forEach((b) => (arr[new Date(b.finishedAt!).getMonth()] += 1));
    return arr;
  }, [doneThisYear]);
  const maxMonth = Math.max(1, ...perMonth);

  const pagesThisYear = useMemo(
    () =>
      Object.entries(dayLog)
        .filter(([k]) => k.startsWith(`${year}-`))
        .reduce((sum, [, v]) => sum + v.pages, 0),
    [dayLog, year]
  );
  const pagesToday = dayLog[toDateKey(new Date())]?.pages || 0;
  const goalPercent = Math.min(100, Math.round((doneThisYear.length / yearlyGoal) * 100));

  // Dernière semaine pour le streak
  const lastDays = useMemo(() => {
    const out: { key: string; label: string; active: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      out.push({
        key,
        label: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }),
        active: (dayLog[key]?.entries || 0) > 0,
      });
    }
    return out;
  }, [dayLog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (kindFilter !== 'all' && b.kind !== kindFilter) return false;
      if (q && !`${b.title} ${b.author}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [books, statusFilter, kindFilter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: books.length, to_read: 0, reading: 0, done: 0, dropped: 0 };
    books.forEach((b) => (c[b.status] += 1));
    return c;
  }, [books]);

  const handleLog = (b: Book) => {
    const n = Number(logInputs[b.id]);
    if (!n || n <= 0) return;
    logProgress(b.id, n);
    setLogInputs((p) => ({ ...p, [b.id]: '' }));
  };

  const renderLogger = (b: Book) =>
    b.status === 'reading' || b.status === 'to_read' ? (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          value={logInputs[b.id] || ''}
          onChange={(e) => setLogInputs((p) => ({ ...p, [b.id]: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleLog(b)}
          placeholder={b.unit === 'percent' ? '+ %' : b.unit === 'chapters' ? '+ chapitres' : '+ pages'}
          aria-label={`Pages lues aujourd'hui pour ${b.title}`}
          className={`w-full min-w-0 px-2 py-1 rounded-lg border text-xs outline-none focus:border-indigo-500 ${inputCls}`}
        />
        <button
          onClick={() => handleLog(b)}
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
          aria-label="Enregistrer la lecture"
          title="Enregistrer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    ) : null;

  const statusButtons = (b: Book) => (
    <div className="flex items-center gap-1">
      {b.status !== 'reading' && b.status !== 'done' && (
        <button
          onClick={() => setStatus(b.id, 'reading')}
          title="Commencer"
          className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/15 cursor-pointer"
        >
          <BookMarked className="w-4 h-4" />
        </button>
      )}
      {b.status !== 'done' && (
        <button
          onClick={() => setStatus(b.id, 'done')}
          title="Marquer comme terminé"
          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      )}
      {b.status === 'reading' && (
        <button
          onClick={() => setStatus(b.id, 'dropped')}
          title="Abandonner"
          className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/15 cursor-pointer"
        >
          <Ban className="w-4 h-4" />
        </button>
      )}
      {(b.status === 'done' || b.status === 'dropped') && (
        <button
          onClick={() => setStatus(b.id, 'reading')}
          title="Reprendre"
          className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/15 cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={() => confirm(`Supprimer « ${b.title} » ?`) && deleteBook(b.id)}
        title="Supprimer"
        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Library className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Lectures</h1>
            <p className={`text-xs ${muted}`}>Livres &amp; manga — ta bibliothèque, ta progression, ta régularité.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Ajouter une lecture
        </button>
      </div>

      {/* Tableau de bord */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak */}
        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Flame className={`w-4 h-4 ${readToday ? 'text-orange-400' : 'text-zinc-500'}`} /> Streak de lecture
            </div>
            <span className={`text-[11px] ${muted}`}>Record : {bestStreak} j</span>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-black">{currentStreak}</span>
            <span className={`pb-1 text-sm ${muted}`}>jour{currentStreak > 1 ? 's' : ''} d&apos;affilée</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-1">
            {lastDays.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-full h-6 rounded-md ${
                    d.active ? 'bg-gradient-to-t from-orange-500 to-amber-400' : isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}
                />
                <span className={`text-[10px] uppercase ${muted}`}>{d.label}</span>
              </div>
            ))}
          </div>
          <p className={`mt-2 text-[11px] ${readToday ? 'text-emerald-400' : muted}`}>
            {readToday ? `✔ Lu aujourd'hui : ${pagesToday} page${pagesToday > 1 ? 's' : ''}` : "Pas encore lu aujourd'hui — enregistre quelques pages !"}
          </p>
        </div>

        {/* Objectif annuel */}
        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="w-4 h-4 text-indigo-400" /> Objectif {year}
            </div>
            {editingGoal ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className={`w-16 px-2 py-0.5 rounded-md border text-xs outline-none ${inputCls}`}
                  aria-label="Objectif annuel de livres"
                />
                <button
                  onClick={() => {
                    setYearlyGoal(Number(goalInput));
                    setEditingGoal(false);
                  }}
                  className="p-1 rounded-md bg-emerald-600 text-white cursor-pointer"
                  aria-label="Valider l'objectif"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setGoalInput(String(yearlyGoal));
                  setEditingGoal(true);
                }}
                className={`p-1 rounded-md hover:bg-zinc-500/15 cursor-pointer ${muted}`}
                aria-label="Modifier l'objectif"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-black">{doneThisYear.length}</span>
            <span className={`pb-1 text-sm ${muted}`}>/ {yearlyGoal} livres</span>
          </div>
          <div className={`mt-3 h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <p className={`mt-2 text-[11px] ${muted}`}>
            {goalPercent}% atteint · {pagesThisYear} pages enregistrées cette année
          </p>
        </div>

        {/* Livres par mois */}
        <div className={`rounded-2xl border p-4 ${card}`}>
          <div className="text-sm font-semibold">Livres terminés par mois</div>
          <div className="mt-3 flex items-end justify-between gap-1 h-24">
            {perMonth.map((n, i) => (
              <div key={MONTHS[i]} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <span className={`text-[10px] ${n > 0 ? '' : 'opacity-0'}`}>{n}</span>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    n > 0 ? 'bg-gradient-to-t from-indigo-600 to-purple-500' : isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}
                  style={{ height: n > 0 ? `${Math.max(12, (n / maxMonth) * 70)}%` : '6%' }}
                />
                <span className={`text-[9px] ${muted}`}>{MONTHS[i].charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un titre ou un auteur…"
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:border-indigo-500 ${inputCls}`}
          />
        </div>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as BookKind | 'all')}
          aria-label="Filtrer par type"
          className={`px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer ${inputCls}`}
        >
          <option value="all">Livres &amp; manga</option>
          <option value="book">Livres</option>
          <option value="manga">Manga / BD</option>
          <option value="novel">Romans web</option>
        </select>
        <div className={`flex rounded-xl border overflow-hidden ${card}`}>
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={v === 'grid' ? 'Vue grille' : 'Vue liste'}
              className={`p-2.5 cursor-pointer transition-colors ${
                view === v ? 'bg-indigo-600 text-white' : muted
              }`}
            >
              {v === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Onglets de statut */}
      <div className="flex flex-wrap gap-2">
        {([['all', 'Tout'], ['reading', 'En cours'], ['to_read', 'À lire'], ['done', 'Terminés'], ['dropped', 'Abandonnés']] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                statusFilter === key
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                  : `${card} ${muted} hover:border-indigo-500/50`
              }`}
            >
              {label} <span className="opacity-70">{counts[key]}</span>
            </button>
          )
        )}
      </div>

      {/* Contenu */}
      {filtered.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-12 text-center ${card}`}>
          <Library className="w-10 h-10 mx-auto text-indigo-400/60" />
          <p className="mt-3 font-semibold">{books.length === 0 ? 'Ta bibliothèque est vide' : 'Aucun résultat'}</p>
          <p className={`text-sm ${muted}`}>
            {books.length === 0
              ? 'Ajoute ta première lecture pour démarrer ton suivi et ton streak.'
              : 'Essaie un autre filtre ou une autre recherche.'}
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              className={`group rounded-2xl border overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/10 hover:border-indigo-500/40 ${card}`}
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                <Cover book={b} className="w-full h-full" />
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur ${STATUS_META[b.status].chip}`}
                >
                  {STATUS_META[b.status].label}
                </span>
                {b.kind === 'manga' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white">
                    漫
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-tight line-clamp-2" title={b.title}>
                    {b.title}
                  </div>
                  <div className={`text-xs truncate ${muted}`}>{b.author || 'Auteur inconnu'}</div>
                </div>
                <div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${percentOf(b)}%` }}
                    />
                  </div>
                  <div className={`mt-1 flex justify-between text-[10px] ${muted}`}>
                    <span>{progressLabel(b)}</span>
                    {(b.unit === 'percent' || b.totalPages > 0) && <span>{percentOf(b)}%</span>}
                  </div>
                </div>
                {renderLogger(b)}
                <div className="mt-auto flex justify-end">{statusButtons(b)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <div key={b.id} className={`rounded-2xl border p-3 flex items-center gap-3 flex-wrap md:flex-nowrap ${card}`}>
              <Cover book={b} className="w-12 h-[72px] rounded-lg flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{b.title}</div>
                <div className={`text-xs truncate ${muted}`}>
                  {b.author || 'Auteur inconnu'} · {KIND_LABEL[b.kind]}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_META[b.status].chip}`}>
                {STATUS_META[b.status].label}
              </span>
              <div className="w-full md:w-48">
                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${percentOf(b)}%` }}
                  />
                </div>
                <div className={`mt-1 text-[10px] ${muted}`}>{progressLabel(b)}</div>
              </div>
              <div className="w-full md:w-36">{renderLogger(b)}</div>
              {statusButtons(b)}
            </div>
          ))}
        </div>
      )}

      {isAddOpen && <AddBookModal onClose={() => setIsAddOpen(false)} />}
    </div>
  );
}

function AddBookModal({ onClose }: { onClose: () => void }) {
  const { addBook } = useReading();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [kind, setKind] = useState<BookKind>('book');
  const [unit, setUnit] = useState<ProgressUnit>('pages');
  const [totalPages, setTotalPages] = useState('');
  const [status, setStatusValue] = useState<BookStatus>('reading');

  const inputCls = isDark
    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
    : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Recherche avec debounce
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchBooks(query, kind);
      setResults(r);
      setSearched(true);
      setSearching(false);
    }, 450);
    return () => clearTimeout(t);
  }, [query, kind]);

  const changeKind = (k: BookKind) => {
    setKind(k);
    if (k === 'novel') setUnit('chapters');
    else if (unit === 'chapters') setUnit('pages');
  };

  const pick = (r: BookSearchResult) => {
    setTitle(r.title);
    setAuthor(r.author);
    setCoverUrl(r.coverUrl);
    if (r.totalPages > 0) {
      setTotalPages(String(r.totalPages));
      setUnit(r.source === 'jikan' ? 'chapters' : 'pages');
    }
    setResults([]);
    setQuery('');
    setSearched(false);
  };

  const submit = () => {
    if (!title.trim()) return;
    const total = unit === 'percent' ? 0 : Math.max(0, Number(totalPages) || 0);
    const now = new Date().toISOString();
    addBook({
      title: title.trim(),
      author: author.trim(),
      kind,
      coverUrl,
      status,
      unit,
      totalPages: total,
      progress: status === 'done' ? (unit === 'percent' ? 100 : total) : 0,
      startedAt: status === 'reading' || status === 'done' ? now : undefined,
      finishedAt: status === 'done' ? now : undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label="Ajouter une lecture"
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 space-y-4 ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Ajouter une lecture</h2>
          <button onClick={onClose} aria-label="Fermer" className={`p-1.5 rounded-lg hover:bg-zinc-500/15 cursor-pointer ${muted}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recherche API */}
        <div>
          <label className={`text-xs font-semibold ${muted}`}>Rechercher en ligne (Google Books / OpenLibrary)</label>
          <div className="relative mt-1">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titre, auteur, ISBN…"
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm outline-none focus:border-indigo-500 ${inputCls}`}
            />
            {searching && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-400" />}
          </div>
          {results.length > 0 && (
            <div className={`mt-2 rounded-xl border max-h-60 overflow-y-auto divide-y ${isDark ? 'border-zinc-800 divide-zinc-800' : 'border-zinc-200 divide-zinc-200'}`}>
              {results.map((r, i) => (
                <button
                  key={`${r.title}-${i}`}
                  onClick={() => pick(r)}
                  className="w-full flex items-center gap-3 p-2 text-left hover:bg-indigo-500/10 cursor-pointer"
                >
                  <Cover book={{ title: r.title, coverUrl: r.coverUrl, kind: 'book' }} className="w-9 h-14 rounded-md flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{r.title}</div>
                    <div className={`text-xs truncate ${muted}`}>
                      {r.author || 'Auteur inconnu'}
                      {r.totalPages > 0 ? ` · ${r.totalPages} p.` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {kind === 'novel' && (
            <p className={`mt-2 text-[11px] ${muted}`}>
              Catalogue MyAnimeList (light novels &amp; romans). Ton roman est introuvable ? Ouvre{' '}
              <a
                href="https://world-novel.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline"
              >
                world-novel.fr
              </a>
              , puis colle ici le titre et l&apos;URL de la couverture.
            </p>
          )}
          {searched && !searching && results.length === 0 && (
            <p className={`mt-2 text-xs ${muted}`}>Aucun résultat — saisis les infos manuellement ci-dessous.</p>
          )}
        </div>

        <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`} />

        {/* Formulaire */}
        <div className="flex gap-3">
          {(title || coverUrl) && (
            <Cover book={{ title, coverUrl, kind }} className="w-16 h-24 rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre *"
              aria-label="Titre"
              className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-indigo-500 ${inputCls}`}
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Auteur"
              aria-label="Auteur"
              className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-indigo-500 ${inputCls}`}
            />
          </div>
        </div>

        <input
          value={coverUrl || ''}
          onChange={(e) => setCoverUrl(e.target.value || undefined)}
          placeholder="URL de la couverture (optionnel)"
          aria-label="URL de la couverture"
          className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-indigo-500 ${inputCls}`}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-xs font-semibold ${muted}`}>Type</label>
            <select
              value={kind}
              onChange={(e) => changeKind(e.target.value as BookKind)}
              className={`w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer ${inputCls}`}
            >
              <option value="book">Livre</option>
              <option value="manga">Manga / BD</option>
              <option value="novel">Roman web</option>
            </select>
          </div>
          <div>
            <label className={`text-xs font-semibold ${muted}`}>Statut</label>
            <select
              value={status}
              onChange={(e) => setStatusValue(e.target.value as BookStatus)}
              className={`w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer ${inputCls}`}
            >
              <option value="reading">En cours</option>
              <option value="to_read">À lire</option>
              <option value="done">Terminé</option>
              <option value="dropped">Abandonné</option>
            </select>
          </div>
          <div>
            <label className={`text-xs font-semibold ${muted}`}>Suivi de progression</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProgressUnit)}
              className={`w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none cursor-pointer ${inputCls}`}
            >
              <option value="pages">En pages</option>
              <option value="chapters">En chapitres</option>
              <option value="percent">En pourcentage</option>
            </select>
          </div>
          {unit !== 'percent' && (
            <div>
              <label className={`text-xs font-semibold ${muted}`}>
                {unit === 'chapters' ? 'Nombre de chapitres' : 'Nombre de pages'}
              </label>
              <input
                type="number"
                min={0}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="Inconnu"
                className={`w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none focus:border-indigo-500 ${inputCls}`}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-500/15 cursor-pointer ${muted}`}>
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
