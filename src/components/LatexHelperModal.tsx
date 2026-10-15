'use client';

import React, { useState } from 'react';
import { X, Sparkles, Copy, Check } from 'lucide-react';
import katex from 'katex';
import { useTheme } from '@/context/ThemeContext';

interface LatexHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latexCode: string) => void;
}

interface FormulaItem {
  name: string;
  code: string;
  isBlock?: boolean;
}

const CATEGORIES: { id: string; name: string; items: FormulaItem[] }[] = [
  {
    id: 'general',
    name: 'Algèbre & Général',
    items: [
      { name: 'Fraction', code: '\\frac{a}{b}' },
      { name: 'Racine carrée', code: '\\sqrt{x}' },
      { name: 'Racine n-ième', code: '\\sqrt[n]{x}' },
      { name: 'Puissance & Indice', code: 'x_{i}^{2}' },
      { name: 'Valeur absolue', code: '|x|' },
      { name: 'Pour tout & Il existe', code: '\\forall x \\in \\mathbb{R}, \\exists y > 0' },
      { name: 'Appartenance', code: 'x \\in [0, 1]' },
      { name: 'Plus ou moins', code: 'x \\pm \\sigma' },
    ],
  },
  {
    id: 'analysis',
    name: 'Analyse & Calcul',
    items: [
      { name: 'Intégrale définie', code: '\\int_{a}^{b} f(x) \\, dx', isBlock: true },
      { name: 'Somme', code: '\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}', isBlock: true },
      { name: 'Limite', code: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0' },
      { name: 'Dérivée', code: '\\frac{df}{dx}' },
      { name: 'Dérivée partielle', code: '\\frac{\\partial f}{\\partial x}' },
      { name: 'Produit', code: '\\prod_{k=1}^{n} k = n!' },
      { name: 'Intégrale double', code: '\\iint_D f(x, y) \\, dx dy', isBlock: true },
    ],
  },
  {
    id: 'science',
    name: 'Physique & Sciences',
    items: [
      { name: 'Équivalence Masse-Énergie', code: 'E = m c^2' },
      { name: 'Loi de Newton', code: '\\vec{F} = m \\vec{a}' },
      { name: 'Gravitation universelle', code: 'F = G \\frac{m_1 m_2}{r^2}', isBlock: true },
      { name: 'Produit scalaire de vecteurs', code: '\\vec{u} \\cdot \\vec{v} = ||\\vec{u}|| \\cdot ||\\vec{v}|| \\cos(\\theta)' },
      { name: 'Norme vectorielle', code: '\\|\\vec{x}\\| = \\sqrt{\\sum_{i=1}^n x_i^2}' },
      { name: 'Loi des gaz parfaits', code: 'P V = n R T' },
    ],
  },
  {
    id: 'greek',
    name: 'Lettres Grecques & Symboles',
    items: [
      { name: 'Alpha, Bêta, Gamma', code: '\\alpha, \\beta, \\gamma, \\Gamma' },
      { name: 'Thêta, Lambda, Pi', code: '\\theta, \\lambda, \\pi, \\Pi' },
      { name: 'Sigma, Oméga, Delta', code: '\\sigma, \\Sigma, \\omega, \\Omega, \\Delta' },
      { name: 'Infini & Approximations', code: '\\infty, \\approx, \\neq, \\le, \\ge' },
      { name: 'Ensembles de nombres', code: '\\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{R}, \\mathbb{C}' },
    ],
  },
  {
    id: 'matrices',
    name: 'Matrices & Systèmes',
    items: [
      {
        name: 'Matrice 2x2',
        code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        isBlock: true,
      },
      {
        name: 'Matrice 3x3 Identité',
        code: 'I = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}',
        isBlock: true,
      },
      {
        name: 'Système d\'équations',
        code: '\\begin{cases} 2x + 3y = 7 \\\\ x - y = 1 \\end{cases}',
        isBlock: true,
      },
    ],
  },
];

export const LatexHelperModal: React.FC<LatexHelperModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategory = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  const handleSelect = (formula: FormulaItem) => {
    const formatted = formula.isBlock ? `\n$$\n${formula.code}\n$$\n` : `$${formula.code}$`;
    onInsert(formatted);
    onClose();
  };

  const renderFormulaPreview = (code: string) => {
    try {
      const html = katex.renderToString(code, {
        displayMode: false,
        throwOnError: false,
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span>{code}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-serif font-bold text-sm">
              ∑
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Assistant Formules LaTeX
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono">
                  KaTeX
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Cliquez sur une formule pour l'insérer instantanément dans votre note.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de Catégories */}
        <div className="flex items-center gap-1.5 p-3 border-b border-inherit overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === cat.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : theme === 'dark'
                  ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Liste des formules de la catégorie */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentCategory.items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(item)}
                className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all group hover:scale-[1.01] ${
                  theme === 'dark'
                    ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 hover:border-purple-500/50'
                    : 'bg-zinc-50 hover:bg-white border-zinc-200 hover:border-purple-400 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-400 group-hover:text-purple-400 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                    {item.isBlock ? 'Bloc $$' : 'Ligne $'}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-center min-h-[48px] overflow-x-auto font-serif text-base text-zinc-200 dark:text-zinc-100">
                  {renderFormulaPreview(item.code)}
                </div>

                <div className="pt-2 border-t border-inherit/40 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span className="truncate max-w-[180px]">{item.code}</span>
                  <span className="text-[10px] text-purple-400 font-sans font-medium group-hover:underline">
                    Insérer →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Astuce */}
        <div
          className={`p-3.5 border-t text-xs flex items-center justify-between ${
            theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Astuce : Entourez vos formules de <code className="text-purple-400">$...$</code> en ligne ou <code className="text-purple-400">$$...$$</code> pour un bloc centré.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LatexHelperModal;
