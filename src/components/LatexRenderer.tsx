'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import { useTheme } from '@/context/ThemeContext';
import { Link2, Check } from 'lucide-react';

interface LatexRendererProps {
  content: string;
  className?: string;
  onToggleCheckbox?: (lineIndex: number) => void;
  /** Rendu d'un emplacement manuscrit référencé par une ligne `@@ink:<id>@@`. */
  renderInkBlock?: (blockId: string) => React.ReactNode;
}

interface ParsedEquation {
  id: string;
  index: number;
  tag: string;
  label?: string;
  cleanMath: string;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '', onToggleCheckbox, renderInkBlock }) => {
  const { theme } = useTheme();

  // Fonction de scroll doux vers une équation ciblée
  const handleScrollToEquation = (eqId: string) => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(eqId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2', 'ring-offset-zinc-950');
      setTimeout(() => {
        target.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2', 'ring-offset-zinc-950');
      }, 1800);
    }
  };

  // Pré-analyse des équations pour la numérotation et les références croisées
  const { equationMap, labelMap } = useMemo(() => {
    const eqMap = new Map<number, ParsedEquation>();
    const lblMap = new Map<string, ParsedEquation>();

    if (!content) return { equationMap: eqMap, labelMap: lblMap };

    // Regex pour détecter les blocs $$ ... $$ (y compris multilignes)
    const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
    let match: RegExpExecArray | null;
    let eqCounter = 1;

    while ((match = blockMathRegex.exec(content)) !== null) {
      const rawMath = match[1].trim();

      // Extraction d'un tag personnalisé \tag{...}
      let tag = `(${eqCounter})`;
      const tagMatch = rawMath.match(/\\tag\{([^}]+)\}/);
      if (tagMatch) {
        tag = `(${tagMatch[1]})`;
      }

      // Extraction d'un label \label{...} ou \label{eq:...}
      let label: string | undefined;
      const labelMatch = rawMath.match(/\\label\{([^}]+)\}/);
      if (labelMatch) {
        label = labelMatch[1].trim();
      }

      // Nettoyer \label{...} du TeX pour que KaTeX ne bloque pas
      const cleanMath = rawMath
        .replace(/\\label\{[^}]+\}/g, '')
        .trim();

      const eqId = label ? `eq-${label.replace(/[^a-zA-Z0-9_-]/g, '_')}` : `equation-${eqCounter}`;

      const parsed: ParsedEquation = {
        id: eqId,
        index: eqCounter,
        tag,
        label,
        cleanMath,
      };

      eqMap.set(match.index, parsed);
      if (label) {
        lblMap.set(label, parsed);
        // Aussi mapper sans préfixe eq: si présent
        if (label.startsWith('eq:')) {
          lblMap.set(label.slice(3), parsed);
        }
      }
      eqCounter++;
    }

    return { equationMap: eqMap, labelMap: lblMap };
  }, [content]);

  // Parse le contenu ligne par ligne et bloc par bloc pour gérer le Markdown et LaTeX
  const renderedElements = useMemo(() => {
    if (!content) {
      return (
        <p className="text-zinc-500 italic text-sm">
          Cette note est vide. Commencez à écrire vos réflexions ou formules LaTeX...
        </p>
      );
    }

    const elements: React.ReactNode[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    let inMathBlock = false;
    let mathBlockContent: string[] = [];
    let mathBlockStartIndex = 0;
    let runningCharIndex = 0;

    // Helper pour rendre le texte en ligne avec inline LaTeX ($...$) et inline code/gras/italique
    const renderInlineWithLatex = (text: string, keyPrefix: string): React.ReactNode => {
      // Regex pour matcher :
      // 1. Références croisées : \eqref{...}, \ref{...}, (Éq. X), (Eq. X)
      // 2. Formules : $$...$$, $...$
      // 3. Markdown : `code`, **bold**, *italic*, <u>underline</u>, ~~strike~~, ==highlight==, ![img](url), [link](url), URLs
      const tokenRegex = /(\\eqref\{[^}]+\}|\\ref\{[^}]+\}|\(Éq\.\s*\d+\)|\(Eq\.\s*\d+\)|\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|<u>[\s\S]*?<\/u>|~~[^~]+~~|==[^=]+==|<mark>[\s\S]*?<\/mark>|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g;
      const parts = text.split(tokenRegex);

      return (
        <span key={keyPrefix}>
          {parts.map((part, idx) => {
            if (!part) return null;
            const subKey = `${keyPrefix}-${idx}`;

            // Références croisées : \eqref{eq:nom} ou \ref{eq:nom}
            const refMatch = part.match(/^\\(?:eqref|ref)\{([^}]+)\}$/);
            if (refMatch) {
              const targetKey = refMatch[1].trim();
              const targetEq = labelMap.get(targetKey) || labelMap.get(`eq:${targetKey}`);
              const displayLabel = targetEq ? targetEq.tag : `(${targetKey})`;
              const targetId = targetEq ? targetEq.id : `eq-${targetKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

              return (
                <button
                  key={subKey}
                  type="button"
                  onClick={() => handleScrollToEquation(targetId)}
                  className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-purple-600/15 text-purple-400 hover:bg-purple-600/25 border border-purple-500/30 transition-all cursor-pointer align-baseline"
                  title={`Aller à l'équation ${displayLabel}`}
                >
                  <Link2 className="w-2.5 h-2.5 opacity-70" />
                  <span>{displayLabel}</span>
                </button>
              );
            }

            // Références croisées explicites : (Éq. 1) ou (Eq. 2)
            const explicitEqMatch = part.match(/^\((?:Éq\.|Eq\.)\s*(\d+)\)$/);
            if (explicitEqMatch) {
              const eqNum = parseInt(explicitEqMatch[1], 10);
              const targetId = `equation-${eqNum}`;

              return (
                <button
                  key={subKey}
                  type="button"
                  onClick={() => handleScrollToEquation(targetId)}
                  className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-purple-600/15 text-purple-400 hover:bg-purple-600/25 border border-purple-500/30 transition-all cursor-pointer align-baseline"
                  title={`Aller à l'équation (${eqNum})`}
                >
                  <Link2 className="w-2.5 h-2.5 opacity-70" />
                  <span>(Éq. {eqNum})</span>
                </button>
              );
            }

            // Math bloc inline $$...$$
            if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
              const math = part.slice(2, -2).trim();
              try {
                const html = katex.renderToString(math, {
                  displayMode: true,
                  throwOnError: false,
                });
                return (
                  <span
                    key={subKey}
                    className="my-3 block overflow-x-auto py-1 text-center font-serif text-lg selection:bg-purple-500/30"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch {
                return (
                  <code key={subKey} className="text-rose-400 bg-rose-500/10 px-1 rounded">
                    {part}
                  </code>
                );
              }
            }

            // Math inline $...$
            if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
              const math = part.slice(1, -1).trim();
              try {
                const html = katex.renderToString(math, {
                  displayMode: false,
                  throwOnError: false,
                });
                return (
                  <span
                    key={subKey}
                    className="inline-block px-1 font-serif text-[1.05em] align-baseline selection:bg-purple-500/30"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch {
                return (
                  <code key={subKey} className="text-rose-400 bg-rose-500/10 px-1 rounded">
                    {part}
                  </code>
                );
              }
            }

            // Code inline `code`
            if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
              return (
                <code
                  key={subKey}
                  className={`px-1.5 py-0.5 rounded text-xs font-mono border ${
                    theme === 'dark'
                      ? 'bg-zinc-800 text-purple-300 border-zinc-700'
                      : 'bg-zinc-100 text-purple-700 border-zinc-200'
                  }`}
                >
                  {part.slice(1, -1)}
                </code>
              );
            }

            // Gras **texte**
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
              return (
                <strong key={subKey} className="font-bold text-inherit">
                  {part.slice(2, -2)}
                </strong>
              );
            }

            // Italique *texte*
            if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
              return (
                <em key={subKey} className="italic text-inherit">
                  {part.slice(1, -1)}
                </em>
              );
            }

            // Souligné <u>texte</u>
            if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
              return (
                <u key={subKey} className="underline underline-offset-3 decoration-indigo-400 decoration-2">
                  {part.slice(3, -4)}
                </u>
              );
            }

            // Barré ~~texte~~
            if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
              return (
                <s key={subKey} className="line-through opacity-75 decoration-zinc-400">
                  {part.slice(2, -2)}
                </s>
              );
            }

            // Surligné ==texte== ou <mark>texte</mark>
            if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
              return (
                <mark
                  key={subKey}
                  className={`px-1.5 py-0.5 rounded font-medium ${
                    theme === 'dark'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {part.slice(2, -2)}
                </mark>
              );
            }
            if (part.startsWith('<mark>') && part.endsWith('</mark>') && part.length >= 13) {
              return (
                <mark
                  key={subKey}
                  className={`px-1.5 py-0.5 rounded font-medium ${
                    theme === 'dark'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {part.slice(6, -7)}
                </mark>
              );
            }

            // Image Markdown ![alt](url)
            const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            if (imgMatch) {
              return (
                <img
                  key={subKey}
                  src={imgMatch[2]}
                  alt={imgMatch[1] || 'Illustration'}
                  className="max-h-96 rounded-xl my-2 border border-zinc-700/40 object-contain shadow-md"
                />
              );
            }

            // Lien Markdown [texte](url)
            const mdLinkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (mdLinkMatch) {
              return (
                <a
                  key={subKey}
                  href={mdLinkMatch[2]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all font-medium"
                >
                  {mdLinkMatch[1]}
                </a>
              );
            }

            // URL simple
            if (part.startsWith('http://') || part.startsWith('https://')) {
              return (
                <a
                  key={subKey}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all"
                >
                  {part}
                </a>
              );
            }

            return <span key={subKey}>{part}</span>;
          })}
        </span>
      );
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Blocs de code ```
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3).trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <div
              key={`code-${i}`}
              className={`my-3 rounded-xl border p-3 font-mono text-xs overflow-x-auto ${
                theme === 'dark'
                  ? 'bg-zinc-950/80 border-zinc-800 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-emerald-300'
              }`}
            >
              {codeBlockLang && (
                <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
                  {codeBlockLang}
                </div>
              )}
              <pre className="m-0 leading-relaxed">{codeBlockContent.join('\n')}</pre>
            </div>
          );
        }
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      // Blocs de formules LaTeX $$ ... $$ (sur une ligne OU multilignes)
      const trimmedLine = line.trim();
      if (!inMathBlock && trimmedLine.startsWith('$$')) {
        if (trimmedLine.endsWith('$$') && trimmedLine.length > 2) {
          // Bloc $$ ... $$ sur une seule ligne
          const math = trimmedLine.slice(2, -2).trim();
          const parsed = equationMap.get(runningCharIndex) || {
            id: `equation-${elements.length}`,
            index: elements.length + 1,
            tag: `(${elements.length + 1})`,
            cleanMath: math.replace(/\\label\{[^}]+\}/g, '').trim(),
          };

          try {
            const html = katex.renderToString(parsed.cleanMath, {
              displayMode: true,
              throwOnError: false,
            });

            elements.push(
              <div
                key={`latex-block-${i}`}
                id={parsed.id}
                className={`group my-4 p-4 rounded-xl border relative flex items-center justify-between overflow-x-auto shadow-xs transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-100 hover:border-purple-500/40'
                    : 'bg-white border-zinc-200 text-zinc-900 hover:border-purple-400'
                }`}
              >
                <div
                  className="flex-1 flex justify-center py-1 font-serif text-lg selection:bg-purple-500/30 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                <button
                  type="button"
                  onClick={() => handleScrollToEquation(parsed.id)}
                  className="flex-shrink-0 ml-3 px-2 py-0.5 rounded text-xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  title={`Équation ${parsed.tag} — Cliquer pour ancrer`}
                >
                  {parsed.tag}
                </button>
              </div>
            );
          } catch {
            elements.push(
              <div key={`latex-err-${i}`} className="text-rose-400 bg-rose-500/10 p-2 rounded text-xs">
                Erreur de syntaxe LaTeX : {line}
              </div>
            );
          }

          runningCharIndex += line.length + 1;
          i++;
          continue;
        } else {
          // Début d'un bloc multiligne $$
          inMathBlock = true;
          mathBlockStartIndex = runningCharIndex;
          mathBlockContent = [trimmedLine.slice(2)];
          runningCharIndex += line.length + 1;
          i++;
          continue;
        }
      }

      if (inMathBlock) {
        if (trimmedLine.endsWith('$$')) {
          inMathBlock = false;
          mathBlockContent.push(trimmedLine.slice(0, -2));
          const fullMath = mathBlockContent.join('\n').trim();

          const parsed = equationMap.get(mathBlockStartIndex) || {
            id: `equation-${elements.length}`,
            index: elements.length + 1,
            tag: `(${elements.length + 1})`,
            cleanMath: fullMath.replace(/\\label\{[^}]+\}/g, '').trim(),
          };

          try {
            const html = katex.renderToString(parsed.cleanMath, {
              displayMode: true,
              throwOnError: false,
            });

            elements.push(
              <div
                key={`latex-block-${i}`}
                id={parsed.id}
                className={`group my-4 p-4 rounded-xl border relative flex items-center justify-between overflow-x-auto shadow-xs transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-100 hover:border-purple-500/40'
                    : 'bg-white border-zinc-200 text-zinc-900 hover:border-purple-400'
                }`}
              >
                <div
                  className="flex-1 flex justify-center py-1 font-serif text-lg selection:bg-purple-500/30 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                <button
                  type="button"
                  onClick={() => handleScrollToEquation(parsed.id)}
                  className="flex-shrink-0 ml-3 px-2 py-0.5 rounded text-xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  title={`Équation ${parsed.tag} — Cliquer pour ancrer`}
                >
                  {parsed.tag}
                </button>
              </div>
            );
          } catch {
            elements.push(
              <div key={`latex-err-${i}`} className="text-rose-400 bg-rose-500/10 p-2 rounded text-xs">
                Erreur de syntaxe LaTeX dans le bloc
              </div>
            );
          }

          runningCharIndex += line.length + 1;
          i++;
          continue;
        } else {
          mathBlockContent.push(line);
          runningCharIndex += line.length + 1;
          i++;
          continue;
        }
      }

      // Emplacement manuscrit intégré : ligne `@@ink:<id>@@`
      const inkMarkerMatch = line.trim().match(/^@@ink:([\w-]+)@@$/);
      if (inkMarkerMatch) {
        const blockId = inkMarkerMatch[1];
        elements.push(
          <div key={`ink-${blockId}`}>
            {renderInkBlock ? (
              renderInkBlock(blockId)
            ) : (
              <div className="my-3 py-6 rounded-2xl border border-dashed border-purple-500/40 text-center text-xs text-purple-300/80">
                🖊️ Emplacement manuscrit
              </div>
            )}
          </div>
        );
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      // Titres H1, H2, H3, H4
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-2xl lg:text-3xl font-extrabold mt-6 mb-3 pb-1 border-b border-inherit tracking-tight"
          >
            {renderInlineWithLatex(line.slice(2), `h1-${i}`)}
          </h1>
        );
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${i}`}
            className="text-xl lg:text-2xl font-bold mt-5 mb-2 tracking-tight text-indigo-400 dark:text-indigo-300"
          >
            {renderInlineWithLatex(line.slice(3), `h2-${i}`)}
          </h2>
        );
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-lg font-semibold mt-4 mb-1.5 text-zinc-300 dark:text-zinc-200"
          >
            {renderInlineWithLatex(line.slice(4), `h3-${i}`)}
          </h3>
        );
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      if (line.startsWith('#### ')) {
        elements.push(
          <h4
            key={`h4-${i}`}
            className="text-base font-semibold mt-3 mb-1 text-zinc-300 dark:text-zinc-200"
          >
            {renderInlineWithLatex(line.slice(5), `h4-${i}`)}
          </h4>
        );
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      // Tableaux Markdown | Col 1 | Col 2 |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        const startTableIdx = i;
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          runningCharIndex += lines[i].length + 1;
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCols = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
          const hasDivider = tableLines[1].includes('---');
          const rowStart = hasDivider ? 2 : 1;
          const bodyRows = tableLines.slice(rowStart).map(r => r.split('|').slice(1, -1).map(c => c.trim()));

          elements.push(
            <div key={`table-${startTableIdx}`} className="my-4 overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className={theme === 'dark' ? 'bg-zinc-900 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}>
                  <tr>
                    {headerCols.map((col, cIdx) => (
                      <th key={`th-${cIdx}`} className="p-2.5 font-bold border-b border-inherit">
                        {renderInlineWithLatex(col, `th-${startTableIdx}-${cIdx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={`tr-${rIdx}`} className={theme === 'dark' ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'}>
                      {row.map((cell, cIdx) => (
                        <td key={`td-${rIdx}-${cIdx}`} className="p-2.5">
                          {renderInlineWithLatex(cell, `td-${startTableIdx}-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Détection des éléments de liste :
      // 1. Cases à cocher / tâches : - [ ], - [x], * [ ], 1. [ ] etc.
      // 2. Puces : - item, * item, + item
      // 3. Numérotés : 1. item, 2) item etc.
      const taskRegex = /^(\s*)(?:[-*+]|\d+[\.\)])\s+\[([ xX])\](?:\s+(.*))?$/;
      const bulletRegex = /^(\s*)[-*+]\s+(.*)$/;
      const numberedRegex = /^(\s*)(\d+)[\.\)](?:\s+(.*))?$/;

      const isListItem = (l: string) => {
        return taskRegex.test(l) || bulletRegex.test(l) || numberedRegex.test(l);
      };

      if (isListItem(line)) {
        const listItems: React.ReactNode[] = [];
        const startListLine = i;

        while (i < lines.length && isListItem(lines[i])) {
          const currentLine = lines[i];
          const lineIdx = i;

          const taskMatch = currentLine.match(taskRegex);
          if (taskMatch) {
            const indentSpaces = taskMatch[1].replace(/\t/g, '  ').length;
            const isChecked = taskMatch[2].toLowerCase() === 'x';
            const itemText = taskMatch[3] ? taskMatch[3].trim() : '';
            const indentLevel = Math.min(Math.floor(indentSpaces / 2), 6);

            listItems.push(
              <div
                key={`task-${lineIdx}`}
                style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
                className="flex items-start gap-2.5 py-1 text-inherit group/task"
              >
                <button
                  type="button"
                  onClick={() => onToggleCheckbox?.(lineIdx)}
                  disabled={!onToggleCheckbox}
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                    onToggleCheckbox ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                  } ${
                    isChecked
                      ? 'bg-purple-600 text-white shadow-xs shadow-purple-600/30 border border-purple-500'
                      : theme === 'dark'
                      ? 'border border-zinc-600 bg-zinc-800/70 hover:border-purple-400 hover:bg-zinc-700/60'
                      : 'border border-zinc-300 bg-zinc-100 hover:border-purple-400 hover:bg-white'
                  }`}
                  title={onToggleCheckbox ? (isChecked ? 'Cliquer pour décocher' : 'Cliquer pour cocher') : undefined}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span
                  className={`flex-1 leading-snug transition-all ${
                    isChecked
                      ? 'line-through opacity-75 decoration-purple-400/60 text-zinc-400 dark:text-zinc-500'
                      : 'text-inherit'
                  }`}
                >
                  {itemText ? renderInlineWithLatex(itemText, `task-text-${lineIdx}`) : <span className="opacity-40 italic text-xs">(Élément vide)</span>}
                </span>
              </div>
            );
            runningCharIndex += currentLine.length + 1;
            i++;
            continue;
          }

          const bulletMatch = currentLine.match(bulletRegex);
          if (bulletMatch) {
            const indentSpaces = bulletMatch[1].replace(/\t/g, '  ').length;
            const itemText = bulletMatch[2] ? bulletMatch[2].trim() : '';
            const indentLevel = Math.min(Math.floor(indentSpaces / 2), 6);

            listItems.push(
              <div
                key={`bullet-${lineIdx}`}
                style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
                className="flex items-start gap-2.5 py-1 text-inherit"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 mt-2 flex-shrink-0" />
                <span className="flex-1 leading-snug text-inherit">
                  {itemText ? renderInlineWithLatex(itemText, `bullet-text-${lineIdx}`) : <span className="opacity-40 italic text-xs">(Élément vide)</span>}
                </span>
              </div>
            );
            runningCharIndex += currentLine.length + 1;
            i++;
            continue;
          }

          const numMatch = currentLine.match(numberedRegex);
          if (numMatch) {
            const indentSpaces = numMatch[1].replace(/\t/g, '  ').length;
            const num = numMatch[2];
            const itemText = numMatch[3] ? numMatch[3].trim() : '';
            const indentLevel = Math.min(Math.floor(indentSpaces / 2), 6);

            listItems.push(
              <div
                key={`num-${lineIdx}`}
                style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
                className="flex items-start gap-2 py-1 text-inherit"
              >
                <span className="text-xs font-mono font-bold text-purple-400 dark:text-purple-300 min-w-[1.25rem] text-right flex-shrink-0 select-none mt-0.5">
                  {num}.
                </span>
                <span className="flex-1 leading-snug text-inherit">
                  {itemText ? renderInlineWithLatex(itemText, `num-text-${lineIdx}`) : <span className="opacity-40 italic text-xs">(Élément vide)</span>}
                </span>
              </div>
            );
            runningCharIndex += currentLine.length + 1;
            i++;
            continue;
          }

          break;
        }

        elements.push(
          <div key={`list-block-${startListLine}`} className="my-2.5 space-y-0.5">
            {listItems}
          </div>
        );
        continue;
      }

      // Citation >
      if (line.startsWith('>')) {
        const quoteContent = line.startsWith('> ') ? line.slice(2) : line.slice(1);
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-3 pl-4 border-l-4 border-purple-500 italic text-zinc-400 dark:text-zinc-400 bg-purple-500/5 py-1.5 rounded-r-lg"
          >
            {renderInlineWithLatex(quoteContent, `quote-${i}`)}
          </blockquote>
        );
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      // Séparateur horizontal ---
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={`hr-${i}`} className="my-6 border-inherit" />);
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      // Ligne vide
      if (!line.trim()) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        runningCharIndex += line.length + 1;
        i++;
        continue;
      }

      // Paragraphe standard
      elements.push(
        <p key={`p-${i}`} className="my-2 leading-relaxed text-inherit">
          {renderInlineWithLatex(line, `p-${i}`)}
        </p>
      );

      runningCharIndex += line.length + 1;
      i++;
    }

    return elements;
  }, [content, theme, equationMap, labelMap, onToggleCheckbox, renderInkBlock]);

  return <div className={`space-y-1 font-sans ${className}`}>{renderedElements}</div>;
};

export default LatexRenderer;
