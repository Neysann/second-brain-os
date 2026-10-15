'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { PenTool, Trash2, ChevronsUpDown, Minus, Plus, Loader2, Check } from 'lucide-react';
import type { InkBlockData, InkDocument, InkPaperColor } from '@/types';
import { StylusCanvas } from './StylusCanvas';
import { decodeInk, encodeInk, emptyInkDocument } from '@/lib/inkCodec';
import { inkToSvg } from '@/lib/ink';
import { useSettings } from '@/context/SettingsContext';

export const INK_BLOCK_DEFAULT_HEIGHT = 360;
const INK_BLOCK_MIN_HEIGHT = 200;
const INK_BLOCK_MAX_HEIGHT = 1400;
const INK_BLOCK_STEP = 140;

export interface InlineInkBlockProps {
  noteId: string;
  blockId: string;
  data?: InkBlockData;
  /** Rendu statique (aperçu double colonne) : aucune édition possible. */
  readOnly?: boolean;
  onChange?: (noteId: string, blockId: string, data: InkBlockData) => void;
  onDelete?: (blockId: string) => void;
}

/**
 * Emplacement manuscrit intégré dans une note classique.
 * Édition : canevas Syntropy Stylus à hauteur fixe. Lecture seule : rendu SVG vectoriel.
 */
export const InlineInkBlock: React.FC<InlineInkBlockProps> = ({
  noteId,
  blockId,
  data,
  readOnly = false,
  onChange,
  onDelete,
}) => {
  const { settings } = useSettings();
  const defaultPaper = (settings.defaultInkPaperColor || 'dark') as InkPaperColor;

  const [doc, setDoc] = useState<InkDocument | null>(null);
  const [status, setStatus] = useState<'idle' | 'writing' | 'saved'>('idle');

  const height = data?.h || INK_BLOCK_DEFAULT_HEIGHT;

  // Dernière encre connue (permet de redimensionner sans repasser par le moteur)
  const encodedRef = useRef<string>(data?.ink || '');
  const heightRef = useRef<number>(height);
  heightRef.current = height;
  const pendingDocRef = useRef<InkDocument | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const noteIdRef = useRef(noteId);
  noteIdRef.current = noteId;

  // Décodage initial (le canevas garde ensuite son propre état) ; en lecture seule on suit les mises à jour
  const inkSource = data?.ink || '';
  useEffect(() => {
    let active = true;
    (async () => {
      const decoded = inkSource ? await decodeInk(inkSource) : null;
      if (!active) return;
      setDoc((prev) => {
        // En édition, on ne remplace jamais le document une fois chargé (évite de réinitialiser le canevas)
        if (prev && !readOnly) return prev;
        return decoded || emptyInkDocument(defaultPaper);
      });
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly ? inkSource : blockId]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingDocRef.current;
    if (!pending) return;
    pendingDocRef.current = null;
    try {
      const encoded = await encodeInk(pending);
      encodedRef.current = encoded;
      onChangeRef.current?.(noteIdRef.current, blockId, { ink: encoded, h: heightRef.current });
      setStatus('saved');
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1800);
    } catch (err) {
      console.error('[InlineInkBlock] Erreur encodage :', err);
      setStatus('idle');
    }
  }, [blockId]);

  // Sauvegarde différée 1,5 s après le dernier trait
  const handleCanvasChange = useCallback(
    (next: InkDocument) => {
      pendingDocRef.current = next;
      setStatus('writing');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flush();
      }, 1500);
    },
    [flush]
  );

  // Sauvegarde immédiate au démontage (changement de note ou de mode d'affichage)
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const resize = (delta: number) => {
    const next = Math.max(INK_BLOCK_MIN_HEIGHT, Math.min(INK_BLOCK_MAX_HEIGHT, height + delta));
    if (next === height) return;
    heightRef.current = next;
    onChangeRef.current?.(noteIdRef.current, blockId, { ink: encodedRef.current, h: next });
  };

  const svgMarkup = useMemo(() => {
    if (!readOnly || !doc || doc.strokes.length === 0) return '';
    try {
      return inkToSvg(doc);
    } catch {
      return '';
    }
  }, [readOnly, doc]);

  if (readOnly) {
    return (
      <div className="my-3 rounded-2xl border border-purple-500/30 bg-purple-950/10 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/40 border-b border-purple-500/20">
          <PenTool className="w-3 h-3" />
          Emplacement manuscrit
        </div>
        {svgMarkup ? (
          <div
            className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500 italic">Emplacement vide</div>
        )}
      </div>
    );
  }

  return (
    <div className="my-4 rounded-2xl border border-purple-500/40 bg-purple-950/10 shadow-md shadow-purple-950/20 overflow-hidden select-none">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-purple-950/50 border-b border-purple-500/30">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-300">
          <PenTool className="w-3.5 h-3.5" />
          <span>Emplacement manuscrit</span>
          {status === 'writing' && (
            <span className="flex items-center gap-1 text-amber-300 normal-case font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Enregistrement...</span>
            </span>
          )}
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-300 normal-case font-medium">
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Enregistré</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 mr-1 rounded-lg border border-purple-500/30 bg-zinc-950/40 px-1 py-0.5" title="Hauteur de l'emplacement">
            <ChevronsUpDown className="w-3 h-3 text-purple-400" />
            <button
              type="button"
              onClick={() => resize(-INK_BLOCK_STEP)}
              className="p-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              title="Réduire la hauteur"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => resize(INK_BLOCK_STEP)}
              className="p-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              title="Agrandir la hauteur"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDelete?.(blockId)}
            className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Supprimer cet emplacement manuscrit"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {doc ? (
        <StylusCanvas
          key={blockId}
          initialDocument={doc}
          onChange={handleCanvasChange}
          exportName={`manuscrit-${blockId}`}
          height={height}
          className="!rounded-none !border-0 !shadow-none"
        />
      ) : (
        <div
          className="flex items-center justify-center bg-zinc-950 text-zinc-500 text-xs"
          style={{ height }}
        >
          <Loader2 className="w-4 h-4 animate-spin text-purple-500 mr-2" />
          Chargement de l&apos;emplacement manuscrit...
        </div>
      )}
    </div>
  );
};

export default InlineInkBlock;
