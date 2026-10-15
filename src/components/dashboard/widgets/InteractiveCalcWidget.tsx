'use client';

import React, { useState } from 'react';
import { Calculator, Sparkles, Delete } from 'lucide-react';

export const InteractiveCalcWidget: React.FC = () => {
  const [calcInput, setCalcInput] = useState('0');

  const handleBtn = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
      return;
    }
    if (val === '=') {
      try {
        // Nettoyage strict pour calcul simple
        const clean = calcInput.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${clean})`)();
        setCalcInput(String(res));
      } catch {
        setCalcInput('Erreur');
      }
      return;
    }
    if (calcInput === '0' || calcInput === 'Erreur') {
      setCalcInput(val);
    } else {
      setCalcInput((prev) => prev + val);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Widget interactif</span>
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">Calcul express</span>
      </div>

      {/* Écran */}
      <div className="my-1.5 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-right font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 truncate shadow-inner">
        {calcInput}
      </div>

      {/* Pavé de boutons */}
      <div className="grid grid-cols-4 gap-1 text-xs font-mono">
        {['7', '8', '9', '/'].map((b) => (
          <button
            key={b}
            onClick={() => handleBtn(b)}
            className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            {b}
          </button>
        ))}
        {['4', '5', '6', '*'].map((b) => (
          <button
            key={b}
            onClick={() => handleBtn(b)}
            className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            {b}
          </button>
        ))}
        {['1', '2', '3', '-'].map((b) => (
          <button
            key={b}
            onClick={() => handleBtn(b)}
            className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            {b}
          </button>
        ))}
        {['C', '0', '=', '+'].map((b) => (
          <button
            key={b}
            onClick={() => handleBtn(b)}
            className={`p-1 rounded-lg font-bold transition-colors ${
              b === '='
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : b === 'C'
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InteractiveCalcWidget;
