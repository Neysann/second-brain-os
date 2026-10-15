/**
 * Syntropy OS — LaTeX Snippets & Intelligent Typing Helper
 * Fournit l'autocomplétion, les snippets par Tab, l'auto-encapsulation et la détection inline
 */

export interface LatexSnippet {
  trigger: string; // Ex: '/frac'
  label: string; // Ex: 'Fraction'
  template: string; // Contenu inséré
  cursorOffset?: number; // Décalage du curseur par rapport au début de l'insertion
  selectionLength?: number; // Longueur de sélection initiale
  description: string;
  category: 'algebra' | 'calculus' | 'symbols' | 'matrices' | 'logic';
}

export const LATEX_SNIPPETS: LatexSnippet[] = [
  // Algèbre & Bases
  {
    trigger: '/frac',
    label: '\\frac{a}{b}',
    template: '\\frac{a}{b}',
    cursorOffset: 6,
    selectionLength: 1,
    description: 'Fraction simple',
    category: 'algebra',
  },
  {
    trigger: '/sqrt',
    label: '\\sqrt{x}',
    template: '\\sqrt{x}',
    cursorOffset: 6,
    selectionLength: 1,
    description: 'Racine carrée',
    category: 'algebra',
  },
  {
    trigger: '/root',
    label: '\\sqrt[n]{x}',
    template: '\\sqrt[n]{x}',
    cursorOffset: 6,
    selectionLength: 1,
    description: 'Racine n-ième',
    category: 'algebra',
  },
  {
    trigger: '/vec',
    label: '\\vec{v}',
    template: '\\vec{v}',
    cursorOffset: 5,
    selectionLength: 1,
    description: 'Vecteur',
    category: 'algebra',
  },
  {
    trigger: '/norm',
    label: '\\|x\\|',
    template: '\\|x\\|',
    cursorOffset: 2,
    selectionLength: 1,
    description: 'Norme vectorielle',
    category: 'algebra',
  },

  // Calcul infinitésimal & Analyse
  {
    trigger: '/int',
    label: '\\int_{a}^{b} f(x) dx',
    template: '\\int_{a}^{b} f(x) \\, dx',
    cursorOffset: 6,
    selectionLength: 1,
    description: 'Intégrale définie',
    category: 'calculus',
  },
  {
    trigger: '/sum',
    label: '\\sum_{i=1}^{n}',
    template: '\\sum_{i=1}^{n} ',
    cursorOffset: 6,
    selectionLength: 3,
    description: 'Somme discrète',
    category: 'calculus',
  },
  {
    trigger: '/prod',
    label: '\\prod_{i=1}^{n}',
    template: '\\prod_{i=1}^{n} ',
    cursorOffset: 7,
    selectionLength: 3,
    description: 'Produit (pi majuscule)',
    category: 'calculus',
  },
  {
    trigger: '/lim',
    label: '\\lim_{x \\to \\infty}',
    template: '\\lim_{x \\to \\infty} ',
    cursorOffset: 5,
    selectionLength: 14,
    description: 'Limite',
    category: 'calculus',
  },
  {
    trigger: '/partial',
    label: '\\frac{\\partial f}{\\partial x}',
    template: '\\frac{\\partial f}{\\partial x}',
    cursorOffset: 15,
    selectionLength: 1,
    description: 'Dérivée partielle',
    category: 'calculus',
  },
  {
    trigger: '/eval',
    label: '\\left. f(x) \\right|_{a}^{b}',
    template: '\\left. f(x) \\right|_{a}^{b}',
    cursorOffset: 7,
    selectionLength: 4,
    description: 'Évaluation entre bornes',
    category: 'calculus',
  },

  // Matrices & Systèmes
  {
    trigger: '/mat2',
    label: 'Matrice 2x2',
    template: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    cursorOffset: 16,
    selectionLength: 1,
    description: 'Matrice 2x2 entre parenthèses',
    category: 'matrices',
  },
  {
    trigger: '/mat3',
    label: 'Matrice 3x3',
    template: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}',
    cursorOffset: 16,
    selectionLength: 1,
    description: 'Matrice 3x3 entre parenthèses',
    category: 'matrices',
  },
  {
    trigger: '/cases',
    label: 'Système / Cas',
    template: '\\begin{cases} x & \\text{si } x \\ge 0 \\\\ -x & \\text{sinon} \\end{cases}',
    cursorOffset: 14,
    selectionLength: 1,
    description: 'Accolade de cas ou système',
    category: 'matrices',
  },
  {
    trigger: '/align',
    label: 'Équations alignées',
    template: '\\begin{aligned}\n  f(x) &= ax + b \\\\\n       &= c\n\\end{aligned}',
    cursorOffset: 19,
    selectionLength: 4,
    description: 'Bloc de calculs alignés sur le signe =',
    category: 'matrices',
  },

  // Ensembles & Logique
  {
    trigger: '/real',
    label: '\\mathbb{R}',
    template: '\\mathbb{R}',
    cursorOffset: 9,
    description: 'Ensemble des nombres réels',
    category: 'logic',
  },
  {
    trigger: '/complex',
    label: '\\mathbb{C}',
    template: '\\mathbb{C}',
    cursorOffset: 9,
    description: 'Ensemble des nombres complexes',
    category: 'logic',
  },
  {
    trigger: '/nat',
    label: '\\mathbb{N}',
    template: '\\mathbb{N}',
    cursorOffset: 9,
    description: 'Ensemble des entiers naturels',
    category: 'logic',
  },
  {
    trigger: '/forall',
    label: '\\forall',
    template: '\\forall ',
    cursorOffset: 8,
    description: 'Pour tout (quantificateur universel)',
    category: 'logic',
  },
  {
    trigger: '/exists',
    label: '\\exists',
    template: '\\exists ',
    cursorOffset: 8,
    description: 'Il existe (quantificateur existentiel)',
    category: 'logic',
  },
  {
    trigger: '/in',
    label: '\\in',
    template: '\\in ',
    cursorOffset: 4,
    description: 'Appartient à',
    category: 'logic',
  },

  // Lettres grecques & Symboles
  { trigger: '/alpha', label: '\\alpha', template: '\\alpha', cursorOffset: 6, description: 'Alpha', category: 'symbols' },
  { trigger: '/beta', label: '\\beta', template: '\\beta', cursorOffset: 5, description: 'Beta', category: 'symbols' },
  { trigger: '/gamma', label: '\\gamma', template: '\\gamma', cursorOffset: 6, description: 'Gamma', category: 'symbols' },
  { trigger: '/delta', label: '\\delta', template: '\\delta', cursorOffset: 6, description: 'Delta', category: 'symbols' },
  { trigger: '/theta', label: '\\theta', template: '\\theta', cursorOffset: 6, description: 'Theta', category: 'symbols' },
  { trigger: '/lambda', label: '\\lambda', template: '\\lambda', cursorOffset: 7, description: 'Lambda', category: 'symbols' },
  { trigger: '/pi', label: '\\pi', template: '\\pi', cursorOffset: 3, description: 'Pi', category: 'symbols' },
  { trigger: '/omega', label: '\\omega', template: '\\omega', cursorOffset: 6, description: 'Omega', category: 'symbols' },
  { trigger: '/infty', label: '\\infty', template: '\\infty', cursorOffset: 6, description: 'Infini', category: 'symbols' },
  { trigger: '/text', label: '\\text{...}', template: '\\text{texte}', cursorOffset: 6, selectionLength: 5, description: 'Texte droit dans une formule', category: 'symbols' },
  { trigger: '/tag', label: '\\tag{1}', template: '\\tag{1}', cursorOffset: 5, selectionLength: 1, description: 'Numéro d\'équation personnalisé', category: 'symbols' },
];

