// ===================================================================
// Palette LaTeX de l'éditeur de notes : catégories, symboles, structures
// et logique d'insertion « intelligente » (inline / bloc / déjà dans une formule).
//
// Convention des gabarits : le texte entouré de # (ex. \frac{#a#}{b}) est le
// champ à remplir : il est sélectionné après insertion, ou remplacé par la
// sélection courante de l'utilisateur.
// ===================================================================

export interface LatexPaletteItem {
  label: string; // Nom affiché en infobulle
  code: string; // Code LaTeX (gabarit)
  block?: boolean; // Doit être placé dans un bloc $$ ... $$ s'il est inséré hors d'une formule
}

export interface LatexPaletteCategory {
  id: string;
  name: string;
  items: LatexPaletteItem[];
}

const sym = (label: string, code: string): LatexPaletteItem => ({ label, code });

export const LATEX_PALETTE: LatexPaletteCategory[] = [
  {
    id: 'structures',
    name: 'Structures',
    items: [
      { label: 'Fraction', code: '\\frac{#a#}{b}' },
      { label: 'Fraction grande taille', code: '\\dfrac{#a#}{b}' },
      { label: 'Racine carrée', code: '\\sqrt{#x#}' },
      { label: 'Racine n-ième', code: '\\sqrt[n]{#x#}' },
      { label: 'Puissance', code: '#x#^{2}' },
      { label: 'Indice', code: '#x#_{i}' },
      { label: 'Indice et exposant', code: '#x#_{i}^{n}' },
      { label: 'Somme', code: '\\sum_{i=1}^{n} #a_i#' },
      { label: 'Produit', code: '\\prod_{i=1}^{n} #a_i#' },
      { label: 'Intégrale', code: '\\int_{a}^{b} #f(x)# \\, dx' },
      { label: 'Intégrale double', code: '\\iint_{D} #f(x,y)# \\, dx\\,dy' },
      { label: 'Intégrale curviligne', code: '\\oint_{C} #\\vec{F}# \\cdot d\\vec{r}' },
      { label: 'Limite', code: '\\lim_{x \\to #\\infty#} f(x)' },
      { label: 'Dérivée', code: '\\frac{d#f#}{dx}' },
      { label: 'Dérivée partielle', code: '\\frac{\\partial #f#}{\\partial x}' },
      { label: 'Gradient / nabla', code: '\\nabla #f#' },
      { label: 'Coefficient binomial', code: '\\binom{n}{#k#}' },
      { label: 'Parenthèses adaptatives', code: '\\left( #x# \\right)' },
      { label: 'Crochets adaptatifs', code: '\\left[ #x# \\right]' },
      { label: 'Accolades adaptatives', code: '\\left\\{ #x# \\right\\}' },
      { label: 'Valeur absolue', code: '\\left| #x# \\right|' },
      { label: 'Norme', code: '\\left\\| #x# \\right\\|' },
      { label: 'Partie entière', code: '\\lfloor #x# \\rfloor' },
      { label: 'Plafond', code: '\\lceil #x# \\rceil' },
      { label: 'Produit scalaire', code: '\\langle #u#, v \\rangle' },
      { label: 'Flèche avec texte', code: '\\xrightarrow{#texte#}' },
      { label: 'Accolade sous formule', code: '\\underbrace{#a + b#}_{\\text{somme}}' },
      { label: 'Accolade sur formule', code: '\\overbrace{#a + b#}^{\\text{somme}}' },
    ],
  },
  {
    id: 'environments',
    name: 'Environnements',
    items: [
      { label: 'Équation numérotée (avec \\label)', code: '#E = mc^2# \\label{eq:nom}', block: true },
      { label: 'Équation avec étiquette (\\tag)', code: '#E = mc^2# \\tag{*}', block: true },
      { label: 'Alignement (aligned)', code: '\\begin{aligned}\n  #a# &= b + c \\\\\n  &= d\n\\end{aligned}', block: true },
      { label: 'Système d\'équations (cases)', code: '\\begin{cases}\n  #2x + 3y = 7# \\\\\n  x - y = 1\n\\end{cases}', block: true },
      {
        label: 'Fonction définie par morceaux',
        code: 'f(x) = \\begin{cases}\n  #x^2# & \\text{si } x \\ge 0 \\\\\n  -x & \\text{sinon}\n\\end{cases}',
        block: true,
      },
      { label: 'Matrice 2×2 ( )', code: '\\begin{pmatrix} #a# & b \\\\ c & d \\end{pmatrix}', block: true },
      { label: 'Matrice 2×2 [ ]', code: '\\begin{bmatrix} #a# & b \\\\ c & d \\end{bmatrix}', block: true },
      { label: 'Déterminant 2×2', code: '\\begin{vmatrix} #a# & b \\\\ c & d \\end{vmatrix}', block: true },
      {
        label: 'Matrice 3×3 ( )',
        code: '\\begin{pmatrix} #a_{11}# & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}',
        block: true,
      },
      {
        label: 'Matrice identité 3×3',
        code: 'I_3 = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}',
        block: true,
      },
      { label: 'Vecteur colonne', code: '\\begin{pmatrix} #x# \\\\ y \\\\ z \\end{pmatrix}', block: true },
      {
        label: 'Tableau avec filets',
        code: '\\begin{array}{c|c}\n  #x# & f(x) \\\\ \\hline\n  0 & 1 \\\\\n  1 & 2\n\\end{array}',
        block: true,
      },
      { label: 'Équations groupées (gathered)', code: '\\begin{gathered}\n  #a = b# \\\\\n  c = d\n\\end{gathered}', block: true },
    ],
  },
  {
    id: 'greek',
    name: 'Grec',
    items: [
      sym('alpha', '\\alpha'), sym('beta', '\\beta'), sym('gamma', '\\gamma'), sym('delta', '\\delta'),
      sym('epsilon', '\\epsilon'), sym('epsilon (variante)', '\\varepsilon'), sym('zeta', '\\zeta'),
      sym('eta', '\\eta'), sym('theta', '\\theta'), sym('theta (variante)', '\\vartheta'), sym('iota', '\\iota'),
      sym('kappa', '\\kappa'), sym('lambda', '\\lambda'), sym('mu', '\\mu'), sym('nu', '\\nu'),
      sym('xi', '\\xi'), sym('pi', '\\pi'), sym('rho', '\\rho'), sym('sigma', '\\sigma'),
      sym('tau', '\\tau'), sym('upsilon', '\\upsilon'), sym('phi', '\\phi'), sym('phi (variante)', '\\varphi'),
      sym('chi', '\\chi'), sym('psi', '\\psi'), sym('omega', '\\omega'),
      sym('Gamma', '\\Gamma'), sym('Delta', '\\Delta'), sym('Theta', '\\Theta'), sym('Lambda', '\\Lambda'),
      sym('Xi', '\\Xi'), sym('Pi', '\\Pi'), sym('Sigma', '\\Sigma'), sym('Upsilon', '\\Upsilon'),
      sym('Phi', '\\Phi'), sym('Psi', '\\Psi'), sym('Omega', '\\Omega'),
    ],
  },
  {
    id: 'operators',
    name: 'Opérateurs',
    items: [
      sym('plus ou moins', '\\pm'), sym('moins ou plus', '\\mp'), sym('multiplié', '\\times'), sym('divisé', '\\div'),
      sym('point (produit)', '\\cdot'), sym('astérisque', '\\ast'), sym('étoile', '\\star'), sym('rond (composition)', '\\circ'),
      sym('bullet', '\\bullet'), sym('somme directe', '\\oplus'), sym('produit tensoriel', '\\otimes'),
      sym('union', '\\cup'), sym('intersection', '\\cap'), sym('différence ensembliste', '\\setminus'),
      sym('et logique', '\\wedge'), sym('ou logique', '\\vee'), sym('négation', '\\neg'),
      sym('nabla', '\\nabla'), sym('dérivée partielle', '\\partial'), sym('infini', '\\infty'),
      sym('h barre', '\\hbar'), sym('ell', '\\ell'), sym('partie réelle', '\\Re'), sym('partie imaginaire', '\\Im'),
      sym('aleph', '\\aleph'), sym('ensemble vide', '\\emptyset'), sym('degré', '^\\circ'), sym('prime', '^{\\prime}'),
      sym('points de suspension', '\\ldots'), sym('points centrés', '\\cdots'), sym('points verticaux', '\\vdots'),
      sym('points diagonaux', '\\ddots'),
    ],
  },
  {
    id: 'relations',
    name: 'Relations',
    items: [
      sym('inférieur ou égal', '\\le'), sym('supérieur ou égal', '\\ge'), sym('différent', '\\neq'),
      sym('environ égal', '\\approx'), sym('équivalent', '\\equiv'), sym('similaire', '\\sim'),
      sym('similaire ou égal', '\\simeq'), sym('congru', '\\cong'), sym('proportionnel', '\\propto'),
      sym('très inférieur', '\\ll'), sym('très supérieur', '\\gg'), sym('inclus', '\\subset'),
      sym('inclus ou égal', '\\subseteq'), sym('contient', '\\supset'), sym('contient ou égal', '\\supseteq'),
      sym('appartient', '\\in'), sym('n\'appartient pas', '\\notin'), sym('contient (élément)', '\\ni'),
      sym('perpendiculaire', '\\perp'), sym('parallèle', '\\parallel'), sym('divise', '\\mid'),
      sym('défini par', ':='), sym('triangle', '\\triangleq'),
    ],
  },
  {
    id: 'arrows',
    name: 'Flèches',
    items: [
      sym('flèche droite', '\\to'), sym('flèche gauche', '\\gets'), sym('flèche double sens', '\\leftrightarrow'),
      sym('implique', '\\Rightarrow'), sym('est impliqué par', '\\Leftarrow'), sym('équivalence', '\\Leftrightarrow'),
      sym('implique (long)', '\\implies'), sym('si et seulement si', '\\iff'), sym('s\'envoie sur', '\\mapsto'),
      sym('flèche longue', '\\longrightarrow'), sym('flèche haut', '\\uparrow'), sym('flèche bas', '\\downarrow'),
      sym('équilibre chimique', '\\rightleftharpoons'), sym('injection', '\\hookrightarrow'),
      sym('flèche montante', '\\nearrow'), sym('flèche descendante', '\\searrow'),
    ],
  },
  {
    id: 'sets',
    name: 'Ensembles & Logique',
    items: [
      sym('pour tout', '\\forall'), sym('il existe', '\\exists'), sym('il n\'existe pas', '\\nexists'),
      sym('donc', '\\therefore'), sym('car', '\\because'),
      sym('entiers naturels', '\\mathbb{N}'), sym('entiers relatifs', '\\mathbb{Z}'), sym('rationnels', '\\mathbb{Q}'),
      sym('réels', '\\mathbb{R}'), sym('complexes', '\\mathbb{C}'), sym('probabilité', '\\mathbb{P}'),
      sym('espérance', '\\mathbb{E}'), sym('ensemble vide', '\\varnothing'), sym('complémentaire', '\\complement'),
      { label: 'Ensemble défini en compréhension', code: '\\left\\{ #x \\in \\mathbb{R}# \\mid x > 0 \\right\\}' },
      { label: 'Intervalle fermé', code: '[#a#, b]' },
      { label: 'Intervalle ouvert', code: ']#a#, b[' },
    ],
  },
  {
    id: 'functions',
    name: 'Fonctions',
    items: [
      sym('sinus', '\\sin'), sym('cosinus', '\\cos'), sym('tangente', '\\tan'), sym('cotangente', '\\cot'),
      sym('arc sinus', '\\arcsin'), sym('arc cosinus', '\\arccos'), sym('arc tangente', '\\arctan'),
      sym('sinus hyperbolique', '\\sinh'), sym('cosinus hyperbolique', '\\cosh'), sym('tangente hyperbolique', '\\tanh'),
      sym('logarithme népérien', '\\ln'), sym('logarithme', '\\log'), { label: 'Logarithme en base b', code: '\\log_{#b#}' },
      sym('exponentielle', '\\exp'), sym('minimum', '\\min'), sym('maximum', '\\max'), sym('borne supérieure', '\\sup'),
      sym('borne inférieure', '\\inf'), sym('déterminant', '\\det'), sym('dimension', '\\dim'), sym('noyau', '\\ker'),
      sym('degré', '\\deg'), sym('pgcd', '\\gcd'), sym('argument', '\\arg'),
      { label: 'Nombre e', code: '\\mathrm{e}^{#x#}' }, { label: 'Unité imaginaire', code: '\\mathrm{i}' },
      { label: 'Opérateur personnalisé', code: '\\operatorname{#nom#}' },
    ],
  },
  {
    id: 'accents',
    name: 'Accents & Polices',
    items: [
      { label: 'Vecteur', code: '\\vec{#v#}' },
      { label: 'Vecteur long (AB)', code: '\\overrightarrow{#AB#}' },
      { label: 'Chapeau', code: '\\hat{#x#}' },
      { label: 'Chapeau large', code: '\\widehat{#xy#}' },
      { label: 'Barre / moyenne', code: '\\overline{#x#}' },
      { label: 'Souligné', code: '\\underline{#x#}' },
      { label: 'Tilde', code: '\\tilde{#x#}' },
      { label: 'Point (dérivée)', code: '\\dot{#x#}' },
      { label: 'Double point', code: '\\ddot{#x#}' },
      { label: 'Ensemble de nombres (gras tableau noir)', code: '\\mathbb{#R#}' },
      { label: 'Calligraphique', code: '\\mathcal{#L#}' },
      { label: 'Gras', code: '\\mathbf{#x#}' },
      { label: 'Gras (symboles grecs)', code: '\\boldsymbol{#\\alpha#}' },
      { label: 'Romain (droit)', code: '\\mathrm{#d#}' },
      { label: 'Gothique', code: '\\mathfrak{#g#}' },
      { label: 'Texte dans une formule', code: '\\text{#texte#}' },
      { label: 'Encadré', code: '\\boxed{#x = 1#}' },
      { label: 'Barré', code: '\\cancel{#x#}' },
      { label: 'Couleur', code: '\\textcolor{red}{#x#}' },
      { label: 'Espace fine', code: '\\,' },
      { label: 'Espace moyenne', code: '\\;' },
      { label: 'Espace cadratin', code: '\\quad' },
    ],
  },
];

