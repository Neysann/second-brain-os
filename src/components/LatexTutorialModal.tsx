'use client';

import React from 'react';
import { X, BookOpen, Sparkles, Plus, Copy, Check } from 'lucide-react';
import katex from 'katex';
import { useTheme } from '@/context/ThemeContext';

interface LatexTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateExampleNote?: () => void;
}

export const LatexTutorialModal: React.FC<LatexTutorialModalProps> = ({
  isOpen,
  onClose,
  onCreateExampleNote,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const renderMath = (code: string, displayMode: boolean = false) => {
    try {
      const html = katex.renderToString(code, {
        displayMode,
        throwOnError: false,
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span>{code}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all relative ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-purple-950/40'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-serif text-lg font-bold">
              ∑
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Tutoriel Express LaTeX
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono">
                  KaTeX Guide
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Comment rédiger de magnifiques formules mathématiques dans vos notes Syntropy.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu du Tutoriel */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin text-xs md:text-sm">
          {/* Règle fondamentale */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              theme === 'dark'
                ? 'bg-zinc-900/60 border-zinc-800'
                : 'bg-purple-50/50 border-purple-200/80 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm text-purple-500 dark:text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              1. Les deux syntaxes essentielles
            </h3>
            <p className="leading-relaxed text-zinc-400 dark:text-zinc-400">
              Dans Syntropy, vous pouvez mélanger du texte normal, du Markdown et des formules TeX :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div
                className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs text-indigo-400 mb-1">
                  En ligne (dans votre phrase)
                </div>
                <code className="text-xs font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded block mb-2">
                  $E = mc^2$
                </code>
                <div className="text-xs text-zinc-300">
                  Résultat : {renderMath('E = mc^2')}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <div className="font-semibold text-xs text-indigo-400 mb-1">
                  En bloc centré (mise en valeur)
                </div>
                <code className="text-xs font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded block mb-2">
                  {'$$\\int_a^b f(x) dx$$'}
                </code>
                <div className="text-xs text-zinc-300 flex justify-center py-1">
                  {renderMath('\\int_a^b f(x) \\, dx', true)}
                </div>
              </div>
            </div>
          </div>

          {/* Exemples fréquents */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-zinc-200 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              2. Les formules courantes à retenir
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div>
                  <span className="font-medium text-xs block text-zinc-400">Fraction</span>
                  <code className="text-[11px] font-mono text-purple-400">{'\\frac{a}{b}'}</code>
                </div>
                <div className="text-sm font-serif">{renderMath('\\frac{a}{b}')}</div>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div>
                  <span className="font-medium text-xs block text-zinc-400">Racine carrée</span>
                  <code className="text-[11px] font-mono text-purple-400">{'\\sqrt{x}'}</code>
                </div>
                <div className="text-sm font-serif">{renderMath('\\sqrt{x}')}</div>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div>
                  <span className="font-medium text-xs block text-zinc-400">Puissance & Indice</span>
                  <code className="text-[11px] font-mono text-purple-400">{'x_i^2'}</code>
                </div>
                <div className="text-sm font-serif">{renderMath('x_i^2')}</div>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div>
                  <span className="font-medium text-xs block text-zinc-400">Somme</span>
                  <code className="text-[11px] font-mono text-purple-400">{'\\sum_{i=1}^n x_i'}</code>
                </div>
                <div className="text-sm font-serif">{renderMath('\\sum_{i=1}^n x_i')}</div>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div>
                  <span className="font-medium text-xs block text-zinc-400">Lettres grecques</span>
                  <code className="text-[11px] font-mono text-purple-400">{'\\alpha, \\beta, \\pi, \\lambda'}</code>
                </div>
                <div className="text-sm font-serif">{renderMath('\\alpha, \\beta, \\pi, \\lambda')}</div>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div>
                  <span className="font-medium text-xs block text-zinc-400">Vecteur</span>
                  <code className="text-[11px] font-mono text-purple-400">{'\\vec{v}'}</code>
                </div>
                <div className="text-sm font-serif">{renderMath('\\vec{v}')}</div>
              </div>
            </div>
          </div>

          {/* Astuce de l'assistant */}
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed flex items-center gap-3 ${
              theme === 'dark'
                ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center font-bold flex-shrink-0">
              💡
            </div>
            <div>
              <strong>Astuce gain de temps :</strong> Pas besoin d'apprendre toute la syntaxe par cœur ! Cliquez sur le bouton <span className="font-semibold underline">« Insérer LaTeX »</span> dans la barre d'outils de votre note pour insérer directement n'importe quelle formule en 1 clic.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          {onCreateExampleNote && (
            <button
              onClick={() => {
                onCreateExampleNote();
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all w-full sm:w-auto justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une note exemple avec ce tutoriel</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors w-full sm:w-auto"
          >
            Fermer le tutoriel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LatexTutorialModal;