/**
 * Tente d'expanser un snippet au niveau du curseur.
 * Renvoie le nouveau texte et la nouvelle position du curseur, ou null si aucun snippet ne matche.
 */
export function tryExpandSnippet(
  content: string,
  cursorPos: number
): {
  newContent: string;
  newCursorPos: number;
  selectionLength?: number;
} | null {
  const textBefore = content.substring(0, cursorPos);
  const match = textBefore.match(/\/([a-zA-Z0-9]+)$/);
  if (!match) return null;

  const trigger = '/' + match[1].toLowerCase();
  const snippet = LATEX_SNIPPETS.find((s) => s.trigger.toLowerCase() === trigger);
  if (!snippet) return null;

  const startIdx = cursorPos - trigger.length;
  const beforeSnippet = content.substring(0, startIdx);
  const afterSnippet = content.substring(cursorPos);

  const newContent = beforeSnippet + snippet.template + afterSnippet;
  const newCursorPos = startIdx + (snippet.cursorOffset ?? snippet.template.length);

  return {
    newContent,
    newCursorPos,
    selectionLength: snippet.selectionLength,
  };
}

export interface ActiveMathContext {
  math: string;
  displayMode: boolean;
  start: number;
  end: number;
}

/**
 * Détecte si le curseur se trouve actuellement à l'intérieur d'un bloc de maths ($...$ ou $$...$$).
 */
export function getActiveMathContext(content: string, cursorPos: number): ActiveMathContext | null {
  if (!content || cursorPos < 0 || cursorPos > content.length) return null;

  // 1. Chercher d'abord les blocs d'affichage $$...$$
  const doubleDollarRegex = /\$\$([\s\S]*?)\$\$/g;
  let m: RegExpExecArray | null;
  while ((m = doubleDollarRegex.exec(content)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    if (cursorPos >= start && cursorPos <= end) {
      return {
        math: m[1].trim(),
        displayMode: true,
        start,
        end,
      };
    }
  }

  // 2. Chercher les blocs inline $...$ (en évitant les échappements \$ ou $$)
  const singleDollarRegex = /(?<!\$)\$(?!\$)([^\$\n]+?)(?<!\$)\$(?!\$)/g;
  while ((m = singleDollarRegex.exec(content)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    if (cursorPos >= start && cursorPos <= end) {
      return {
        math: m[1].trim(),
        displayMode: false,
        start,
        end,
      };
    }
  }

  return null;
}