export const MATRIX_ENVIRONMENTS: { id: string; label: string }[] = [
  { id: 'pmatrix', label: '( ) Parenthèses' },
  { id: 'bmatrix', label: '[ ] Crochets' },
  { id: 'vmatrix', label: '| | Déterminant' },
  { id: 'Vmatrix', label: '‖ ‖ Norme' },
  { id: 'Bmatrix', label: '{ } Accolades' },
  { id: 'matrix', label: 'Sans délimiteurs' },
];

/** Génère le code d'une matrice rows × cols avec cellules a_{ij}. */
export function buildMatrixCode(env: string, rows: number, cols: number): string {
  const r = Math.max(1, Math.min(10, rows));
  const c = Math.max(1, Math.min(10, cols));
  const lines: string[] = [];
  for (let i = 1; i <= r; i++) {
    const cells: string[] = [];
    for (let j = 1; j <= c; j++) {
      const name = r === 1 || c === 1 ? `a_{${r === 1 ? j : i}}` : `a_{${i}${j}}`;
      cells.push(i === 1 && j === 1 ? `#${name}#` : name);
    }
    lines.push('  ' + cells.join(' & '));
  }
  return `\\begin{${env}}\n${lines.join(' \\\\\n')}\n\\end{${env}}`;
}

/** Aperçu KaTeX d'un gabarit (champ # résolu, directives de numérotation retirées). */
export function templateToPreview(code: string): string {
  return code
    .replace(/#([^#]*)#/, '$1')
    .replace(/\\label\{[^}]*\}/g, '')
    .replace(/\\tag\{[^}]*\}/g, '')
    .trim();
}

