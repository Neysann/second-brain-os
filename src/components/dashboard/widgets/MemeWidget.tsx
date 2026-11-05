'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, RefreshCw, Smile, Copy, Check, Sparkles } from 'lucide-react';
import { WidgetSize } from '@/types/dashboard';

const MEMES = [
  {
    title: 'Quand ton code compile du premier coup',
    emoji: '🧙‍♂️✨',
    quote: '"Je ne sais pas pourquoi ça marche, mais ne touchez à rien."',
    tag: 'Dev Life',
  },
  {
    title: 'Vendredi 17h : push en prod',
    emoji: '🚀🔥',
    quote: '"Le week-end sera calme... ou sur les chapeaux de roues."',
    tag: 'Danger Zone',
  },
  {
    title: 'Organiser sa vie avec Syntropy',
    emoji: '🧠⚡',
    quote: '"Le chaos se transforme en clarté absolue."',
    tag: 'Productivité',
  },
  {
    title: 'Fixer un bug à 2h du matin',
    emoji: '☕🦇',
    quote: '"J\'ai supprimé une ligne et le serveur a redémarré en suédois."',
    tag: 'Nocturne',
  },
  {
    title: 'Une réunion qui aurait pu être un e-mail',
    emoji: '😴📊',
    quote: '"Nous sommes réunis pour discuter de la date de la prochaine réunion."',
    tag: 'Bureau',
  },
  {
    title: 'Quand l\'IA génère exactement ce que tu voulais',
    emoji: '🤯🤝',
    quote: '"Est-ce de la télépathie ou juste une matrice de covariance parfaite ?"',
    tag: 'Tech',
  },
];

interface MemeWidgetProps {
  size?: WidgetSize;
}

export const MemeWidget: React.FC<MemeWidgetProps> = ({ size = 'small' }) => {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const nextMeme = () => {
    setIndex((prev) => (prev + 1) % MEMES.length);
  };

  const current = MEMES[index];

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${current.emoji} ${current.title} — ${current.quote}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ==========================================
  // VUE 1 : FORMAT SMALL (1x1) - COMPACT MEME
  // ==========================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 truncate">
            <Smile className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
            <span className="truncate">Humour</span>
          </span>
          <button
            type="button"
            onClick={nextMeme}
            className="p-1 rounded text-zinc-400 hover:text-teal-500 transition-colors cursor-pointer"
            title="Autre dose"
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="my-auto text-center flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
          <span className="text-2xl mb-1 select-none">{current.emoji}</span>
          <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
            {current.title}
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic line-clamp-2 mt-0.5">
            {current.quote}
          </p>
        </div>

        <div className="text-[9px] text-zinc-400 font-mono text-center">
          Dose d&apos;énergie
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 2 : FORMAT LARGE / FULL (2x2 ou 4x1) - HUMOR GALLERY
  // ==========================================
  if (size === 'large' || size === 'full') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none gap-3">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Le Coin Détente & Culture Geek</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  Dose de sérotonine
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">Parce qu&apos;une journée productive commence avec le sourire</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Copier le meme"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={nextMeme}
              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Autre</span>
            </button>
          </div>
        </div>

        {/* Galerie de 3 memes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-auto">
          {[0, 1, 2].map((offset) => {
            const m = MEMES[(index + offset) % MEMES.length];
            return (
              <div
                key={m.title}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between text-center hover:border-teal-500/40 transition-all"
              >
                <div>
                  <span className="text-3xl mb-2 block">{m.emoji}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-600 dark:text-teal-400 mb-1.5 inline-block">
                    {m.tag}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2">
                    {m.title}
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic mt-2">
                  {m.quote}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMAT MEDIUM (2x1) - STANDARD MEME CARD
  // ==========================================
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
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
        Dose quotidienne d&apos;énergie
      </div>
    </div>
  );
};

export default MemeWidget;
