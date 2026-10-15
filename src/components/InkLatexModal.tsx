'use client';

import React, { useState, useMemo } from 'react';
import katex from 'katex';
import { Sparkles, CheckCircle2, AlertCircle, X, Type } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { InkLatexBlock } from '@/types';

interface InkLatexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (latex: string, fontSize: number, displayMode: boolean) => void;
  editingBlock?: InkLatexBlock | null;
}

const QUICK_FORMULAS = [
  { label: 'Fraction', formula: '\\frac{a}{b}' },
  { label: 'Dérivée partielle', formula: '\\frac{\\partial f}{\\partial x}' },
  { label: 'Intégrale', formula: '\\int_{a}^{b} f(x) \\, dx' },
  { label: 'Somme', formula: '\\sum_{k=1}^{n} k^2' },
  { label: 'Vecteur', formula: '\\vec{v} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}' },
  { label: 'Matrice 2x2', formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Système', formula: '\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}' },
  { label: 'Théorème Pythagore', formula: 'a^2 + b^2 = c^2' },
  { label: 'Équation Schrödinger', formula: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H}\\Psi' },
];

export const InkLatexModal: React.FC<InkLatexModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  editingBlock,
}) => {
  const { theme } = useTheme();
  const [latexInput, setLatexInput] = useState(() => editingBlock?.latex || '\\frac{a}{b}');
  const [fontSize, setFontSize] = useState<number>(() => editingBlock?.fontSize || 22);
  const [displayMode, setDisplayMode] = useState<boolean>(() => editingBlock?.displayMode ?? true);

  // Synchroniser quand editingBlock change
  React.useEffect(() => {
    if (editingBlock) {
      setLatexInput(editingBlock.latex);
      setFontSize(editingBlock.fontSize || 22);
      setDisplayMode(editingBlock.displayMode ?? true);
    } else {
      setLatexInput('\\frac{a}{b}');
    }
  }, [editingBlock, isOpen]);

  const rendered = useMemo(() => {
    if (!latexInput.trim()) {
      return { html: '', isValid: false, error: 'Entrez une formule' };
    }
    try {
      const html = katex.renderToString(latexInput, {
        displayMode,
        throwOnError: true,
      });
      return { html, isValid: true, error: null };
    } catch {
      let fallbackHtml = '';
      try {
        fallbackHtml = katex.renderToString(latexInput, {
          displayMode,
          throwOnError: false,
        });
      } catch {
        // ignore
      }
      return { html: fallbackHtml, isValid: false, error: 'Syntaxe incomplète ou commande inconnue' };
    }
  }, [latexInput, displayMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-4 transition-all ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-purple-950/40'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
        }`}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b pb-3 border-inherit">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <span className="font-serif font-bold text-base">∑</span>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {editingBlock ? 'Modifier la formule' : 'Insérer une formule LaTeX'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Bloc dactylographié positionnable sur votre note manuscrite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formules rapides */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Exemples fréquents :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FORMULAS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setLatexInput(item.formula)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                  latexInput === item.formula
                    ? 'bg-purple-600 text-white border-purple-500'
                    : theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Champ de saisie TeX */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-zinc-400">Code LaTeX :</label>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium flex items-center gap-1 ${
                rendered.isValid
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              {rendered.isValid ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Syntaxe valide</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>{rendered.error}</span>
                </>
              )}
            </span>
          </div>
          <textarea
            value={latexInput}
            onChange={(e) => setLatexInput(e.target.value)}
            placeholder="Ex: \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
            rows={3}
            className={`w-full p-2.5 rounded-xl border text-xs font-mono resize-none focus:outline-none transition-colors ${
              theme === 'dark'
                ? 'bg-zinc-900/80 border-zinc-800 text-purple-300 focus:border-purple-500/60'
                : 'bg-zinc-50 border-zinc-200 text-purple-700 focus:border-purple-400'
            }`}
          />
        </div>

        {/* Rendu KaTeX en direct */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Rendu en direct :
          </span>
          <div
            className={`p-4 rounded-xl min-h-[64px] flex items-center justify-center overflow-x-auto border transition-colors ${
              theme === 'dark'
                ? 'bg-zinc-900/40 border-zinc-800/80'
                : 'bg-purple-50/40 border-purple-100'
            }`}
          >
            {rendered.html ? (
              <div
                className="font-serif text-lg selection:bg-purple-500/30"
                dangerouslySetInnerHTML={{ __html: rendered.html }}
              />
            ) : (
              <span className="text-xs text-zinc-500 italic">Aucune formule saisie</span>
            )}
          </div>
        </div>

        {/* Paramètres d'apparence (Taille de police) */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium text-zinc-400">Taille :</span>
            <div className="flex items-center gap-1">
              {[
                { label: 'Compact', size: 16 },
                { label: 'Normal', size: 22 },
                { label: 'Grand', size: 30 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFontSize(opt.size)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                    fontSize === opt.size
                      ? 'bg-purple-600 text-white border-purple-500'
                      : theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={displayMode}
              onChange={(e) => setDisplayMode(e.target.checked)}
              className="rounded accent-purple-600"
            />
            <span>Mode bloc centré</span>
          </label>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit">
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              if (latexInput.trim()) {
                onConfirm(latexInput.trim(), fontSize, displayMode);
                onClose();
              }
            }}
            disabled={!latexInput.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{editingBlock ? 'Mettre à jour' : 'Placer sur la feuille'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