export interface LatexInsertion {
  text: string;
  selStart: number; // Position relative au début du texte inséré
  selEnd: number;
}

/**
 * Construit le texte à insérer :
 *  - déjà dans une formule ($...$ ou $$...$$) → code brut ;
 *  - sinon → encapsulé en $...$ (inline) ou en bloc $$ ... $$ (structures de type bloc).
 * `selected` (texte sélectionné) remplace le champ #...# du gabarit.
 */
export function buildLatexInsertion(
  code: string,
  selected: string,
  insideMath: boolean,
  block: boolean = false
): LatexInsertion {
  const m = code.match(/#([^#]*)#/);
  let body = code;
  let selS: number;
  let selE: number;

  if (m && m.index !== undefined) {
    const inner = selected || m[1];
    body = code.slice(0, m.index) + inner + code.slice(m.index + m[0].length);
    selS = m.index;
    selE = m.index + inner.length;
  } else {
    selS = body.length;
    selE = body.length;
  }

  let prefix = '';
  let suffix = '';
  if (!insideMath) {
    if (block) {
      prefix = '\n$$\n';
      suffix = '\n$$\n';
    } else {
      prefix = '$';
      suffix = '$';
    }
  }

  return {
    text: prefix + body + suffix,
    selStart: prefix.length + selS,
    selEnd: prefix.length + selE,
  };
}
