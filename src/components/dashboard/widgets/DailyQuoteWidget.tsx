'use client';

import React, { useState } from 'react';
import { Quote, RefreshCw } from 'lucide-react';

const QUOTES = [
  {
    text: "Un petit progrès chaque jour mène de grands résultats.",
    author: "James Clear",
  },
  {
    text: "La simplicité est la sophistication suprême.",
    author: "Léonard de Vinci",
  },
  {
    text: "L'esprit n'est pas un vase à remplir, mais un feu à allumer.",
    author: "Plutarque",
  },
  {
    text: "Ce que nous faisons aujourd'hui façonne ce que nous serons demain.",
    author: "Marc Aurèle",
  },
  {
    text: "Le chaos enfante l'ordre quand la vision est claire.",
    author: "Syntropy Philosophy",
  },
];

export const DailyQuoteWidget: React.FC<{ isEditing?: boolean }> = ({ isEditing }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  const current = QUOTES[quoteIndex];

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
              i === quoteIndex ? 'w-3 bg-purple-600 dark:bg-purple-400' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default DailyQuoteWidget;
