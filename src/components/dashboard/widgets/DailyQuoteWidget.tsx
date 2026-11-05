'use client';

import React, { useState } from 'react';
import { Quote, RefreshCw, Copy, Check, BookmarkPlus, Sparkles } from 'lucide-react';
import { WidgetSize } from '@/types/dashboard';
import { useData } from '@/context/DataContext';

const QUOTES = [
  {
    text: "Un petit progrès chaque jour mène de grands résultats.",
    author: "James Clear",
    tag: "Habitudes & Répétition",
    question: "Quelle est la micro-action que vous pouvez accomplir aujourd'hui sans effort ?",
  },
  {
    text: "La simplicité est la sophistication suprême.",
    author: "Léonard de Vinci",
    tag: "Design & Clarté",
    question: "Que pouvez-vous retirer de votre to-do list pour vous concentrer sur l'essentiel ?",
  },
  {
    text: "L'esprit n'est pas un vase à remplir, mais un feu à allumer.",
    author: "Plutarque",
    tag: "Apprentissage & Curiosité",
    question: "Quel sujet mériterait 20 minutes de curiosité désintéressée aujourd'hui ?",
  },
  {
    text: "Ce que nous faisons aujourd'hui façonne ce que nous serons demain.",
    author: "Marc Aurèle",
    tag: "Stoïcisme & Action",
    question: "Vos choix des 2 dernières heures reflètent-ils vos priorités profondes ?",
  },
  {
    text: "Le chaos enfante l'ordre quand la vision est claire.",
    author: "Syntropy Philosophy",
    tag: "Vision & Organisation",
    question: "Où pouvez-vous insuffler un peu d'ordre et de structure dans vos projets ?",
  },
];

interface DailyQuoteWidgetProps {
  size?: WidgetSize;
  isEditing?: boolean;
}

export const DailyQuoteWidget: React.FC<DailyQuoteWidgetProps> = ({ size = 'medium', isEditing }) => {
  const { addNote } = useData();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    setCopied(false);
    setSaved(false);
  };

  const current = QUOTES[quoteIndex];

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`"${current.text}" — ${current.author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToNotes = async () => {
    await addNote({
      title: `[Citation] ${current.author}`,
      content: `> "${current.text}"\n\n— **${current.author}**\n\nThème : *${current.tag}*\nQuestion de réflexion : *${current.question}*`,
      category: 'resource',
      tags: ['Citation', 'Inspiration', 'Philosophie'],
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ==========================================
  // VUE 1 : FORMAT SMALL (1x1) - COMPACT QUOTE
  // ==========================================
  if (size === 'small') {
    return (
      <div className="relative flex flex-col h-full justify-between p-3 select-none overflow-hidden rounded-2xl group">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 truncate">
            <Quote className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span className="truncate">Inspiration</span>
          </span>
          <button
            type="button"
            onClick={nextQuote}
            className="p-1 rounded text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer"
            title="Autre citation"
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="my-auto text-center px-1">
          <p className="text-xs font-serif italic text-zinc-800 dark:text-zinc-200 line-clamp-3 leading-snug">
            “{current.text}”
          </p>
          <div className="mt-1 text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold truncate">
            — {current.author}
          </div>
        </div>

        <div className="flex justify-center gap-1">
          {QUOTES.map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full ${i === quoteIndex ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 2 : FORMAT LARGE / FULL (2x2 ou 4x1) - REFLECTION STUDIO
  // ==========================================
  if (size === 'large' || size === 'full') {
    return (
      <div className="relative flex flex-col h-full justify-between p-4 select-none overflow-hidden rounded-2xl group gap-3">
        {/* Fond atmosphérique */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-white dark:via-zinc-950 dark:to-purple-950/20 -z-10" />

        {/* En-tête large */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Pensée du Jour & Réflexion</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  {current.tag}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">Pour nourrir votre concentration et perspective</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Copier la citation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleSaveToNotes}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Enregistrer dans les notes Syntropy"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={nextQuote}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Changer</span>
            </button>
          </div>
        </div>

        {/* Corps central : Citation stylisée */}
        <div className="my-auto py-2 flex flex-col items-center justify-center text-center max-w-xl mx-auto">
          <span className="text-4xl text-purple-500/30 font-serif leading-none mb-1">“</span>
          <p className="text-base sm:text-lg font-serif italic text-zinc-900 dark:text-zinc-100 leading-relaxed drop-shadow-xs">
            {current.text}
          </p>
          <div className="mt-2 text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">
            — {current.author}
          </div>
        </div>

        {/* Question de réflexion introspective */}
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Piste de réflexion pour aujourd&apos;hui
            </div>
            <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-0.5 font-medium">
              {current.question}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMAT MEDIUM (2x1) - ATMOSPHERIC CARD
  // ==========================================
  return (
    <div className="relative flex flex-col h-full justify-between p-4 overflow-hidden rounded-2xl select-none group">
      {/* Fond en dégradé atmosphérique adapté au mode clair et sombre */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-50/80 via-white to-purple-50/40 dark:from-zinc-950 dark:via-purple-950/40 dark:to-indigo-950/30 -z-10" />
      <div
        className="absolute inset-0 opacity-20 -z-10 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.25) 0%, rgba(15, 23, 42, 0.4) 70%)',
        }}
      />

      {/* Silhouette de montagnes stylisée en SVG en bas */}
      <svg
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 right-0 w-full h-16 opacity-20 dark:opacity-30 text-purple-400 dark:text-purple-900 fill-current -z-10"
      >
        <path d="M0,100 L0,70 L60,40 L120,65 L180,30 L250,75 L320,35 L400,60 L400,100 Z" />
      </svg>

      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Quote className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Citation du jour</span>
        </span>
        <div className="flex items-center gap-2">
          {isEditing && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono border border-purple-500/40">
              Taille personnalisée
            </span>
          )}
          <button
            type="button"
            onClick={nextQuote}
            className="p-1 rounded-md text-zinc-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/10 transition-colors cursor-pointer"
            title="Autre citation"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Corps de la citation */}
      <div className="my-auto py-2 text-center flex flex-col items-center justify-center">
        <span className="text-3xl text-purple-500/40 dark:text-purple-400/40 font-serif leading-none mb-1 select-none">
          “
        </span>
        <p className="text-sm sm:text-base font-serif italic text-zinc-900 dark:text-zinc-100 max-w-md leading-relaxed drop-shadow-xs">
          {current.text}
        </p>
        <div className="mt-2 text-xs font-mono text-purple-700 dark:text-purple-300/80 font-medium">
          — {current.author}
        </div>
      </div>

      {/* Petit indicateur de pagination */}
      <div className="flex items-center justify-center gap-1">
        {QUOTES.map((_, i) => (
          <span
            key={i}
            className={`w-1 h-1 rounded-full transition-all ${
              i === quoteIndex
                ? 'w-4 bg-purple-600 dark:bg-purple-400'
                : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default DailyQuoteWidget;
