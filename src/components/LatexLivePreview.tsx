'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import { Sparkles, CheckCircle2, AlertCircle, X, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface LatexLivePreviewProps {
  math: string;
  displayMode: boolean;
  onClose?: () => void;
  className?: string;
}

export const LatexLivePreview: React.FC<LatexLivePreviewProps> = ({
  math,
  displayMode,
  onClose,
  className = '',
}) => {
  const { theme } = useTheme();

  const rendered = useMemo(() => {
    if (!math || !math.trim()) {
      return {
        html: '',
        isValid: false,
        error: 'Saisie de la formule...',
      };
    }

    try {
      const html = katex.renderToString(math, {
        displayMode,
        throwOnError: true,
      });
      return {
        html,
        isValid: true,
        error: null,
      };
    } catch (err: unknown) {
      // Déduire une erreur plus lisible pour l'étudiant
      const rawMsg = err instanceof Error ? err.message : String(err);
      let friendlyError = 'Formule en cours de saisie...';
      if (rawMsg.includes('Expected')) {
        friendlyError = 'Symbole ou accolade de fermeture attendue';
      } else if (rawMsg.includes('Undefined control sequence')) {
        const cmdMatch = rawMsg.match(/Undefined control sequence:\s*\\([a-zA-Z]+)/);
        friendlyError = cmdMatch ? `Commande \\${cmdMatch[1]} inconnue` : 'Commande LaTeX inconnue';
      }

      // Rendu avec throwOnError false pour afficher où est le problème si possible
      let fallbackHtml = '';
      try {
        fallbackHtml = katex.renderToString(math, {
          displayMode,
          throwOnError: false,
        });
      } catch {
        // ignore
      }

      return {
        html: fallbackHtml,
        isValid: false,
        error: friendlyError,
      };
    }
  }, [math, displayMode]);

  return (
    <div
      className={`fixed bottom-6 right-6 md:right-8 z-40 max-w-md w-[calc(100vw-3rem)] rounded-2xl border shadow-2xl backdrop-blur-xl p-3.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
        theme === 'dark'
          ? 'bg-zinc-950/90 border-purple-500/30 text-zinc-100 shadow-purple-950/30'
          : 'bg-white/95 border-purple-300 text-zinc-900 shadow-purple-200/50'
      } ${className}`}
    >
      {/* Header compact de l'infobulle */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-inherit">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-purple-600/20 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <span className="font-serif font-bold text-xs">∑</span>
          </div>
          <span className="text-xs font-bold tracking-tight text-purple-400 truncate">
            Aperçu LaTeX en direct
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-medium flex items-center gap-1 flex-shrink-0 ${
              rendered.isValid
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {rendered.isValid ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Valide</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-2.5 h-2.5" />
                <span>{rendered.error}</span>
              </>
            )}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors cursor-pointer"
            title="Masquer l'aperçu"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Rendu KaTeX interactif */}
      <div
        className={`p-3 rounded-xl min-h-[44px] flex items-center justify-center overflow-x-auto scrollbar-none transition-colors ${
          theme === 'dark' ? 'bg-zinc-900/60' : 'bg-purple-50/50'
        }`}
      >
        {rendered.html ? (
          <div
            className={`font-serif ${displayMode ? 'text-lg' : 'text-base'}`}
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        ) : (
          <span className="text-xs text-zinc-500 italic">Entrez votre formule pour l&apos;aperçu...</span>
        )}
      </div>

      {/* Raccourci d'aide */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <span className="truncate">Mode : {displayMode ? 'Bloc ($$)' : 'Ligne ($)'}</span>
        <span className="flex items-center gap-1">
          <span>Tab pour snippets</span>
          <ChevronRight className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
};
