// Utilitaire d'export LaTeX (.tex) pour les notes Syntropy OS

function escapeLatexText(text: string): string {
  // Échappe les caractères réservés LaTeX hors maths
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Convertit un contenu Markdown enrichi de formules LaTeX et d'emplacements manuscrits
 * en document LaTeX complet prêt à compiler (pdflatex / xelatex).
 */
export function exportNoteToTex(title: string, content: string): string {
  const safeTitle = escapeLatexText(title || 'Note sans titre');
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines = content.split(/\r?\n/);
  const out: string[] = [];

  let inCodeBlock = false;
  let inList: 'itemize' | 'enumerate' | null = null;
  let inMathBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Ignorer les balises d'emplacements manuscrits
    if (/^@@ink:[\w-]+@@$/.test(rawLine.trim())) {
      if (inList) {
        out.push(`\\end{${inList}}`);
        inList = null;
      }
      out.push(`\n% [Emplacement manuscrit inséré ici dans la note originale]\n`);
      continue;
    }

    // Blocs de code ```
    if (rawLine.trim().startsWith('```')) {
      if (inList) {
        out.push(`\\end{${inList}}`);
        inList = null;
      }
      if (!inCodeBlock) {
        inCodeBlock = true;
        out.push('\\begin{verbatim}');
      } else {
        inCodeBlock = false;
        out.push('\\end{verbatim}');
      }
      continue;
    }

    if (inCodeBlock) {
      out.push(rawLine);
      continue;
    }

    // Blocs mathématiques $$...$$
    if (rawLine.trim() === '$$') {
      if (inList) {
        out.push(`\\end{${inList}}`);
        inList = null;
      }
      if (!inMathBlock) {
        inMathBlock = true;
        out.push('\\begin{equation*}');
      } else {
        inMathBlock = false;
        out.push('\\end{equation*}');
      }
      continue;
    }

    if (inMathBlock) {
      out.push(rawLine);
      continue;
    }

    // Gestion des listes
    const isBullet = /^\s*[-*+]\s+(.*)$/.exec(rawLine);
    const isNumbered = /^\s*(\d+)\.\s+(.*)$/.exec(rawLine);

    if (isBullet) {
      if (inList !== 'itemize') {
        if (inList) out.push(`\\end{${inList}}`);
        out.push('\\begin{itemize}');
        inList = 'itemize';
      }
      out.push(`  \\item ${convertInlineMarkdown(isBullet[1])}`);
      continue;
    } else if (isNumbered) {
      if (inList !== 'enumerate') {
        if (inList) out.push(`\\end{${inList}}`);
        out.push('\\begin{enumerate}');
        inList = 'enumerate';
      }
      out.push(`  \\item ${convertInlineMarkdown(isNumbered[2])}`);
      continue;
    } else if (inList && rawLine.trim() === '') {
      out.push(`\\end{${inList}}`);
      inList = null;
    }

    // Titres Markdown
    const h1 = /^#\s+(.*)$/.exec(rawLine);
    const h2 = /^##\s+(.*)$/.exec(rawLine);
    const h3 = /^###\s+(.*)$/.exec(rawLine);
    const h4 = /^####\s+(.*)$/.exec(rawLine);

    if (h1) {
      out.push(`\\section{${convertInlineMarkdown(h1[1])}}`);
      continue;
    }
    if (h2) {
      out.push(`\\subsection{${convertInlineMarkdown(h2[1])}}`);
      continue;
    }
    if (h3) {
      out.push(`\\subsubsection{${convertInlineMarkdown(h3[1])}}`);
      continue;
    }
    if (h4) {
      out.push(`\\paragraph{${convertInlineMarkdown(h4[1])}}`);
      continue;
    }

    // Lignes de séparation
    if (/^(\*\*\*|---|___)$/.test(rawLine.trim())) {
      out.push('\\noindent\\rule{\\linewidth}{0.4pt}');
      continue;
    }

    // Citations
    const quote = /^>\s+(.*)$/.exec(rawLine);
    if (quote) {
      out.push(`\\begin{quote}\n${convertInlineMarkdown(quote[1])}\n\\end{quote}`);
      continue;
    }

    if (rawLine.trim() === '') {
      out.push('');
      continue;
    }

    out.push(convertInlineMarkdown(rawLine));
  }

  if (inList) {
    out.push(`\\end{${inList}}`);
  }
  if (inCodeBlock) {
    out.push('\\end{verbatim}');
  }
  if (inMathBlock) {
    out.push('\\end{equation*}');
  }

  const body = out.join('\n');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[french]{babel}
\\usepackage{amsmath,amssymb,amsfonts,amsthm,mathtools}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{booktabs}
\\usepackage{microtype}

\\geometry{margin=2.5cm}

\\hypersetup{
    colorlinks=true,
    linkcolor=blue!70!black,
    urlcolor=blue!70!black,
    citecolor=blue!70!black
}

\\title{\\textbf{${safeTitle}}}
\\author{Syntropy OS}
\\date{${dateStr}}

\\begin{document}

\\maketitle
\\tableofcontents
\\vspace{1cm}
\\hrule
\\vspace{1cm}

${body}

\\end{document}
`;
}

function convertInlineMarkdown(text: string): string {
  // Segmenter entre ce qui est dans des maths $...$ ou $$...$$ et le texte normal
  const parts: string[] = [];
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(formatNormalText(text.slice(lastIndex, match.index)));
    }
    parts.push(match[0]); // Conserver le code LaTeX tel quel
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(formatNormalText(text.slice(lastIndex)));
  }

  return parts.join('');
}

function formatNormalText(raw: string): string {
  let s = escapeLatexText(raw);
  // Gras: **text** -> \textbf{text}
  s = s.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
  // Italique: *text* -> \textit{text}
  s = s.replace(/\*(.+?)\*/g, '\\textit{$1}');
  // Code inline: `code` -> \texttt{code}
  s = s.replace(/`([^`]+)`/g, '\\texttt{$1}');
  return s;
}

/**
 * Télécharge le contenu sous forme de fichier .tex dans le navigateur
 */
export function downloadTexFile(filename: string, texContent: string) {
  const blob = new Blob([texContent], { type: 'text/x-tex;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.tex') ? filename : `${filename}.tex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
