'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, RefreshCw, Smile } from 'lucide-react';

const MEMES = [
  {
    title: 'Quand ton code compile du premier coup',
    emoji: '🧙‍♂️✨',
    quote: '"Je ne sais pas pourquoi ça marche, mais ne touchez à rien."',
  },
  {
    title: 'Vendredi 17h : push en prod',
    emoji: '🚀🔥',
    quote: '"Le week-end sera calme... ou sur les chapeaux de roues."',
  },
  {
    title: 'Organiser sa vie avec Syntropy',
    emoji: '🧠⚡',
    quote: '"Le chaos se transforme en clarté absolue."',
  },
];

export const MemeWidget: React.FC = () => {
  const [index, setIndex] = useState(0);

  const nextMeme = () => {
    setIndex((prev) => (prev + 1) % MEMES.length);
  };

  const current = MEMES[index];

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
          <span>Meme / GIF du jour</span>
        </span>
        <button
          type="button"
          onClick={nextMeme}
          className="p-1 rounded-md text-zinc-500 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Autre dose d'humour"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Visuel & Texte */}
      <div className="my-auto text-center flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80">
        <span className="text-3xl mb-1 select-none">{current.emoji}</span>
        <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
          {current.title}
        </div>
        <p className="text-[10px] text-zinc-600 dark:text-zinc-400 italic mt-1 max-w-[180px]">
          {current.quote}
        </p>
      </div>

      <div className="text-[9px] text-zinc-500 font-mono text-center">
        Dose quotidienne d'énergie
      </div>
    </div>
  );
};

export default MemeWidget;
