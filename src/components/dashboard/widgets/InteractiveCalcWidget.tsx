'use client';

import React, { useState } from 'react';
import { Calculator, Sparkles, Delete, History, RotateCcw } from 'lucide-react';
import { WidgetSize } from '@/types/dashboard';

interface InteractiveCalcWidgetProps {
  size?: WidgetSize;
}

export const InteractiveCalcWidget: React.FC<InteractiveCalcWidgetProps> = ({ size = 'small' }) => {
  const [calcInput, setCalcInput] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [scratchpad, setScratchpad] = useState('');

  const handleBtn = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
      return;
    }
    if (val === 'DEL') {
      if (calcInput.length <= 1 || calcInput === 'Erreur') {
        setCalcInput('0');
      } else {
        setCalcInput(calcInput.slice(0, -1));
      }
      return;
    }
    if (val === 'sqrt') {
      try {
        const num = parseFloat(calcInput);
        if (num < 0) {
          setCalcInput('Erreur');
          return;
        }
        const res = Math.sqrt(num);
        setCalcInput(String(Math.round(res * 10000) / 10000));
      } catch {
        setCalcInput('Erreur');
      }
      return;
    }
    if (val === 'sq') {
      try {
        const num = parseFloat(calcInput);
        const res = num * num;
        setCalcInput(String(Math.round(res * 10000) / 10000));
      } catch {
        setCalcInput('Erreur');
      }
      return;
    }
    if (val === '=') {
      try {
        const clean = calcInput.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${clean})`)();
        const resStr = String(Math.round(res * 10000) / 10000);
        setHistory((prev) => [`${calcInput} = ${resStr}`, ...prev.slice(0, 7)]);
        setCalcInput(resStr);
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

  // ==========================================
  // VUE 1 : FORMAT SMALL (1x1) - COMPACT CALCULATOR
  // ==========================================
  if (size === 'small') {
    return (
      <div className="flex flex-col h-full justify-between p-3 select-none">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Calcul</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Express</span>
        </div>

        {/* Écran */}
        <div className="my-1.5 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-right font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 truncate shadow-inner">
          {calcInput}
        </div>

        {/* Pavé compact */}
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
  }

  // ==========================================
  // VUE 2 : FORMAT LARGE / FULL (2x2 ou 4x1) - SCIENTIFIC & HISTORY WORKSPACE
  // ==========================================
  if (size === 'large' || size === 'full') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none gap-3">
        {/* En-tête large */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Calculatrice Avancée & Ruban de Calcul</span>
              </div>
              <div className="text-[10px] text-zinc-400">Opérations rapides, racine carrée et historique persistant</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCalcInput('0');
              setHistory([]);
            }}
            className="text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Effacer tout</span>
          </button>
        </div>

        {/* Corps : Colonne Calculateur + Colonne Historique / Scratchpad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
          {/* Gauche : Pavé complet */}
          <div>
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-right font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate shadow-inner mb-2">
              {calcInput}
            </div>

            <div className="grid grid-cols-4 gap-1 text-xs font-mono">
              {['C', 'DEL', 'sqrt', '/'].map((b) => (
                <button
                  key={b}
                  onClick={() => handleBtn(b)}
                  className="p-1.5 rounded-lg bg-zinc-200/70 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold transition-colors"
                >
                  {b === 'sqrt' ? '√x' : b}
                </button>
              ))}
              {['7', '8', '9', '*'].map((b) => (
                <button
                  key={b}
                  onClick={() => handleBtn(b)}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors"
                >
                  {b}
                </button>
              ))}
              {['4', '5', '6', '-'].map((b) => (
                <button
                  key={b}
                  onClick={() => handleBtn(b)}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors"
                >
                  {b}
                </button>
              ))}
              {['1', '2', '3', '+'].map((b) => (
                <button
                  key={b}
                  onClick={() => handleBtn(b)}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors"
                >
                  {b}
                </button>
              ))}
              {['0', '.', 'sq', '='].map((b) => (
                <button
                  key={b}
                  onClick={() => handleBtn(b)}
                  className={`p-1.5 rounded-lg font-bold transition-colors ${
                    b === '='
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {b === 'sq' ? 'x²' : b}
                </button>
              ))}
            </div>
          </div>

          {/* Droite : Ruban d'historique */}
          <div className="flex flex-col justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1">
              <History className="w-3 h-3 text-emerald-500" />
              <span>Historique des résultats</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[140px] space-y-1 font-mono text-[11px] scrollbar-thin">
              {history.length === 0 ? (
                <div className="text-zinc-400 text-center py-4 text-xs italic">
                  Aucun calcul récent
                </div>
              ) : (
                history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const res = h.split('=')[1]?.trim();
                      if (res) setCalcInput(res);
                    }}
                    className="p-1 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer flex justify-between"
                    title="Cliquer pour réutiliser le résultat"
                  >
                    <span>{h}</span>
                  </div>
                ))
              )}
            </div>
            <div className="text-[9px] text-zinc-400 text-right pt-1 font-mono">
              Cliquez pour insérer
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VUE 3 : FORMAT MEDIUM (2x1) - HORIZONTAL CALC
  // ==========================================
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Calculatrice rapide</span>
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">2x1</span>
      </div>

      <div className="grid grid-cols-2 gap-3 my-auto items-center">
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center">
          <span className="text-[9px] font-mono text-zinc-400 uppercase">Affichage</span>
          <div className="text-right font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate mt-1">
            {calcInput}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 text-xs font-mono">
          {['7', '8', '9', '/'].map((b) => (
            <button
              key={b}
              onClick={() => handleBtn(b)}
              className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800"
            >
              {b}
            </button>
          ))}
          {['4', '5', '6', '*'].map((b) => (
            <button
              key={b}
              onClick={() => handleBtn(b)}
              className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800"
            >
              {b}
            </button>
          ))}
          {['1', '2', '3', '-'].map((b) => (
            <button
              key={b}
              onClick={() => handleBtn(b)}
              className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800"
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
                  ? 'bg-purple-600 text-white'
                  : b === 'C'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveCalcWidget;
