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
  onCopyClipboard: (idOrText: string) => void;
  onPinClipboard: (id: string) => void;
  onDeleteClipboard: (id: string) => void;
  onClearClipboard: () => void;
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
}) => {
  const { addNote, addTask } = useData();
  const [subView, setSubView] = useState<'clipboard' | 'shelf'>(
    shelfItems.length > 0 ? 'shelf' : 'clipboard'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const handleSendShelfToNote = async (e: React.MouseEvent, item: ShelfItem) => {
    e.stopPropagation();
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
        : `# ${item.name}\n\n`;

      await addNote({
        title: item.name,
        content: mdBody,
        category: 'resource',
        tags: ['shelf'],
        attachments: [attachment],
        isPinned: false,
      });
    } else {
      const body = item.content || item.name;
      await addNote({
        title: item.name.slice(0, 60),
        content: `# ${item.name.slice(0, 60)}\n\n${body}\n`,
        category: 'resource',
        tags: ['shelf'],
        isPinned: false,
      });
    }
    setSentId(item.id);
    setTimeout(() => setSentId(null), 1100);
  };

  const handleSendShelfToTask = async (e: React.MouseEvent, item: ShelfItem) => {
    e.stopPropagation();
    await addTask({
      title: item.name.slice(0, 90),
      description: item.content || undefined,
      status: 'todo',
      priority: 'high',
      category: 'project',
      tags: ['shelf'],
    });
    setSentId(item.id);
    setTimeout(() => setSentId(null), 1100);
  };

  const handleSaveClipAsNote = async (e: React.MouseEvent, entry: ClipboardEntry) => {
    e.stopPropagation();
    const firstLine = entry.text.split(/\r?\n/)[0].trim().slice(0, 55) || 'Extrait copié';
    const formatted =
      entry.kind === 'code'
        ? `# ${firstLine}\n\n\`\`\`\n${entry.text}\n\`\`\`\n`
        : `# ${firstLine}\n\n${entry.text}\n`;

    await addNote({
      title: firstLine,
      content: formatted,
      category: 'resource',
      tags: ['presse-papiers'],
      isPinned: false,
    });
    setSentId(entry.id);
    setTimeout(() => setSentId(null), 1100);
  };

  const triggerCopy = (id: string) => {
    onCopyClipboard(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  return (
    <div className="flex flex-col justify-between h-full px-5 pb-3.5 pt-1 select-none">
      {/* Barre supérieure épurée */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSubView('clipboard');
            }}
            className={`h-7 px-3 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              subView === 'clipboard'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Presse-papiers</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSubView('shelf');
            }}
            className={`h-7 px-3 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              subView === 'shelf'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Dropzone {shelfItems.length > 0 ? `(${shelfItems.length})` : ''}</span>
          </button>
        </div>

        {(subView === 'shelf' ? shelfItems.length > 0 : clipboardHistory.length > 0) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (subView === 'shelf') onClearShelf();
              else onClearClipboard();
            }}
            className="w-7 h-7 rounded-full hover:bg-white/[0.08] text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Vider la liste"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Contenu */}
      {subView === 'shelf' ? (
        <div className="flex-1 mt-2 overflow-y-auto space-y-1.5 scrollbar-none">
          {shelfItems.length === 0 ? (
            <div className="h-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center px-4">
              <Inbox className="w-5 h-5 text-zinc-500 mb-1.5" />
              <p className="text-xs font-medium text-zinc-300">
                Déposez un fichier, une image ou un lien ici
              </p>
            </div>
          ) : (
            shelfItems.map((item) => {
              const isSent = sentId === item.id;
              return (
                <div
                  key={item.id}
                  className="h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-between gap-2 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'image' && item.dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="w-6 h-6 rounded-md object-cover flex-shrink-0"
                      />
                    ) : item.type === 'link' ? (
                      <Link2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    ) : item.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    ) : (
                      <FileIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium text-zinc-200 truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleSendShelfToNote(e, item)}
                      className="h-7 px-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-[11px] font-medium text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Envoyer dans les Notes"
                    >
                      {isSent ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span>Note</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSendShelfToTask(e, item)}
                      className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] text-zinc-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title="Créer une tâche"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveShelfItem(item.id);
                      }}
                      className="w-7 h-7 rounded-lg text-zinc-500 hover:text-rose-400 flex items-center justify-center cursor-pointer"
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
        <div className="flex-1 mt-2 overflow-y-auto space-y-1.5 scrollbar-none">
          {!clipboardEnabled ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              Presse-papiers désactivé dans les paramètres
            </div>
          ) : clipboardHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <p className="text-xs font-medium text-zinc-400">Aucun élément copié récemment</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Faites Ctrl+C sur du texte, un lien ou du code
              </p>
            </div>
          ) : (
            clipboardHistory.map((entry) => {
              const isCopied = copiedId === entry.id;
              const isSent = sentId === entry.id;

              return (
                <div
                  key={entry.id}
                  onClick={() => triggerCopy(entry.id)}
                  className="group h-9 px-3 rounded-xl bg-white/[0.035] hover:bg-white/[0.08] flex items-center justify-between gap-2 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {entry.kind === 'link' ? (
                      <Link2 className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    ) : entry.kind === 'code' ? (
                      <Code2 className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-zinc-200 group-hover:text-white truncate">
                      {entry.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {isCopied ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                        Copié
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleSaveClipAsNote(e, entry)}
                          className="w-7 h-7 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                          title="Enregistrer en Note"
                        >
                          {isSent ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinClipboard(entry.id);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer ${
                            entry.pinned
                              ? 'text-amber-400'
                              : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
                          }`}
                          title="Épingler"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClipboard(entry.id);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-rose-400 flex items-center justify-center cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
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
