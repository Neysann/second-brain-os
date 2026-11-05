'use client';

import React, { useState } from 'react';
import {
  Inbox,
  ClipboardList,
  Copy,
  Pin,
  Trash2,
  FileText,
  CheckSquare,
  Link2,
  Code2,
  Image as ImageIcon,
  File as FileIcon,
  Check,
  Sparkles,
} from 'lucide-react';
import { ShelfItem, ClipboardEntry } from '@/types/island';
import { NoteAttachment } from '@/types';
import { useData } from '@/context/DataContext';
import { saveAttachmentLocally } from '@/lib/attachmentStorage';

interface IslandShelfClipboardTabProps {
  shelfItems: ShelfItem[];
  onRemoveShelfItem: (id: string) => void;
  onClearShelf: () => void;
  clipboardHistory: ClipboardEntry[];
  clipboardEnabled: boolean;
  onCopyClipboard: (text: string) => void;
  onPinClipboard: (id: string) => void;
  onDeleteClipboard: (id: string) => void;
  onClearClipboard: () => void;
  accentHex: string;
}

export const IslandShelfClipboardTab: React.FC<IslandShelfClipboardTabProps> = ({
  shelfItems,
  onRemoveShelfItem,
  onClearShelf,
  clipboardHistory,
  clipboardEnabled,
  onCopyClipboard,
  onPinClipboard,
  onDeleteClipboard,
  onClearClipboard,
  accentHex,
}) => {
  const { addNote, addTask } = useData();
  const [subView, setSubView] = useState<'shelf' | 'clipboard'>(
    shelfItems.length > 0 ? 'shelf' : 'clipboard'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const handleSendShelfToNote = async (item: ShelfItem) => {
    const now = new Date().toISOString();
    if ((item.type === 'image' || item.type === 'file') && item.dataUrl) {
      const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await saveAttachmentLocally(attId, item.dataUrl);
      const attachment: NoteAttachment = {
        id: attId,
        name: item.name,
        type: item.mimeType || (item.type === 'image' ? 'image/png' : 'application/octet-stream'),
        size: item.size || item.dataUrl.length,
        dataUrl: item.dataUrl,
        uploadedAt: now,
      };
      const isImg = item.type === 'image' || (item.mimeType && item.mimeType.startsWith('image/'));
      const mdBody = isImg
        ? `# ${item.name}\n\n![${item.name}](attachment:${attId})\n`
        : `# ${item.name}\n\nFichier déposé depuis la Dynamic Island Shelf.\n`;

      await addNote({
        title: item.name,
        content: mdBody,
        category: 'resource',
        tags: ['dynamic-island', 'shelf'],
        attachments: [attachment],
        isPinned: false,
      });
    } else {
      const body = item.content || item.name;
      await addNote({
        title: item.name.slice(0, 60),
        content: `# ${item.name.slice(0, 60)}\n\n${body}\n`,
        category: 'resource',
        tags: ['dynamic-island', 'shelf'],
        isPinned: false,
      });
    }
    setSentId(item.id);
    setTimeout(() => setSentId(null), 1200);
  };

  const handleSendShelfToTask = async (item: ShelfItem) => {
    await addTask({
      title: item.name.slice(0, 90),
      description: item.content || undefined,
      status: 'todo',
      priority: 'high',
      category: 'project',
      tags: ['dynamic-island', 'shelf'],
    });
    setSentId(item.id);
    setTimeout(() => setSentId(null), 1200);
  };

  const handleSaveClipAsNote = async (entry: ClipboardEntry) => {
    const firstLine = entry.text.split(/\r?\n/)[0].trim().slice(0, 55) || 'Extrait Presse-papiers';
    const formatted =
      entry.kind === 'code'
        ? `# ${firstLine}\n\n\`\`\`\n${entry.text}\n\`\`\`\n`
        : `# ${firstLine}\n\n${entry.text}\n`;

    await addNote({
      title: firstLine,
      content: formatted,
      category: 'resource',
      tags: ['presse-papiers', entry.kind],
      isPinned: false,
    });
    setSentId(entry.id);
    setTimeout(() => setSentId(null), 1200);
  };

  const triggerCopy = (id: string, text: string) => {
    onCopyClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  return (
    <div className="flex flex-col justify-between h-[215px] px-3.5 py-2 select-none">
      {/* Sous-navigation : Dropzone Shelf vs Presse-papiers */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setSubView('shelf')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              subView === 'shelf'
                ? 'bg-white text-black shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Inbox className="w-3 h-3" />
            <span>Dropzone Shelf ({shelfItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('clipboard')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              subView === 'clipboard'
                ? 'bg-white text-black shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3 h-3" />
            <span>Presse-papiers ({clipboardHistory.length})</span>
          </button>
        </div>

        {subView === 'shelf' && shelfItems.length > 0 && (
          <button
            type="button"
            onClick={onClearShelf}
            className="text-[10px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Vider</span>
          </button>
        )}

        {subView === 'clipboard' && clipboardHistory.length > 0 && (
          <button
            type="button"
            onClick={onClearClipboard}
            className="text-[10px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Purger</span>
          </button>
        )}
      </div>

      {/* VUE 1 : DROPZONE FILE SHELF */}
      {subView === 'shelf' ? (
        <div className="flex-1 mt-2 overflow-y-auto space-y-1.5 pr-0.5">
          {shelfItems.length === 0 ? (
            <div className="h-[155px] rounded-2xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center px-4">
              <Inbox className="w-6 h-6 text-zinc-400 mb-1.5" style={{ color: accentHex }} />
              <p className="text-xs font-bold text-zinc-200">
                Glissez-déposez des fichiers, images, liens ou textes ici
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Gardez-les sous la main ou envoyez-les en 1 clic dans vos Notes et Tâches Syntropy.
              </p>
            </div>
          ) : (
            shelfItems.map((item) => {
              const isSent = sentId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'image' && item.dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover border border-white/15 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-zinc-300">
                        {item.type === 'link' ? (
                          <Link2 className="w-4 h-4 text-cyan-400" />
                        ) : item.type === 'image' ? (
                          <ImageIcon className="w-4 h-4 text-purple-400" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {item.type.toUpperCase()}
                        {item.size ? ` • ${(item.size / 1024).toFixed(1)} Ko` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendShelfToNote(item)}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 transition-colors cursor-pointer"
                      title="Envoyer vers les Notes Syntropy"
                    >
                      {isSent ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <FileText className="w-3 h-3 text-purple-300" />
                      )}
                      <span>Note</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendShelfToTask(item)}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 transition-colors cursor-pointer"
                      title="Créer une Tâche"
                    >
                      <CheckSquare className="w-3 h-3 text-cyan-300" />
                      <span>Tâche</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveShelfItem(item.id)}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Retirer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VUE 2 : PRESSE-PAPIERS INTELLIGENT (20 ENTRÉES TEXTE / LIENS / CODE) */
        <div className="flex-1 mt-2 overflow-y-auto space-y-1.5 pr-0.5">
          {!clipboardEnabled ? (
            <div className="h-[155px] flex flex-col items-center justify-center text-center px-4 text-zinc-400">
              <p className="text-xs font-bold text-zinc-300">
                Historique du presse-papiers désactivé
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Vous pouvez le réactiver dans Paramètres → Application Desktop → Dynamic Island.
              </p>
            </div>
          ) : clipboardHistory.length === 0 ? (
            <div className="h-[155px] flex flex-col items-center justify-center text-center px-4 text-zinc-400">
              <ClipboardList className="w-6 h-6 text-zinc-500 mb-1.5" />
              <p className="text-xs font-bold text-zinc-300">Presse-papiers vide</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Copiez du texte, un lien ou du code (Ctrl+C) pour le retrouver instantanément ici.
              </p>
            </div>
          ) : (
            clipboardHistory.map((entry) => {
              const isCopied = copiedId === entry.id;
              const isSent = sentId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all"
                >
                  <div
                    onClick={() => triggerCopy(entry.id, entry.text)}
                    className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="p-1 rounded-md bg-white/10 text-zinc-300 flex-shrink-0">
                      {entry.kind === 'link' ? (
                        <Link2 className="w-3 h-3 text-cyan-400" />
                      ) : entry.kind === 'code' ? (
                        <Code2 className="w-3 h-3 text-amber-400" />
                      ) : (
                        <FileText className="w-3 h-3 text-purple-400" />
                      )}
                    </span>
                    <span className="text-xs text-zinc-200 group-hover:text-white truncate font-mono">
                      {entry.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => triggerCopy(entry.id, entry.text)}
                      className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white flex items-center gap-0.5 cursor-pointer"
                      title="Recopier dans le presse-papiers"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveClipAsNote(entry)}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white cursor-pointer"
                      title="Enregistrer en Note Syntropy"
                    >
                      {isSent ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-purple-300" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onPinClipboard(entry.id)}
                      className={`p-1 rounded cursor-pointer ${
                        entry.pinned
                          ? 'text-amber-400 bg-amber-500/20'
                          : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                      title="Épingler"
                    >
                      <Pin className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteClipboard(entry.id)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
