'use client';

import React, { useState, useMemo } from 'react';
import katex from 'katex';
import {
  LATEX_PALETTE,
  MATRIX_ENVIRONMENTS,
  buildMatrixCode,
  templateToPreview,
  LatexPaletteCategory,
  LatexPaletteItem,
} from '@/lib/latexPalette';
import {
  Sigma,
  Search,
  Grid,
  Bookmark,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Hash,
} from 'lucide-react';

interface LatexToolbarProps {
  onInsert: (code: string, options?: { block?: boolean }) => void;
  labels?: string[];
  onExportTex?: () => void;
  onOpenTutorial?: () => void;
  onOpenGallery?: () => void;
}

export const LatexToolbar: React.FC<LatexToolbarProps> = ({
  onInsert,
  labels = [],
  onExportTex,
  onOpenTutorial,
  onOpenGallery,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(LATEX_PALETTE[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Matrice builder state
  const [matrixEnv, setMatrixEnv] = useState<'pmatrix' | 'bmatrix' | 'vmatrix' | 'matrix'>('pmatrix');
  const [matrixRows, setMatrixRows] = useState(2);
  const [matrixCols, setMatrixCols] = useState(2);
  const [showMatrixBuilder, setShowMatrixBuilder] = useState(false);

  // Recherche dans toute la palette
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results: LatexPaletteItem[] = [];
    LATEX_PALETTE.forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.label.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q)
        ) {
          results.push(item);
        }
      });
    });
    return results;
  }, [searchQuery]);

  const currentCategory = useMemo(() => {
    return LATEX_PALETTE.find((c) => c.id === activeTab) || LATEX_PALETTE[0];
  }, [activeTab]);

  // Rendu KaTeX d'un élément
  const renderSymbolPreview = (code: string) => {
    try {
      const preview = templateToPreview(code);
      return katex.renderToString(preview, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="border-t border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 backdrop-blur-sm transition-all duration-200">
      {/* Barre d'accès rapide */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Toggle toolbar complète */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
              isOpen
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400'
            }`}
            title="Ouvrir la palette d'outils et symboles LaTeX"
          >
            <Sigma className="w-3.5 h-3.5" />
            <span>Palette LaTeX</span>
            {isOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          <span className="text-zinc-300 dark:text-zinc-700">|</span>

          {/* Raccourcis directs inline / bloc */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert('#formule#', { block: false })}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono"
            title="Formule inline ($...$) - Raccourci Alt+M"
          >
            <span>$ ... $</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert('#formule#', { block: true })}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-bold"
            title="Bloc équation ($$...$$) - Raccourci Alt+Shift+M"
          >
            <span>$$ ... $$</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              onInsert('\\begin{equation}\n  \\label{eq:#nom#}\n  #formule#\n\\end{equation}', {
                block: true,
              })
            }
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            title="Équation numérotée avec label"
          >
            <Hash className="w-3 h-3 text-purple-500" />
            <span>Équation numérotée</span>
          </button>

          {/* Générateur de matrice */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowMatrixBuilder((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              showMatrixBuilder
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
            title="Générateur de matrices"
          >
            <Grid className="w-3 h-3 text-indigo-500" />
            <span>Matrice...</span>
          </button>

          {/* Références croisées */}
          {labels.length > 0 && (
            <div className="relative inline-flex items-center">
              <select
                aria-label="Insérer une référence croisée \eqref"
                onChange={(e) => {
                  if (e.target.value) {
                    onInsert(`\\eqref{${e.target.value}}`, { block: false });
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="text-xs bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none"
              >
                <option value="" disabled>
                  Réf \eqref...
                </option>
                {labels.map((lbl) => (
                  <option key={lbl} value={lbl}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Actions annexes : Export .tex, Aide, Galerie */}
        <div className="flex items-center gap-1.5 ml-auto">
          {onOpenGallery && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onOpenGallery}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
              title="Ouvrir la galerie de formules complexes"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Galerie</span>
            </button>
          )}

          {onOpenTutorial && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onOpenTutorial}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
              title="Guide LaTeX complet"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          )}

          {onExportTex && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onExportTex}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-200/70 dark:bg-zinc-800/80 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Exporter la note en document LaTeX (.tex)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="font-medium">.tex</span>
            </button>
          )}
        </div>
      </div>

      {/* Constructeur de Matrice Inline */}
      {showMatrixBuilder && (
        <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/80 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Générateur de Matrice :</span>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Type:</span>
            <select
              aria-label="Style de parenthèses de la matrice"
              value={matrixEnv}
              onChange={(e) => setMatrixEnv(e.target.value as any)}
              className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700"
            >
              {MATRIX_ENVIRONMENTS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Lignes:</span>
            <input
              aria-label="Nombre de lignes de la matrice"
              type="number"
              min={1}
              max={6}
              value={matrixRows}
              onChange={(e) => setMatrixRows(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
              className="w-12 px-1.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Colonnes:</span>
            <input
              aria-label="Nombre de colonnes de la matrice"
              type="number"
              min={1}
              max={6}
              value={matrixCols}
              onChange={(e) => setMatrixCols(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
              className="w-12 px-1.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
            />
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const code = buildMatrixCode(matrixEnv, matrixRows, matrixCols);
              onInsert(code, { block: true });
              setShowMatrixBuilder(false);
            }}
            className="px-3 py-1 rounded bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
          >
            Insérer la matrice
          </button>
        </div>
      )}

      {/* Palette dépliée avec onglets et grille de symboles */}
      {isOpen && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-in fade-in duration-150">
          {/* Header de la palette : Onglets + barre de recherche */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
            {/* Onglets */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {LATEX_PALETTE.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setActiveTab(cat.id);
                    setSearchQuery('');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === cat.id && !searchQuery
                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Barre de recherche */}
            <div className="relative min-w-[180px] md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher symbole, alpha, int..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Grille de symboles / snippets */}
          <div className="mt-2.5 max-h-56 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {(searchResults || currentCategory.items).map((item, idx) => {
                const previewHtml = renderSymbolPreview(item.code);
                return (
                  <button
                    key={`${item.code}-${idx}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onInsert(item.code, { block: item.block })}
                    title={`${item.label} (${item.code})`}
                    className="group relative flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-purple-400 dark:hover:border-purple-700 transition-all text-center"
                  >
                    {/* Rendu KaTeX */}
                    <div className="h-6 flex items-center justify-center text-zinc-900 dark:text-zinc-100 text-sm overflow-hidden pointer-events-none group-hover:scale-110 transition-transform">
                      {previewHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      ) : (
                        <span className="font-mono text-xs">{item.label}</span>
                      )}
                    </div>
                    {/* Nom / code sous le symbole */}
                    <span className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-full font-sans group-hover:text-purple-600 dark:group-hover:text-purple-300">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {(searchResults && searchResults.length === 0) && (
              <div className="py-6 text-center text-xs text-zinc-400">
                Aucun symbole correspondant à « {searchQuery} »
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
