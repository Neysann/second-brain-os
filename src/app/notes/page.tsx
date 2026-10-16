'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  Pin,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  Columns2,
  Eye,
  Edit3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Sparkles,
  Folder,
  FolderPlus,
  FileText,
  File,
  Paperclip,
  UploadCloud,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CornerDownRight,
  FolderTree,
  Clock,
  Link2,
  PenTool,
  ArrowRight,
  ArrowLeftRight,
  LayoutTemplate,
  FileSpreadsheet,
  Presentation,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Cloud,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { ParaCategory, NoteAttachment, Note, NoteFolder, InkBlockData } from '@/types';
import LatexRenderer from '@/components/LatexRenderer';
import { LatexLivePreview } from '@/components/LatexLivePreview';
import { tryExpandSnippet, getActiveMathContext, ActiveMathContext } from '@/lib/latexSnippets';
import LatexHelperModal from '@/components/LatexHelperModal';
import LatexTutorialModal from '@/components/LatexTutorialModal';
import NoteTemplateModal from '@/components/NoteTemplateModal';
import { NOTE_TEMPLATES, NoteTemplate } from '@/lib/noteTemplates';
import InkNoteEditor from '@/components/InkNoteEditor';
import { processImportedFile, detectDocumentType } from '@/lib/documentImporter';
import { loadAttachmentDataUrl, deleteAttachmentChunks, loadInkBlocksChunks } from '@/lib/dataService';
import { getAttachmentLocally } from '@/lib/attachmentStorage';
import { LatexToolbar } from '@/components/LatexToolbar';
import { InlineInkBlock } from '@/components/InlineInkBlock';
import { exportNoteToTex, downloadTexFile } from '@/lib/latexExport';
import { buildLatexInsertion } from '@/lib/latexPalette';

type EditorViewMode = 'write' | 'split' | 'preview' | 'ink';

interface ContentSegment {
  type: 'text' | 'ink';
  blockId?: string;
  text?: string;
  startOffset: number;
}

function parseSegments(rawContent: string): ContentSegment[] {
  const markerRegex = /^@@ink:([\w-]+)@@$/m;
  if (!markerRegex.test(rawContent)) {
    return [{ type: 'text', text: rawContent, startOffset: 0 }];
  }

  const lines = rawContent.split(/\r?\n/);
  const segments: ContentSegment[] = [];
  let currentTextLines: string[] = [];
  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = /^@@ink:([\w-]+)@@$/.exec(line.trim());
    if (match) {
      if (currentTextLines.length > 0) {
        const text = currentTextLines.join('\n');
        segments.push({
          type: 'text',
          text,
          startOffset: currentOffset,
        });
        currentOffset += text.length + 1;
        currentTextLines = [];
      }
      segments.push({
        type: 'ink',
        blockId: match[1],
        startOffset: currentOffset,
      });
      currentOffset += line.length + 1;
    } else {
      currentTextLines.push(line);
    }
  }

  if (currentTextLines.length > 0 || segments.length === 0) {
    const text = currentTextLines.join('\n');
    segments.push({
      type: 'text',
      text,
      startOffset: currentOffset,
    });
  }

  return segments;
}

const FOLDER_COLORS = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Violet', color: '#8b5cf6' },
  { name: 'Rose', color: '#ec4899' },
  { name: 'Émeraude', color: '#10b981' },
  { name: 'Ambre', color: '#f59e0b' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Bleu', color: '#3b82f6' },
  { name: 'Corail', color: '#ef4444' },
];

interface FolderTreeNode {
  folder: NoteFolder;
  children: FolderTreeNode[];
  level: number;
}

// Récupère l'ensemble des IDs descendants (dossier + tous ses sous-dossiers récursivement)
function getFolderDescendantIds(folderId: string, allFolders: NoteFolder[]): Set<string> {
  const ids = new Set<string>([folderId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        added = true;
      }
    }
  }
  return ids;
}

// Chemin complet d'un dossier sous forme de liste [racine, parent, enfant...]
function getFolderPath(folderId: string | undefined | null, allFolders: NoteFolder[]): NoteFolder[] {
  if (!folderId) return [];
  const map = new Map<string, NoteFolder>();
  allFolders.forEach((f) => map.set(f.id, f));

  const path: NoteFolder[] = [];
  let curr = map.get(folderId);
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    path.unshift(curr);
    curr = curr.parentId ? map.get(curr.parentId) : undefined;
  }
  return path;
}

// Construction de l'arbre hiérarchique des dossiers
function buildFolderTree(allFolders: NoteFolder[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>();
  allFolders.forEach((f) => {
    map.set(f.id, { folder: f, children: [], level: 0 });
  });

  const roots: FolderTreeNode[] = [];

  allFolders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId) && f.parentId !== f.id) {
      const parent = map.get(f.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const fixLevels = (nodes: FolderTreeNode[], lvl: number) => {
    nodes.forEach((n) => {
      n.level = lvl;
      fixLevels(n.children, lvl + 1);
    });
  };
  fixLevels(roots, 0);

  return roots;
}

// Aplatissement ordonné pour les listes déroulantes (select)
function flattenFolderTree(nodes: FolderTreeNode[]): { id: string; name: string; level: number; color?: string }[] {
  const result: { id: string; name: string; level: number; color?: string }[] = [];
  const traverse = (list: FolderTreeNode[]) => {
    list.forEach((item) => {
      result.push({
        id: item.folder.id,
        name: item.folder.name,
        level: item.level,
        color: item.folder.color,
      });
      if (item.children.length > 0) {
        traverse(item.children);
      }
    });
  };
  traverse(nodes);
  return result;
}

function NotesContent() {
  const { notes, addNote, updateNote, deleteNote, projects, folders, addFolder, updateFolder, deleteFolder, stats } = useData();
  const { theme } = useTheme();
  const { settings } = useSettings();
  const searchParams = useSearchParams();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Blocs manuscrits au sein des notes classiques
  const [inkBlocks, setInkBlocks] = useState<Record<string, InkBlockData>>({});
  const inkBlocksRef = useRef<Record<string, InkBlockData>>({});
  const inkReadyRef = useRef<boolean>(true);

  // Note fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ParaCategory>('resource');
  const [folderId, setFolderId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedParaFilter, setSelectedParaFilter] = useState<ParaCategory | 'all'>('all');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);
  const [showFolderAccordion, setShowFolderAccordion] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Editor and Modals
  const [viewMode, setViewMode] = useState<EditorViewMode>(settings.defaultEditorMode || 'write');
  const [isLatexModalOpen, setIsLatexModalOpen] = useState(false);
  const [isLatexTutorialOpen, setIsLatexTutorialOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeMathContext, setActiveMathContext] = useState<ActiveMathContext | null>(null);

  // Folder creation modal & tree
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());

  // Documents and Attachments
  const [activePdfAttachment, setActivePdfAttachment] = useState<NoteAttachment | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<NoteAttachment | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [loadingAttId, setLoadingAttId] = useState<string | null>(null);
  const [isSyncingAllAttachments, setIsSyncingAllAttachments] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isNewNoteMenuOpen, setIsNewNoteMenuOpen] = useState(false);
  const newNoteMenuRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorFilePickerRef = useRef<HTMLInputElement | null>(null);

  // Fermeture du menu de format de note au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newNoteMenuRef.current && !newNoteMenuRef.current.contains(e.target as Node)) {
        setIsNewNoteMenuOpen(false);
      }
    };
    if (isNewNoteMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNewNoteMenuOpen]);

  const handledNewInkRef = useRef(false);
  const handleCreateNewNoteRef = useRef<(format?: 'text' | 'ink') => Promise<void>>(async () => {});

  // Formatage de la taille des fichiers
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Synchronisation de l'URL avec ouverture automatique du dossier correspondant ou création
  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId && notes.some((n) => n.id === urlId)) {
      setSelectedNoteId(urlId);
      const targetNote = notes.find((n) => n.id === urlId);
      if (targetNote) {
        setSelectedFolderFilter(targetNote.folderId || '__none__');
      }
    } else if (searchParams.get('action') === 'new-ink') {
      if (!handledNewInkRef.current) {
        handledNewInkRef.current = true;
        handleCreateNewNoteRef.current('ink');
      }
    } else if (searchParams.get('action') === 'new') {
      setSelectedNoteId(null);
      setTitle('');
      setContent('');
      setCategory('resource');
      setFolderId('');
      setProjectId('');
      setTagsInput('');
      setIsPinned(false);
      setAttachments([]);
    }
  }, [searchParams, notes]);

  // Auto-expansion des dossiers parents lors du chargement des dossiers
  useEffect(() => {
    if (folders.length > 0) {
      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        folders.forEach((f) => {
          if (f.parentId) {
            next.add(f.parentId);
          }
        });
        return next;
      });
    }
  }, [folders]);

  // Si un dossier ou une note avec dossier est actif, ouvrir récursivement ses dossiers parents
  useEffect(() => {
    const targetFolderId = selectedFolderFilter || folderId;
    if (targetFolderId && targetFolderId !== '__none__') {
      const path = getFolderPath(targetFolderId, folders);
      if (path.length > 1) {
        setExpandedFolderIds((prev) => {
          const next = new Set(prev);
          for (let i = 0; i < path.length - 1; i++) {
            next.add(path[i].id);
          }
          return next;
        });
      }
    }
  }, [selectedFolderFilter, folderId, folders]);

  const currentNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Métriques de la note (mots, caractères, temps de lecture)
  const noteMetrics = useMemo(() => {
    const rawText = content || '';
    const cleanText = rawText.replace(/[#*`_~[\]()]/g, ' ').trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const chars = rawText.length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTimeMinutes };
  }, [content]);

  // Liens bidirectionnels & Notes connectées (Backlinks)
  const connectedNotes = useMemo(() => {
    if (!currentNote || !settings.showBacklinks) return [];
    return notes
      .filter((n) => {
        if (n.id === currentNote.id) return false;
        // Mention dans le texte avec syntaxe [[Titre]]
        if (currentNote.title && n.content?.includes(`[[${currentNote.title}]]`)) return true;
        if (n.title && currentNote.content?.includes(`[[${n.title}]]`)) return true;
        // Même dossier
        if (currentNote.folderId && n.folderId === currentNote.folderId) return true;
        // Tags en commun
        if (currentNote.tags && n.tags && currentNote.tags.some((t) => n.tags.includes(t))) return true;
        return false;
      })
      .slice(0, 6);
  }, [currentNote, notes, settings.showBacklinks]);

  const latestNoteRef = useRef<Note | null>(currentNote);
  latestNoteRef.current = currentNote;
  const notesRef = useRef<typeof notes>(notes);
  notesRef.current = notes;

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content || '');
      setCategory(currentNote.category);
      setFolderId(currentNote.folderId || '');
      setProjectId(currentNote.projectId || '');
      setTagsInput(currentNote.tags?.join(', ') || '');
      setIsPinned(Boolean(currentNote.isPinned));
      const initialAtts = currentNote.attachments || [];
      setAttachments(initialAtts);
      
      // Hydratation silencieuse et instantanée depuis le cache permanent IndexedDB de l'appareil
      if (initialAtts.length > 0) {
        Promise.all(
          initialAtts.map(async (att) => {
            if (att.dataUrl && att.dataUrl.length > 100) return att;
            const cached = await getAttachmentLocally(att.id);
            return cached ? { ...att, dataUrl: cached } : att;
          })
        ).then(async (hydrated) => {
          setAttachments(hydrated);

          // Synchronisation Cloud automatique rétroactive :
          // Si des pièces jointes ont des données locales mais ne sont pas encore marquées comme synchronisées
          const needsCloudUpload = hydrated.some(
            (a) => (!a.isCloudSynced || !a.chunksCount) && a.dataUrl && a.dataUrl.length > 100
          );
          if (needsCloudUpload) {
            console.log('[Syntropy] ☁️ Synchronisation Cloud rétroactive en cours...');
            try {
              await updateNote({
                ...currentNote,
                attachments: hydrated,
                updatedAt: new Date().toISOString(),
              });
              setAttachments((prev) => prev.map((a) => ({ ...a, isCloudSynced: true })));
              console.log('[Syntropy] ✅ Fichiers joints synchronisés sur le Cloud !');
            } catch (err) {
              console.warn('[Syntropy] Échec de la synchronisation automatique des pièces jointes :', err);
            }
          }
        });
      }

      // Chargement des blocs manuscrits intégrés (inkBlocks)
      if (currentNote.inkBlocks) {
        try {
          const parsed = typeof currentNote.inkBlocks === 'string'
            ? JSON.parse(currentNote.inkBlocks)
            : currentNote.inkBlocks;
          setInkBlocks(parsed || {});
          inkBlocksRef.current = parsed || {};
          inkReadyRef.current = true;
        } catch {
          setInkBlocks({});
          inkBlocksRef.current = {};
          inkReadyRef.current = true;
        }
      } else if (currentNote.inkBlocksChunks && currentNote.inkBlocksChunks > 0) {
        inkReadyRef.current = false;
        loadInkBlocksChunks(currentNote.id).then((raw) => {
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              setInkBlocks(parsed || {});
              inkBlocksRef.current = parsed || {};
            } catch {
              setInkBlocks({});
              inkBlocksRef.current = {};
            }
          }
          inkReadyRef.current = true;
        });
      } else {
        setInkBlocks({});
        inkBlocksRef.current = {};
        inkReadyRef.current = true;
      }

      setSaveStatus('saved');

      // Basculer automatiquement en mode Manuscrit si la note est au format 'ink'
      if (currentNote.format === 'ink') {
        setViewMode('ink');
      } else if (viewMode === 'ink') {
        setViewMode(settings.defaultEditorMode || 'write');
      }
    }
  }, [currentNote?.id]);

  const handleSaveInk = async (noteId: string, encodedInk: string) => {
    const base = notesRef.current.find((n) => n.id === noteId);
    if (!base) return;
    setSaveStatus('saving');
    await updateNote({
      ...base,
      ink: encodedInk,
      format: 'ink',
      updatedAt: new Date().toISOString(),
    });
    setSaveStatus('saved');
  };

  const handleInkBlockChange = async (noteId: string, blockId: string, data: InkBlockData) => {
    const nextMap = {
      ...inkBlocksRef.current,
      [blockId]: data,
    };
    inkBlocksRef.current = nextMap;
    setInkBlocks(nextMap);

    const base = notesRef.current.find((n) => n.id === noteId);
    if (!base) return;

    await updateNote({
      ...base,
      content,
      inkBlocks: JSON.stringify(nextMap),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteInkBlock = (blockId: string) => {
    if (confirm('Voulez-vous supprimer cet emplacement manuscrit ? Les tracés associés seront effacés.')) {
      const nextMap = { ...inkBlocksRef.current };
      delete nextMap[blockId];
      inkBlocksRef.current = nextMap;
      setInkBlocks(nextMap);

      const markerRegex = new RegExp(`(^|\\n)@@ink:${blockId}@@(\\n|$)`, 'g');
      const updated = content.replace(markerRegex, '\n').trim();
      setContent(updated);
      triggerAutoSave(title, updated, category, folderId, projectId, tagsInput, isPinned, attachments);
    }
  };

  const handleAddInkPlacement = () => {
    const blockId = 'ink_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const nextMap = {
      ...inkBlocksRef.current,
      [blockId]: { ink: '', h: 360 },
    };
    inkBlocksRef.current = nextMap;
    setInkBlocks(nextMap);

    const textarea = textareaRef.current;
    let nextContent = '';
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const marker = `\n\n@@ink:${blockId}@@\n\n`;
      nextContent = content.substring(0, start) + marker + content.substring(end);
    } else {
      nextContent = content ? `${content}\n\n@@ink:${blockId}@@\n\n` : `@@ink:${blockId}@@\n\n`;
    }

    setContent(nextContent);
    triggerAutoSave(title, nextContent, category, folderId, projectId, tagsInput, isPinned, attachments);
  };

  // Extraction dynamique de tous les labels \label{...} du contenu pour \eqref
  const extractedLatexLabels = useMemo(() => {
    const matches = content.match(/\\label\{([^}]+)\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.slice(7, -1))));
  }, [content]);

  // Insertion depuis la palette / toolbar LaTeX
  const handleInsertFromLatexToolbar = (code: string, options?: { block?: boolean }) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : content.length;
    const end = textarea ? textarea.selectionEnd : content.length;
    const selected = content.substring(start, end);

    const mathCtx = getActiveMathContext(content, start);
    const insideMath = !!mathCtx;

    const insertion = buildLatexInsertion(code, selected, insideMath, Boolean(options?.block));

    const nextContent = content.substring(0, start) + insertion.text + content.substring(end);
    setContent(nextContent);
    triggerAutoSave(title, nextContent, category, folderId, projectId, tagsInput, isPinned, attachments);

    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + insertion.selStart,
          start + insertion.selEnd
        );
        checkMathContext(nextContent, start + insertion.selStart);
      }, 10);
    }
  };

  // Export de la note en fichier LaTeX (.tex)
  const handleExportNoteToTex = () => {
    const tex = exportNoteToTex(title, content);
    const safeTitle = (title || 'note').replace(/[^a-zA-Z0-9À-ÿ_-]/g, '_').toLowerCase();
    downloadTexFile(safeTitle, tex);
  };

  const triggerAutoSave = (
    newTitle: string,
    newContent: string,
    newCategory: ParaCategory,
    newFolderId: string,
    newProjId: string,
    newTagsStr: string,
    newPinned: boolean,
    newAttachments?: NoteAttachment[]
  ) => {
    if (!currentNote) return;

    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const currentAtts = newAttachments !== undefined ? newAttachments : attachments;

    debounceTimerRef.current = setTimeout(async () => {
      const tags = newTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const baseNote = latestNoteRef.current?.id === currentNote.id ? latestNoteRef.current : currentNote;

      const inkBlocksToSave = inkReadyRef.current
        ? (Object.keys(inkBlocksRef.current).length > 0 ? JSON.stringify(inkBlocksRef.current) : null)
        : baseNote.inkBlocks;

      await updateNote({
        ...baseNote,
        title: newTitle.trim() || 'Note sans titre',
        content: newContent,
        category: newCategory,
        folderId: newFolderId || undefined,
        projectId: newProjId || undefined,
        tags,
        isPinned: newPinned,
        attachments: currentAtts,
        inkBlocks: inkBlocksToSave,
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus('saved');
    }, Math.min(settings.autoSaveDelay || 600, 1000));
  };

  const handleCreateNewNote = async (format: 'text' | 'ink' = 'text') => {
    handleCreateNewNoteRef.current = handleCreateNewNote;
    const targetFolderId =
      selectedFolderFilter && selectedFolderFilter !== '__none__'
        ? selectedFolderFilter
        : undefined;

    if (format === 'ink') {
      const created = await addNote({
        title: 'Note manuscrite',
        content: '🖊️ Note manuscrite créée avec Syntropy Stylus.',
        format: 'ink',
        category: 'resource',
        folderId: targetFolderId,
        tags: ['Manuscrit'],
        isPinned: false,
        attachments: [],
      });
      setSelectedNoteId(created.id);
      setViewMode('ink');
    } else {
      const created = await addNote({
        title: 'Nouvelle note',
        content:
          '# Titre de la note\n\nÉcrivez vos réflexions simplement ici...\n\nPour une formule LaTeX élégante, écrivez $E = mc^2$ ou cliquez sur le bouton LaTeX ci-dessus.\n\nVous pouvez également glisser-déposer des documents (PDF, images) pour les joindre.',
        format: 'text',
        category: 'resource',
        folderId: targetFolderId,
        tags: ['Général'],
        isPinned: false,
        attachments: [],
      });
      setSelectedNoteId(created.id);
      setViewMode(settings.defaultEditorMode || 'write');
    }
  };
  handleCreateNewNoteRef.current = handleCreateNewNote;

  const handleApplyTemplate = async (template: NoteTemplate, mode: 'create_new' | 'apply_current') => {
    const targetFolderId =
      selectedFolderFilter && selectedFolderFilter !== '__none__'
        ? selectedFolderFilter
        : undefined;

    if (mode === 'create_new' || !currentNote) {
      const created = await addNote({
        title: template.defaultTitle,
        content: template.content,
        category: template.defaultPara || 'resource',
        folderId: targetFolderId,
        tags: template.defaultTags,
        isPinned: false,
        attachments: [],
      });
      setSelectedNoteId(created.id);
    } else {
      // mode === 'apply_current'
      setContent(template.content);
      const isBlankTitle =
        !title.trim() ||
        title === 'Nouvelle note' ||
        title === 'Note sans titre' ||
        title === '# Titre de la note';
      const updatedTitle = isBlankTitle ? template.defaultTitle : title;
      if (isBlankTitle) {
        setTitle(template.defaultTitle);
      }
      const existingTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const mergedTags = Array.from(new Set([...existingTags, ...template.defaultTags]));
      const newTagsStr = mergedTags.join(', ');
      setTagsInput(newTagsStr);
      triggerAutoSave(
        updatedTitle,
        template.content,
        category,
        folderId,
        projectId,
        newTagsStr,
        isPinned,
        attachments
      );
    }
  };

  const isContentBlank = useMemo(() => {
    if (!content) return true;
    const trimmed = content.trim();
    return (
      trimmed === '' ||
      trimmed === '# Titre de la note' ||
      trimmed.startsWith('# Titre de la note\n\nÉcrivez vos réflexions simplement ici...')
    );
  }, [content]);

  const handleCreateLatexExampleNote = async () => {
    const created = await addNote({
      title: 'Tutoriel & Guide Pratique LaTeX',
      content: `# Guide & Tutoriel LaTeX dans Syntropy

Bienvenue dans votre atelier de rédaction scientifique ! Syntropy intègre le moteur **KaTeX** pour afficher des formules mathématiques d'une netteté absolue.

---

## 1. Formules en ligne avec $...$
Pour intégrer une formule au cœur de votre phrase, entourez-la de simples dollars :
- L'équation d'Einstein : $E = mc^2$
- La fonction affine : $f(x) = a x + b$
- Une probabilité : $P(A \\cap B) = P(A) \\times P(B|A)$

---

## 2. Formules en bloc centré avec $$...$$
Pour mettre en valeur une équation complexe sur sa propre ligne :

$$
\\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

$$
\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}
$$

---

## 3. Matrices et Systèmes

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\times
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

---

## 4. Astuce
Basculez en mode **"Présentation"** ou **"Double"** en haut à droite pour admirer le rendu TeX calculé !`,
      category: 'resource',
      tags: ['Tutoriel', 'LaTeX', 'Maths'],
      isPinned: true,
      attachments: [],
    });
    setSelectedNoteId(created.id);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Voulez-vous supprimer définitivement cette note ?')) {
      await deleteNote(id);
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length > 0) {
        setSelectedNoteId(remaining[0].id);
      } else {
        setSelectedNoteId(null);
      }
    }
  };

  // Gestion des dossiers
  const handleConfirmCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const created = await addFolder(newFolderName.trim(), newFolderColor, newFolderParentId);
    if (newFolderParentId) {
      setExpandedFolderIds((prev) => new Set([...prev, newFolderParentId]));
    }
    setIsFolderModalOpen(false);
    setNewFolderName('');
    setNewFolderParentId(null);
    setSelectedFolderFilter(created.id);
  };

  const handleOpenCreateSubfolderModal = (parentFolderId: string) => {
    setNewFolderName('');
    setNewFolderParentId(parentFolderId);
    const parent = folders.find((f) => f.id === parentFolderId);
    if (parent?.color) setNewFolderColor(parent.color);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = async (fId: string, fName: string) => {
    const subCount = folders.filter((f) => f.parentId === fId).length;
    const confirmMsg =
      subCount > 0
        ? `Voulez-vous supprimer le dossier "${fName}" et ses ${subCount} sous-dossier(s) ? Les notes associées seront conservées sans dossier.`
        : `Voulez-vous supprimer le dossier "${fName}" ? Les notes associées seront conservées sans dossier.`;

    if (confirm(confirmMsg)) {
      const descendantIds = getFolderDescendantIds(fId, folders);
      await deleteFolder(fId);
      if (selectedFolderFilter && descendantIds.has(selectedFolderFilter)) {
        setSelectedFolderFilter(null);
      }
      if (folderId && descendantIds.has(folderId)) {
        setFolderId('');
        if (currentNote) {
          triggerAutoSave(title, content, category, '', projectId, tagsInput, isPinned, attachments);
        }
      }
    }
  };

  // Insertion rapide de texte/syntaxe dans le textarea
  const insertSyntax = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const updated = content + before + after;
      setContent(updated);
      triggerAutoSave(title, updated, category, folderId, projectId, tagsInput, isPinned, attachments);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = before + (selected || '') + after;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    triggerAutoSave(title, newContent, category, folderId, projectId, tagsInput, isPinned, attachments);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selected ? selected.length : 0)
      );
    }, 10);
  };

  const handleInsertLatexFormula = (latexStr: string) => {
    insertSyntax(latexStr, '');
  };

  // Bascule rapide de l'état d'une case à cocher [ ] <-> [x] depuis l'aperçu ou l'écran partagé
  const handleToggleCheckbox = (lineIndex: number) => {
    const lines = content.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const targetLine = lines[lineIndex];
      // Cas où la case est décochée [ ]
      if (/^(\s*(?:[-*+]|\d+[\.\)])\s*\[) \](.*)$/.test(targetLine)) {
        lines[lineIndex] = targetLine.replace(
          /^(\s*(?:[-*+]|\d+[\.\)])\s*\[) \]/,
          '$1x]'
        );
      } else if (/^(\s*(?:[-*+]|\d+[\.\)])\s*\[)[xX]\](.*)$/.test(targetLine)) {
        lines[lineIndex] = targetLine.replace(
          /^(\s*(?:[-*+]|\d+[\.\)])\s*\[)[xX]\]/,
          '$1 ]'
        );
      } else {
        return;
      }
      const newContent = lines.join('\n');
      setContent(newContent);
      triggerAutoSave(title, newContent, category, folderId, projectId, tagsInput, isPinned, attachments);
    }
  };

  // Détection en direct du contexte mathématique sous le curseur
  const checkMathContext = (text: string, cursorPos: number) => {
    const ctx = getActiveMathContext(text, cursorPos);
    setActiveMathContext(ctx);
  };

  // Gestion intelligente des touches pour LaTeX (Snippets / Tab, auto-wrapping $, auto $$...)
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Raccourci Alt+X ou Ctrl+Shift+L pour ouvrir la modale LaTeX
    if ((e.altKey && e.key.toLowerCase() === 'x') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l')) {
      e.preventDefault();
      setIsLatexModalOpen(true);
      return;
    }

    // Raccourci Alt+M (formule inline $...$) et Alt+Shift+M (bloc équation $$...$$)
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      handleInsertFromLatexToolbar('#formule#', { block: e.shiftKey });
      return;
    }

    // Tab : Tenter d'expanser un snippet LaTeX (/frac, /sqrt, /sum, /int, /mat2, etc.)
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      const expanded = tryExpandSnippet(content, start);
      if (expanded) {
        e.preventDefault();
        setContent(expanded.newContent);
        triggerAutoSave(title, expanded.newContent, category, folderId, projectId, tagsInput, isPinned, attachments);
        setTimeout(() => {
          textarea.setSelectionRange(
            expanded.newCursorPos,
            expanded.newCursorPos + (expanded.selectionLength || 0)
          );
          checkMathContext(expanded.newContent, expanded.newCursorPos);
        }, 10);
        return;
      }
    }

    // Touche '$' : Auto-encapsulation si du texte est sélectionné
    if (e.key === '$' && start !== end) {
      e.preventDefault();
      const selectedText = content.substring(start, end);
      const wrapped = `$${selectedText}$`;
      const nextContent = content.substring(0, start) + wrapped + content.substring(end);
      setContent(nextContent);
      triggerAutoSave(title, nextContent, category, folderId, projectId, tagsInput, isPinned, attachments);
      setTimeout(() => {
        textarea.setSelectionRange(start + 1, end + 1);
        checkMathContext(nextContent, start + 1);
      }, 10);
      return;
    }

    // Touche Entrée juste après '$$' : générer un bloc propre $$\n  \n$$
    if (e.key === 'Enter') {
      const textBefore = content.substring(0, start);
      if (textBefore.endsWith('$$')) {
        e.preventDefault();
        const nextContent = content.substring(0, start) + '\n  \n$$' + content.substring(end);
        setContent(nextContent);
        triggerAutoSave(title, nextContent, category, folderId, projectId, tagsInput, isPinned, attachments);
        setTimeout(() => {
          textarea.setSelectionRange(start + 3, start + 3);
          checkMathContext(nextContent, start + 3);
        }, 10);
        return;
      }
    }
  };

  // Lecture de fichier en base64
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Garantit la disponibilité du dataUrl d'une pièce jointe (téléchargement Cloud à la demande sur tablette / PC)
  const ensureAttachmentDataUrl = async (att: NoteAttachment): Promise<string | null> => {
    if (att.dataUrl && att.dataUrl.length > 100) return att.dataUrl;
    if (!currentNote) return null;
    setLoadingAttId(att.id);
    try {
      const url = await loadAttachmentDataUrl(currentNote.id, att);
      if (url) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === att.id ? { ...a, dataUrl: url } : a))
        );
      }
      return url;
    } catch (err) {
      console.error('Erreur chargement pièce jointe :', err);
      return null;
    } finally {
      setLoadingAttId(null);
    }
  };

  // Téléchargement d'un fichier joint avec récupération cloud si nécessaire
  const handleDownloadAttachment = async (att: NoteAttachment) => {
    let dataUrl = att.dataUrl;
    if (!dataUrl) {
      dataUrl = (await ensureAttachmentDataUrl(att)) || '';
    }
    if (!dataUrl) {
      alert("Impossible de récupérer ce document depuis le Cloud.");
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Suppression d'une pièce jointe (Local + Firestore subcollection)
  const handleDeleteAttachment = async (attId: string) => {
    if (!currentNote) return;
    const targetAtt = attachments.find((a) => a.id === attId);
    if (confirm('Voulez-vous supprimer ce document joint ?')) {
      if (targetAtt) {
        deleteAttachmentChunks(currentNote.id, targetAtt.id, targetAtt.chunksCount).catch(() => {});
      }
      const updatedAtts = attachments.filter((a) => a.id !== attId);
      setAttachments(updatedAtts);
      if (activePdfAttachment?.id === attId) {
        setActivePdfAttachment(null);
      }
      triggerAutoSave(title, content, category, folderId, projectId, tagsInput, isPinned, updatedAtts);
    }
  };

  // Conversion rapide entre note classique texte et note manuscrite
  const handleToggleFormat = () => {
    if (!currentNote) return;
    if (currentNote.format === 'ink') {
      if (
        window.confirm(
          "Convertir cette note manuscrite en note classique texte ? Vos tracés resteront sauvegardés."
        )
      ) {
        updateNote({ ...currentNote, format: 'text' });
        setViewMode('write');
      }
    } else {
      if (
        window.confirm(
          "Convertir cette note classique en note manuscrite au stylet ?"
        )
      ) {
        updateNote({ ...currentNote, format: 'ink' });
        setViewMode('ink');
      }
    }
  };

  // Insertion d'une image attachée directement dans le texte Markdown
  const handleInsertImageToMarkdown = async (att: NoteAttachment) => {
    let url = att.thumbnailUrl || att.dataUrl;
    if (!url) {
      url = (await ensureAttachmentDataUrl(att)) || '';
    }
    const imgMarkdown = `\n\n![${att.name}](${url})\n\n`;
    insertSyntax(imgMarkdown, '');
  };

  // Importation de fichiers vers la note en cours
  const handleAttachFilesToCurrentNote = async (fileList: FileList | File[]) => {
    if (!currentNote) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newAttachmentsList: NoteAttachment[] = [...attachments];

    for (const file of files) {
      try {
        const analyzed = await processImportedFile(file);
        newAttachmentsList.push(analyzed.attachment);

        if (analyzed.docType === 'pdf') {
          setActivePdfAttachment(analyzed.attachment);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur lecture fichier';
        alert(msg);
        console.error('Erreur lecture fichier:', err);
      }
    }

    setAttachments(newAttachmentsList);
    triggerAutoSave(title, content, category, folderId, projectId, tagsInput, isPinned, newAttachmentsList);
  };

  // Synchronisation manuelle forcée de tous les documents joints vers le Cloud Firestore
  const handleForceSyncAllAttachments = async () => {
    if (!currentNote || attachments.length === 0 || isSyncingAllAttachments) return;
    setIsSyncingAllAttachments(true);
    try {
      const hydrated = await Promise.all(
        attachments.map(async (att) => {
          let dataUrl = att.dataUrl;
          if (!dataUrl || dataUrl.length < 50) {
            const cached = await getAttachmentLocally(att.id);
            if (cached) dataUrl = cached;
          }
          return { ...att, dataUrl: dataUrl || '' };
        })
      );

      await updateNote({
        ...currentNote,
        attachments: hydrated,
        updatedAt: new Date().toISOString(),
      });

      setAttachments((prev) => prev.map((a) => ({ ...a, isCloudSynced: true })));
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 4000);
    } catch (err) {
      console.error('Erreur synchronisation forcée des pièces jointes :', err);
      alert('Erreur lors de la synchronisation vers le Cloud.');
    } finally {
      setIsSyncingAllAttachments(false);
    }
  };

  // Création directe d'une nouvelle note à partir de fichiers importés
  const handleImportFilesAsNewNotes = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const analyzed = await processImportedFile(file);

        const targetFolderId =
          selectedFolderFilter && selectedFolderFilter !== '__none__'
            ? selectedFolderFilter
            : undefined;

        const created = await addNote({
          title: analyzed.cleanTitle,
          content: analyzed.initialContent,
          category: analyzed.category,
          folderId: targetFolderId,
          tags: analyzed.tags,
          isPinned: false,
          attachments: [analyzed.attachment],
        });

        setSelectedNoteId(created.id);
        if (analyzed.docType === 'pdf') {
          setActivePdfAttachment(analyzed.attachment);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur import fichier';
        alert(msg);
        console.error('Erreur import fichier:', err);
      }
    }
  };

  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);
  const flattenedFolderOptions = useMemo(() => flattenFolderTree(folderTree), [folderTree]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Ne pas afficher toutes les notes en vrac si aucun dossier n'est sélectionné (évite l'encombrement visuel)
        if (selectedFolderFilter === null && !searchQuery.trim()) {
          return false;
        }

        // Filtre de Dossier (inclut récursivement les sous-dossiers de ce dossier)
        if (selectedFolderFilter === '__none__') {
          if (note.folderId) return false;
        } else if (selectedFolderFilter !== null) {
          const descendantIds = getFolderDescendantIds(selectedFolderFilter, folders);
          if (!note.folderId || !descendantIds.has(note.folderId)) return false;
        }

        // Filtre PARA
        if (selectedParaFilter !== 'all' && note.category !== selectedParaFilter) return false;

        // Filtre Tag
        if (selectedTag && !note.tags?.includes(selectedTag)) return false;

        // Recherche
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(query);
          const matchContent = note.content.toLowerCase().includes(query);
          const matchTag = note.tags?.some((t) => t.toLowerCase().includes(query));
          const matchAtt = note.attachments?.some((a) => a.name.toLowerCase().includes(query));
          if (!matchTitle && !matchContent && !matchTag && !matchAtt) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, selectedFolderFilter, folders, selectedParaFilter, selectedTag, searchQuery]);

  const renderNoteCard = (note: Note) => {
    const isSelected = note.id === selectedNoteId;
    const isInk = note.format === 'ink';
    const noteFolder = folders.find((f) => f.id === note.folderId);
    const hasAttachments = note.attachments && note.attachments.length > 0;

    return (
      <div
        key={note.id}
        onClick={() => setSelectedNoteId(note.id)}
        className={`p-3.5 cursor-pointer transition-all group relative border-l-2
          ${
            isSelected
              ? isInk
                ? 'bg-purple-950/40 border-purple-500 shadow-sm'
                : theme === 'dark'
                ? 'bg-zinc-800/70 border-indigo-500'
                : 'bg-white border-indigo-600 shadow-sm'
              : isInk
              ? theme === 'dark'
                ? 'hover:bg-purple-950/30 bg-purple-950/15 border-purple-500/30'
                : 'hover:bg-purple-50/70 bg-purple-50/30 border-purple-300/40'
              : theme === 'dark'
              ? 'hover:bg-zinc-850/50 border-transparent'
              : 'hover:bg-zinc-100 border-transparent'
          }`}
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 truncate min-w-0">
            {isInk ? (
              <PenTool className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            )}
            <h3
              className={`text-xs font-semibold truncate ${
                isSelected
                  ? isInk
                    ? 'text-purple-300 font-bold'
                    : theme === 'dark'
                    ? 'text-indigo-400 font-bold'
                    : 'text-indigo-600 font-bold'
                  : isInk
                  ? 'text-purple-200'
                  : theme === 'dark'
                  ? 'text-zinc-200'
                  : 'text-zinc-900'
              }`}
            >
              {note.title || 'Sans titre'}
            </h3>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isInk ? (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                🖊️ Manuscrit
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                📝 Texte
              </span>
            )}
            {hasAttachments && (
              <span title={`${note.attachments?.length} document(s)`}>
                <Paperclip className="w-3 h-3 text-zinc-500" />
              </span>
            )}
            {note.isPinned && (
              <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
          </div>
        </div>

        <p
          className={`text-[11px] line-clamp-2 leading-relaxed mb-2 ${
            isInk
              ? theme === 'dark' ? 'text-purple-300/80 font-serif italic' : 'text-purple-700/80 font-serif italic'
              : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          {isInk
            ? (note.ink ? '🖊️ Tracé vectoriel manuscrit (Stylet Syntropy)' : '🖊️ Note manuscrite vierge (prête pour stylet)')
            : note.content.replace(/[#*`>$]/g, '') || 'Note vide...'}
        </p>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 truncate">
            <span className="capitalize">{note.category}</span>
            {noteFolder && (
              <span
                className="px-1.5 py-0.2 rounded font-medium flex items-center gap-1 max-w-[110px] truncate"
                style={{
                  backgroundColor: `${noteFolder.color || '#6366f1'}18`,
                  color: noteFolder.color || '#6366f1',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: noteFolder.color || '#6366f1' }}
                />
                <span className="truncate">{noteFolder.name}</span>
              </span>
            )}
          </div>
          <span>
            {new Date(note.updatedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden animate-in fade-in duration-200 relative">
      {/* 1. Volet Gauche : Dossiers & Liste des notes */}
      <aside
        className={`${
          selectedNoteId ? 'hidden md:flex' : 'flex'
        } ${
          isSidebarCollapsed ? 'hidden md:hidden' : 'w-full md:w-80 flex-shrink-0'
        } flex-col border-r h-full overflow-hidden transition-all duration-200
          ${
            theme === 'dark'
              ? 'glass-surface border-zinc-800/80 text-zinc-200'
              : 'glass-surface border-zinc-200 text-zinc-800'
          }`}
      >
        {/* En-tête volet gauche & Actions rapides */}
        <div className="p-3 border-b border-inherit space-y-2">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <h2 className="font-bold text-sm tracking-tight truncate">
                Notes & Savoirs
              </h2>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className={`p-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                    : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                }`}
                title="Modèles de notes structurés (Synthèse, Réunion, Daily, SOP...)"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
              </button>
              <label
                className={`p-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
                title="Importer un document (Word, Excel, PowerPoint, PDF, Image...)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*,.txt,.md,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.tsv,.ods,.odt,.rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleImportFilesAsNewNotes(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </label>

              {/* Bouton Création de Note avec Sélection de Format Intuitive */}
              <div className="relative" ref={newNoteMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsNewNoteMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  title="Créer une nouvelle note (texte classique ou manuscrite)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Note</span>
                  <ChevronDown className={`w-3 h-3 opacity-80 transition-transform duration-150 ${isNewNoteMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isNewNoteMenuOpen && (
                  <div
                    className={`absolute right-0 top-full mt-1.5 w-64 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
                      theme === 'dark'
                        ? 'bg-zinc-900/95 border-zinc-700/80 backdrop-blur-xl text-zinc-100 shadow-black/60'
                        : 'bg-white/95 border-zinc-200 backdrop-blur-xl text-zinc-800 shadow-indigo-900/15'
                    }`}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Format de la note
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewNoteMenuOpen(false);
                        handleCreateNewNote('text');
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300">
                          📝 Note Texte & Markdown
                        </div>
                        <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                          Format classique avec LaTeX, tableaux & mise en forme
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsNewNoteMenuOpen(false);
                        handleCreateNewNote('ink');
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-purple-600/10 hover:text-purple-400 transition-colors cursor-pointer group mt-0.5"
                    >
                      <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 flex-shrink-0 mt-0.5">
                        <PenTool className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-purple-300">
                          🖊️ Note Manuscrite (Stylet)
                        </div>
                        <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                          Tracé vectoriel fluide, surligneur & canevas infini
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recherche */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors
              ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-300 bg-white'}`}
          >
            <Search className={`w-3.5 h-3.5 flex-shrink-0 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des notes, PDF, tags..."
              className={`w-full bg-transparent border-none outline-none ${
                theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
          </div>

          {/* Filtres Tags */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer
                  ${
                    selectedTag === null
                      ? 'bg-indigo-600 text-white'
                      : theme === 'dark'
                      ? 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-200 text-zinc-700 hover:text-zinc-900'
                  }`}
              >
                Tous
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer
                    ${
                      selectedTag === tag
                        ? 'bg-purple-600 text-white'
                        : theme === 'dark'
                        ? 'bg-zinc-800/70 text-zinc-400 hover:text-zinc-200'
                        : 'bg-zinc-200 text-zinc-700 hover:text-zinc-900'
                    }`}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section Accordéon Dossiers */}
        <div className="px-3.5 py-2.5 border-b border-inherit bg-zinc-950/20">
          <div className="flex items-center justify-between mb-1.5">
            <button
              onClick={() => setShowFolderAccordion(!showFolderAccordion)}
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dossiers ({folders.length})</span>
              {showFolderAccordion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setNewFolderName('');
                  setNewFolderParentId(null);
                  setIsFolderModalOpen(true);
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-indigo-500/10 transition-colors cursor-pointer"
                title="Créer un nouveau dossier racine"
              >
                <Plus className="w-3.5 h-3.5" />
                + Dossier
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-zinc-700/80 bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-zinc-500'
                    : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Réduire le volet des dossiers et notes (agrandir l'espace d'écriture)"
              >
                <PanelLeftClose className="w-3 h-3 text-zinc-400" />
                <span>Réduire</span>
              </button>
            </div>
          </div>

          {showFolderAccordion && (
            <div className="space-y-1 mt-1 max-h-60 overflow-y-auto scrollbar-thin">
              {/* Notes sans dossier */}
              <button
                onClick={() => {
                  setSelectedFolderFilter('__none__');
                  const unassigned = notes.filter((n) => !n.folderId);
                  if (unassigned.length > 0 && (!selectedNoteId || currentNote?.folderId)) {
                    setSelectedNoteId(unassigned[0].id);
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedFolderFilter === '__none__'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                    : 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                  <span className="truncate">Sans dossier</span>
                </div>
                {(() => {
                  const unassigned = notes.filter((n) => !n.folderId);
                  const uClassic = unassigned.filter((n) => n.format !== 'ink').length;
                  const uInk = unassigned.filter((n) => n.format === 'ink').length;
                  return (
                    <div className="flex items-center gap-1 text-[11px] font-mono flex-shrink-0">
                      <span>{uClassic}</span>
                      {uInk > 0 && (
                        <>
                          <span className="text-zinc-500">•</span>
                          <span className="text-purple-400 font-semibold">{uInk} 🖊️</span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </button>

              {/* Arborescence hiérarchique des dossiers et sous-dossiers */}
              {folderTree.map(function renderNode(node): React.ReactNode {
                const isSelected = selectedFolderFilter === node.folder.id;
                const isExpanded = expandedFolderIds.has(node.folder.id);
                const hasChildren = node.children.length > 0;
                const descendantIds = getFolderDescendantIds(node.folder.id, folders);
                const descNotes = notes.filter((n) => n.folderId && descendantIds.has(n.folderId));
                const folderClassic = descNotes.filter((n) => n.format !== 'ink').length;
                const folderInk = descNotes.filter((n) => n.format === 'ink').length;
                const totalCount = descNotes.length;

                return (
                  <div key={node.folder.id} className="flex flex-col">
                    <div
                      className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-850'
                          : 'text-zinc-700 hover:bg-zinc-200/70'
                      }`}
                      style={{ paddingLeft: `${8 + node.level * 14}px` }}
                      onClick={() => {
                        setSelectedFolderFilter(node.folder.id);
                        const descIds = getFolderDescendantIds(node.folder.id, folders);
                        const folderNotes = notes.filter((n) => n.folderId && descIds.has(n.folderId));
                        if (folderNotes.length > 0 && (!selectedNoteId || !descIds.has(currentNote?.folderId || ''))) {
                          setSelectedNoteId(folderNotes[0].id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedFolderIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(node.folder.id)) next.delete(node.folder.id);
                                else next.add(node.folder.id);
                                return next;
                              });
                            }}
                            className={`p-0.5 rounded transition-transform hover:scale-110 cursor-pointer ${
                              isSelected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                            title={isExpanded ? 'Réduire ce dossier' : 'Développer ce dossier'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 flex-shrink-0" />
                            )}
                          </button>
                        ) : node.level > 0 ? (
                          <span className={`text-[10px] w-3 flex justify-center flex-shrink-0 ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>
                            ↳
                          </span>
                        ) : (
                          <span className="w-3 h-3 flex-shrink-0" />
                        )}

                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: node.folder.color || '#6366f1' }}
                        />
                        <span className="truncate">{node.folder.name}</span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 text-[11px] font-mono">
                        <span className={isSelected ? 'text-white' : 'text-zinc-400'}>{folderClassic}</span>
                        {folderInk > 0 && (
                          <>
                            <span className="text-zinc-500">•</span>
                            <span className={isSelected ? 'text-purple-200 font-bold' : 'text-purple-400 font-semibold'}>
                              {folderInk} 🖊️
                            </span>
                          </>
                        )}

                        {/* Bouton créer un sous-dossier */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateSubfolderModal(node.folder.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer ${
                            isSelected
                              ? 'hover:bg-indigo-700 text-white'
                              : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-indigo-300'
                          }`}
                          title={`Créer un sous-dossier dans "${node.folder.name}"`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        {/* Bouton supprimer dossier */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(node.folder.id, node.folder.name);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer ${
                            isSelected
                              ? 'hover:bg-indigo-700 text-white'
                              : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-rose-400'
                          }`}
                          title="Supprimer ce dossier"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Sous-dossiers récursifs */}
                    {hasChildren && isExpanded && (
                      <div className="flex flex-col space-y-0.5 mt-0.5">
                        {node.children.map((child) => renderNode(child))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Liste des cartes de notes */}
        <div className="flex-1 overflow-y-auto divide-y divide-inherit/40 scrollbar-thin">
          {selectedFolderFilter === null && !searchQuery.trim() ? (
            <div className="text-center py-16 text-zinc-500 text-xs p-6 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
                <Folder className="w-6 h-6" />
              </div>
              <p className="font-bold text-zinc-300 text-sm">Sélectionnez un dossier</p>
              <p className="text-zinc-500 text-xs max-w-[210px] mx-auto leading-relaxed">
                Cliquez sur un dossier ci-dessus ou sur « Sans dossier » pour afficher ses notes.
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs p-4 space-y-3">
              <BookOpen className="w-8 h-8 mx-auto text-zinc-600 opacity-60" />
              <p className="font-medium text-zinc-300">Aucune note dans cette sélection.</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => handleCreateNewNote('text')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  + Note Texte
                </button>
                <button
                  onClick={() => handleCreateNewNote('ink')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  + Note Manuscrite
                </button>
              </div>
            </div>
          ) : (
            filteredNotes.map((note) => renderNoteCard(note))
          )}
        </div>
      </aside>

      {/* Poignée / Onglet de bordure rétractable style Notion / IDE */}
      <div className="hidden md:flex relative z-30 select-none">
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`absolute bottom-10 flex items-center justify-center w-5 h-16 rounded-r-lg border-y border-r shadow-md transition-all cursor-pointer ${
            isSidebarCollapsed ? 'left-0' : '-left-2.5'
          } ${
            theme === 'dark'
              ? 'bg-zinc-900/90 border-zinc-700/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
              : 'bg-white/90 border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          title={isSidebarCollapsed ? "Développer les dossiers & notes" : "Réduire le volet des dossiers"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 2. Volet Droit : Éditeur Simple, Dossier, Pièces Jointes & Visualiseur */}
      <section
        className={`${
          !selectedNoteId ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full overflow-hidden bg-transparent relative`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAttachFilesToCurrentNote(e.dataTransfer.files);
          }
        }}
      >
        {/* Zone de Glisser-Déposer Active */}
        {isDraggingFile && (
          <div className="absolute inset-0 z-40 bg-indigo-950/80 backdrop-blur-sm border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <UploadCloud className="w-14 h-14 text-indigo-400 animate-bounce mb-3" />
            <h3 className="font-bold text-lg text-white">Déposez vos documents ici</h3>
            <p className="text-xs text-indigo-200 mt-1 max-w-sm">
              Les fichiers PDF, images et documents seront automatiquement importés et attachés à cette note.
            </p>
          </div>
        )}

        {currentNote ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Barre de Contrôles & Métadonnées supérieures — Ligne Unique Épurée */}
            <div
              className={`px-3 md:px-4 py-2 border-b flex items-center justify-between gap-1.5 md:gap-2.5 transition-colors ${
                theme === 'dark' ? 'glass-surface border-zinc-800/80' : 'glass-surface border-zinc-200'
              }`}
            >
              {/* Gauche : Navigation retour / Dossiers & Sélecteur */}
              <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-shrink">
                {isSidebarCollapsed && (
                  <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                      theme === 'dark'
                        ? 'bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                    title="Afficher les dossiers et la liste des notes"
                  >
                    <PanelLeftOpen className="w-3.5 h-3.5" />
                    <span>Dossiers</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedNoteId(null)}
                  className={`md:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                  }`}
                  title="Retour à la liste des notes"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Notes</span>
                </button>

                {/* Sélecteur de Dossier */}
                <div className="flex items-center gap-1 min-w-0">
                  <select
                    value={folderId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFolderId(next);
                      triggerAutoSave(title, content, category, next, projectId, tagsInput, isPinned, attachments);
                    }}
                    className={`px-2 py-1 rounded-lg border text-xs focus:outline-none max-w-[110px] sm:max-w-[160px] truncate transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-300'
                        : 'border-zinc-300 bg-white text-zinc-800 shadow-xs'
                    }`}
                    title="Dossier de rangement"
                  >
                    <option value="">📁 Sans dossier</option>
                    {flattenedFolderOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.level > 0 ? `${'\u00A0\u00A0'.repeat(f.level)}↳ ` : ''}📁 {f.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setNewFolderName('');
                      setNewFolderParentId(folderId || null);
                      setIsFolderModalOpen(true);
                    }}
                    className={`hidden sm:flex p-1.5 rounded-lg border text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex-shrink-0 ${
                      theme === 'dark' ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800' : 'border-zinc-300 bg-white hover:bg-zinc-100'
                    }`}
                    title={folderId ? 'Créer un sous-dossier dans ce dossier' : 'Créer un nouveau dossier'}
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>

                {/* Badge de Format & Conversion Interactive Rapide (Desktop uniquement dans le header) */}
                <button
                  type="button"
                  onClick={handleToggleFormat}
                  className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex-shrink-0 ${
                    currentNote.format === 'ink'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                      : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                  }`}
                  title="Cliquer pour convertir le format (Classique <-> Manuscrit)"
                >
                  {currentNote.format === 'ink' ? (
                    <>
                      <PenTool className="w-3.5 h-3.5 text-purple-400" />
                      <span>Manuscrit</span>
                      <ArrowLeftRight className="w-3 h-3 text-purple-400/60 ml-0.5" />
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Classique</span>
                      <ArrowLeftRight className="w-3 h-3 text-indigo-400/60 ml-0.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Droite : Switcher Modes de vue, Joindre, Épingler, Statut & Corbeille */}
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                {/* Switcher de modes épuré (icônes seules sur mobile pour un gain d'espace maximal) */}
                {currentNote.format === 'ink' ? (
                  <div
                    className={`flex items-center p-0.5 rounded-lg border text-xs ${
                      theme === 'dark' ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode('ink')}
                      className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        viewMode === 'ink'
                          ? 'bg-purple-600 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Canvas Stylet"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Canvas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('write')}
                      className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'write'
                          ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Texte descriptif"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Texte</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex items-center p-0.5 rounded-lg border text-xs ${
                      theme === 'dark' ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
                    }`}
                  >
                    <button
                      onClick={() => setViewMode('write')}
                      className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'write'
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Mode Écriture"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Édition</span>
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'split'
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Mode Côte à côte (Édition + Rendu LaTeX)"
                    >
                      <Columns2 className="w-3.5 h-3.5" />
                      <span>Double</span>
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'preview'
                          ? 'bg-purple-600 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Aperçu Présentation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Aperçu</span>
                    </button>
                  </div>
                )}

                {/* Bouton Joindre un Document */}
                <label
                  className={`flex items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200'
                  }`}
                  title="Joindre un document (Word, Excel, PowerPoint, PDF, Image...)"
                >
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                  <input
                    ref={editorFilePickerRef}
                    type="file"
                    multiple
                    accept="application/pdf,image/*,.txt,.md,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.tsv,.ods,.odt,.rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleAttachFilesToCurrentNote(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                {/* Bouton Épingler */}
                <button
                  onClick={() => {
                    const next = !isPinned;
                    setIsPinned(next);
                    triggerAutoSave(title, content, category, folderId, projectId, tagsInput, next, attachments);
                  }}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex-shrink-0 ${
                    isPinned
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 dark:text-amber-400'
                      : theme === 'dark'
                      ? 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      : 'border-zinc-300 text-zinc-400 hover:text-zinc-700 bg-white shadow-xs'
                  }`}
                  title={isPinned ? 'Détacher' : 'Épingler en haut'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                {/* Statut d'enregistrement : Badge complet sur desktop, Voyant discret sur mobile */}
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono border transition-all flex-shrink-0 ${
                    saveStatus === 'saving'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }`}
                  title={saveStatus === 'saving' ? 'Sauvegarde et synchronisation en cours...' : 'Note enregistrée et synchronisée'}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-[10px] font-semibold">Synchro...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold">Synchronisé</span>
                    </>
                  )}
                </div>

                {/* Voyant discret sur mobile (< sm) */}
                <div className="flex sm:hidden items-center justify-center px-1 flex-shrink-0">
                  {saveStatus === 'saving' ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" title="Sauvegarde en cours..." />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" title="Synchronisé" />
                  )}
                </div>

                {/* Bouton Supprimer */}
                <button
                  onClick={() => handleDeleteNote(currentNote.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
                  title="Supprimer cette note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Barre de Formatage Rapide & Assistant LaTeX — Défilement Horizontal Fluide sur Mobile */}
            {viewMode !== 'preview' && viewMode !== 'ink' && (
              <div
                className={`px-3 md:px-6 py-1.5 border-b flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-none flex-nowrap transition-colors ${
                  theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                {/* Tailles de titres H1, H2, H3 */}
                <div className={`flex items-center p-0.5 rounded-lg border flex-shrink-0 ${
                  theme === 'dark' ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-zinc-200/80 border-zinc-300'
                }`}>
                  <button
                    onClick={() => insertSyntax('# ')}
                    className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
                      theme === 'dark' ? 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-700/60' : 'text-zinc-700 hover:text-indigo-600 hover:bg-white'
                    }`}
                    title="Grand Titre (H1)"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => insertSyntax('## ')}
                    className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
                      theme === 'dark' ? 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-700/60' : 'text-zinc-700 hover:text-indigo-600 hover:bg-white'
                    }`}
                    title="Titre de Section (H2)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => insertSyntax('### ')}
                    className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
                      theme === 'dark' ? 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-700/60' : 'text-zinc-700 hover:text-indigo-600 hover:bg-white'
                    }`}
                    title="Sous-titre (H3)"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`w-px h-4 mx-0.5 flex-shrink-0 ${theme === 'dark' ? 'bg-zinc-700/50' : 'bg-zinc-300'}`} />

                {/* Styles de texte : Gras, Italique, Souligné, Barré, Surligné */}
                <button
                  onClick={() => insertSyntax('**', '**')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Gras (**texte**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('*', '*')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Italique (*texte*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('<u>', '</u>')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800' : 'text-zinc-600 hover:text-indigo-600 hover:bg-zinc-200'
                  }`}
                  title="Souligné (<u>texte</u>)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('~~', '~~')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800' : 'text-zinc-600 hover:text-rose-600 hover:bg-zinc-200'
                  }`}
                  title="Texte barré (~~texte~~)"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('==', '==')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800' : 'text-zinc-600 hover:text-amber-600 hover:bg-zinc-200'
                  }`}
                  title="Surligner en jaune (==texte==)"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>

                <div className={`w-px h-4 mx-0.5 flex-shrink-0 ${theme === 'dark' ? 'bg-zinc-700/50' : 'bg-zinc-300'}`} />

                {/* Listes & Structure */}
                <button
                  onClick={() => insertSyntax('- [ ] ')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Case à cocher (- [ ])"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('- ')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Liste à puces (- )"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('1. ')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Liste numérotée (1. )"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('> ')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Citation (> )"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('```\n', '\n```')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Bloc de code (```)"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertSyntax('\n\n---\n\n')}
                  className={`p-1.5 rounded cursor-pointer flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                  title="Ligne séparatrice horizontale (---)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className={`w-px h-4 mx-0.5 flex-shrink-0 ${theme === 'dark' ? 'bg-zinc-700/50' : 'bg-zinc-300'}`} />

                {/* Boutons d'action : Manuscrit, Modèles, Tutoriel & LaTeX */}
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                  {/* Bouton Ajouter Emplacement Manuscrit dans une note classique */}
                  {currentNote.format !== 'ink' && (
                    <button
                      type="button"
                      onClick={handleAddInkPlacement}
                      className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 border border-purple-500/30 transition-all cursor-pointer flex-shrink-0"
                      title="Ajouter un emplacement de dessin / note manuscrite au stylet dans la note"
                    >
                      <PenTool className="w-3.5 h-3.5 text-purple-400" />
                      <span className="hidden sm:inline">Emplacement manuscrit</span>
                      <span className="sm:hidden">Manuscrit</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 border border-purple-500/30 transition-all cursor-pointer flex-shrink-0"
                    title="Choisir ou appliquer un modèle structuré"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
                    <span>Modèles</span>
                  </button>

                  <button
                    onClick={() => setIsLatexTutorialOpen(true)}
                    className="flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer flex-shrink-0"
                    title="Ouvrir le guide LaTeX"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Tuto LaTeX</span>
                    <span className="sm:hidden">Tuto</span>
                  </button>

                  <button
                    onClick={() => setIsLatexModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 md:px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 transition-all cursor-pointer flex-shrink-0"
                    title="Insérer une formule mathématique LaTeX"
                  >
                    <span className="font-serif font-bold text-sm">∑</span>
                    <span>LaTeX</span>
                    <Sparkles className="w-3 h-3 text-purple-400 hidden sm:inline" />
                  </button>
                </div>
              </div>
            )}

            {/* Barre et Palette LaTeX complète avec formules, symboles, matrices, labels et export .tex */}
            {viewMode !== 'preview' && viewMode !== 'ink' && (
              <LatexToolbar
                onInsert={handleInsertFromLatexToolbar}
                labels={extractedLatexLabels}
                onExportTex={handleExportNoteToTex}
                onOpenTutorial={() => setIsLatexTutorialOpen(true)}
                onOpenGallery={() => setIsLatexModalOpen(true)}
              />
            )}

            {/* Zone Principale de Rédaction / Affichage */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-32 md:pb-12 space-y-5 max-w-6xl mx-auto w-full scrollbar-thin">
              {/* Métadonnées contextuelles de la note (Dossier, Catégorie PARA, Projet, Format mobile) */}
              <div className={`flex items-center gap-2 sm:gap-3 text-xs flex-wrap pb-2.5 border-b ${
                theme === 'dark' ? 'border-zinc-800/60 text-zinc-400' : 'border-zinc-200 text-zinc-600'
              }`}>
                {/* Badge de Format & Conversion Interactive Rapide sur Mobile */}
                <button
                  type="button"
                  onClick={handleToggleFormat}
                  className={`md:hidden flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    currentNote.format === 'ink'
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                  }`}
                  title="Cliquer pour convertir le format (Classique <-> Manuscrit)"
                >
                  {currentNote.format === 'ink' ? (
                    <>
                      <PenTool className="w-3 h-3 text-purple-400" />
                      <span>Manuscrit</span>
                      <ArrowLeftRight className="w-2.5 h-2.5 text-purple-400/70" />
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span>Classique</span>
                      <ArrowLeftRight className="w-2.5 h-2.5 text-indigo-400/70" />
                    </>
                  )}
                </button>

                {/* Fil d'Ariane hiérarchique du dossier */}
                {folderId ? (
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-zinc-500" />
                    {getFolderPath(folderId, folders).map((f, idx, arr) => (
                      <span key={f.id} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedFolderFilter(f.id)}
                          className="hover:underline font-medium hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                          style={{ color: f.color || undefined }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: f.color || '#6366f1' }}
                          />
                          {f.name}
                        </button>
                        {idx < arr.length - 1 && <span className="text-zinc-600">/</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-zinc-500 flex items-center gap-1 text-xs">
                    <Folder className="w-3.5 h-3.5" />
                    <span>Sans dossier</span>
                  </span>
                )}

                <span className="text-zinc-500 hidden sm:inline">•</span>

                {/* Catégorie PARA */}
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">PARA :</span>
                  <select
                    value={category}
                    onChange={(e) => {
                      const next = e.target.value as ParaCategory;
                      setCategory(next);
                      triggerAutoSave(title, content, next, folderId, projectId, tagsInput, isPinned, attachments);
                    }}
                    className={`bg-transparent text-xs font-medium focus:outline-none cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                      theme === 'dark'
                        ? 'text-zinc-300 hover:bg-zinc-800/60'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <option value="project" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>Projet (P)</option>
                    <option value="area" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>Domaine (A)</option>
                    <option value="resource" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>Ressource (R)</option>
                    <option value="archive" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>Archive (A)</option>
                  </select>
                </div>

                {/* Projet associé si disponible */}
                {projects && projects.length > 0 && (
                  <>
                    <span className="text-zinc-500 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">Projet :</span>
                      <select
                        value={projectId}
                        onChange={(e) => {
                          const next = e.target.value;
                          setProjectId(next);
                          triggerAutoSave(title, content, category, folderId, next, tagsInput, isPinned, attachments);
                        }}
                        className={`bg-transparent text-xs font-medium focus:outline-none cursor-pointer rounded px-1.5 py-0.5 max-w-[150px] truncate transition-colors ${
                          theme === 'dark'
                            ? 'text-zinc-300 hover:bg-zinc-800/60'
                            : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <option value="" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>Aucun projet</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id} className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Titre & Tags */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTitle(next);
                    triggerAutoSave(next, content, category, folderId, projectId, tagsInput, isPinned, attachments);
                  }}
                  placeholder="Titre de votre note..."
                  className={`w-full text-2xl md:text-3xl font-extrabold bg-transparent border-none outline-none py-1 transition-colors ${
                    theme === 'dark'
                      ? 'text-zinc-100 placeholder:text-zinc-600'
                      : 'text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />

                <div className="flex items-center gap-2">
                  <Tag
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => {
                      const next = e.target.value;
                      setTagsInput(next);
                      triggerAutoSave(title, content, category, folderId, projectId, next, isPinned, attachments);
                    }}
                    placeholder="Tags séparés par des virgules (ex: Mathématiques, Physique, Synthèse)"
                    className={`w-full text-xs bg-transparent border-none outline-none ${
                      theme === 'dark'
                        ? 'text-zinc-400 placeholder:text-zinc-600'
                        : 'text-zinc-700 placeholder:text-zinc-400'
                    }`}
                  />
                </div>
              </div>

              {/* Visualiseur de PDF Intégré (si un PDF est sélectionné pour lecture) */}
              {activePdfAttachment && (
                <div className="w-full rounded-2xl border border-zinc-700/80 overflow-hidden shadow-2xl bg-zinc-900 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold font-mono text-[10px] border border-rose-500/30">
                        LECTEUR PDF
                      </span>
                      <span className="font-semibold truncate text-zinc-100">{activePdfAttachment.name}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">
                        ({formatFileSize(activePdfAttachment.size)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadAttachment(activePdfAttachment)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
                        title="Télécharger ce PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </button>
                      <button
                        onClick={() => setActivePdfAttachment(null)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Fermer le lecteur PDF"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-[620px] bg-zinc-800 flex items-center justify-center">
                    {activePdfAttachment.dataUrl ? (
                      <iframe
                        src={activePdfAttachment.dataUrl}
                        className="w-full h-full border-none"
                        title={activePdfAttachment.name}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-zinc-400">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        <span className="text-sm font-medium">Chargement du document PDF depuis le Cloud...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Liste des Documents & Pièces Jointes Attachés */}
              {attachments.length > 0 && (
                <div
                  className={`p-4 rounded-2xl border transition-colors ${
                    theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100/70 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Documents joints ({attachments.length})
                      </span>
                      {syncSuccessToast && (
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Synchronisé sur le Cloud !
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleForceSyncAllAttachments}
                        disabled={isSyncingAllAttachments}
                        className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                        title="Synchroniser immédiatement tous les fichiers vers le Cloud pour votre tablette et vos autres appareils"
                      >
                        {isSyncingAllAttachments ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                            <span>Envoi vers le Cloud...</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-3.5 h-3.5 text-purple-400" />
                            <span>Synchroniser vers le Cloud</span>
                          </>
                        )}
                      </button>

                      <label
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Ajouter un autre fichier
                        <input
                          type="file"
                          multiple
                          accept="application/pdf,image/*,.txt,.md,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.tsv,.ods,.odt,.rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleAttachFilesToCurrentNote(e.target.files);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {attachments.map((att) => {
                      const docType = detectDocumentType(att.name, att.type);
                      const isPdf = docType === 'pdf';
                      const isImg = docType === 'image';
                      const isPpt = docType === 'presentation';
                      const isSpreadsheet = docType === 'spreadsheet';
                      const isWord = docType === 'word';
                      return (
                        <div
                          key={att.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            theme === 'dark'
                              ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {isPdf ? (
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20" title="Document PDF">
                                <FileText className="w-4 h-4" />
                              </div>
                            ) : isPpt ? (
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 border border-amber-500/20" title="Présentation PowerPoint">
                                <Presentation className="w-4 h-4" />
                              </div>
                            ) : isSpreadsheet ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20" title="Tableur Excel / Données">
                                <FileSpreadsheet className="w-4 h-4" />
                              </div>
                            ) : isWord ? (
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20" title="Document Texte / Word">
                                <FileText className="w-4 h-4" />
                              </div>
                            ) : isImg ? (
                              <div
                                onClick={async () => {
                                  let targetAtt = att;
                                  if (!targetAtt.dataUrl) {
                                    const url = await ensureAttachmentDataUrl(att);
                                    if (!url) return;
                                    targetAtt = { ...att, dataUrl: url };
                                  }
                                  setPreviewImageModal(targetAtt);
                                }}
                                className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-indigo-500/20 relative group/thumb bg-zinc-900"
                                title="Cliquer pour agrandir l'image"
                              >
                                {att.thumbnailUrl || att.dataUrl ? (
                                  <img src={(att.thumbnailUrl || att.dataUrl) || ''} alt={att.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-indigo-400 bg-indigo-500/10">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                  {loadingAttId === att.id ? (
                                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center flex-shrink-0">
                                <File className="w-4 h-4" />
                              </div>
                            )}
                            <div className="flex flex-col truncate">
                              <span className="text-xs font-medium truncate" title={att.name}>
                                {att.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {formatFileSize(att.size)}
                                </span>
                                {att.isCloudSynced ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium flex items-center gap-0.5" title="Synchronisé dans le Cloud (accessible sur tablette & PC)">
                                    <Cloud className="w-2.5 h-2.5" />
                                    <span>Cloud</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-0.5" title="Stocké localement sur cet appareil - synchronisation Cloud en attente">
                                    <span>💾 Local</span>
                                  </span>
                                )}
                                {isPpt && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                                    Diapo
                                  </span>
                                )}
                                {isSpreadsheet && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                    Tableur
                                  </span>
                                )}
                                {isWord && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                                    Doc
                                  </span>
                                )}
                                {isPdf && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                                    PDF
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isPdf && (
                              <button
                                disabled={loadingAttId === att.id}
                                onClick={async () => {
                                  if (activePdfAttachment?.id === att.id) {
                                    setActivePdfAttachment(null);
                                  } else {
                                    let targetAtt = att;
                                    if (!targetAtt.dataUrl) {
                                      const url = await ensureAttachmentDataUrl(att);
                                      if (!url) return;
                                      targetAtt = { ...att, dataUrl: url };
                                    }
                                    setActivePdfAttachment(targetAtt);
                                  }
                                }}
                                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 ${
                                  activePdfAttachment?.id === att.id
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                                }`}
                                title={activePdfAttachment?.id === att.id ? 'Fermer le lecteur' : 'Lire le document PDF'}
                              >
                                {loadingAttId === att.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                                <span>{activePdfAttachment?.id === att.id ? 'Fermer' : 'Lire'}</span>
                              </button>
                            )}
                            {isImg && (
                              <button
                                onClick={() => handleInsertImageToMarkdown(att)}
                                className="p-1 rounded text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                                title="Insérer l'image dans le texte Markdown"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              disabled={loadingAttId === att.id}
                              onClick={() => handleDownloadAttachment(att)}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                              title="Télécharger ce document"
                            >
                              {loadingAttId === att.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Supprimer cette pièce jointe"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions rapides de Modèles si la note est vierge */}
              {isContentBlank && (
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    theme === 'dark'
                      ? 'bg-purple-950/20 border-purple-800/40 text-purple-200'
                      : 'bg-purple-50/70 border-purple-200 text-purple-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold">Démarrer rapidement avec un modèle structuré :</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tous les modèles ({NOTE_TEMPLATES.length})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {NOTE_TEMPLATES.slice(0, 5).map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl, 'apply_current')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-xs ${
                          theme === 'dark'
                            ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700/80 text-zinc-200 hover:border-purple-500/50'
                            : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-purple-400'
                        }`}
                        title={tpl.summary}
                      >
                        <span className="text-sm">
                          {tpl.id === 'cornell'
                            ? '🎓'
                            : tpl.id === 'revision-sheet'
                            ? '🧠'
                            : tpl.id === 'lab-report'
                            ? '🔬'
                            : tpl.id === 'project-brief'
                            ? '🚀'
                            : '📖'}
                        </span>
                        <span>{tpl.title.split('(')[0].trim()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Corps de la note selon le mode */}
              <div className="flex-1 min-h-[480px]">
                {viewMode === 'write' && (
                  (() => {
                    const segments = parseSegments(content);
                    const hasInk = segments.some((s) => s.type === 'ink');

                    if (!hasInk) {
                      return (
                        <textarea
                          ref={textareaRef}
                          value={content}
                          onChange={(e) => {
                            const next = e.target.value;
                            setContent(next);
                            triggerAutoSave(title, next, category, folderId, projectId, tagsInput, isPinned, attachments);
                            checkMathContext(next, e.target.selectionStart);
                          }}
                          onKeyDown={handleTextareaKeyDown}
                          onKeyUp={(e) => checkMathContext(e.currentTarget.value, e.currentTarget.selectionStart)}
                          onClick={(e) => checkMathContext(e.currentTarget.value, e.currentTarget.selectionStart)}
                          onSelect={(e) => checkMathContext(e.currentTarget.value, e.currentTarget.selectionStart)}
                          placeholder="Écrivez vos pensées simplement en Markdown ou utilisez $formule$ pour du LaTeX... Astuce : tapez /frac ou /sqrt puis Tab !"
                          className={`w-full h-full min-h-[480px] p-4 rounded-2xl border text-sm md:text-base leading-relaxed resize-none focus:outline-none transition-all font-sans ${
                            theme === 'dark'
                              ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-indigo-500/60'
                              : 'bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500 shadow-xs'
                          }`}
                        />
                      );
                    }

                    return (
                      <div className="flex flex-col space-y-4 w-full">
                        {segments.map((seg, idx) => {
                          if (seg.type === 'ink' && seg.blockId) {
                            return (
                              <InlineInkBlock
                                key={seg.blockId}
                                noteId={currentNote.id}
                                blockId={seg.blockId}
                                data={inkBlocks[seg.blockId]}
                                onChange={handleInkBlockChange}
                                onDelete={handleDeleteInkBlock}
                              />
                            );
                          }

                          return (
                            <textarea
                              key={`text-${idx}`}
                              value={seg.text || ''}
                              ref={idx === 0 ? textareaRef : undefined}
                              onFocus={(e) => {
                                textareaRef.current = e.currentTarget;
                              }}
                              onChange={(e) => {
                                const newText = e.target.value;
                                const updatedSegments = [...segments];
                                updatedSegments[idx] = { ...updatedSegments[idx], text: newText };
                                const reconstructed = updatedSegments
                                  .map((s) => (s.type === 'ink' ? `\n\n@@ink:${s.blockId}@@\n\n` : s.text || ''))
                                  .join('');
                                setContent(reconstructed);
                                triggerAutoSave(title, reconstructed, category, folderId, projectId, tagsInput, isPinned, attachments);
                                checkMathContext(reconstructed, seg.startOffset + e.target.selectionStart);
                              }}
                              onKeyDown={handleTextareaKeyDown}
                              onKeyUp={(e) => checkMathContext(content, seg.startOffset + e.currentTarget.selectionStart)}
                              onClick={(e) => checkMathContext(content, seg.startOffset + e.currentTarget.selectionStart)}
                              onSelect={(e) => checkMathContext(content, seg.startOffset + e.currentTarget.selectionStart)}
                              placeholder="Continuez d'écrire ici en Markdown ou LaTeX..."
                              rows={Math.max(3, (seg.text || '').split('\n').length + 1)}
                              className={`w-full p-4 rounded-2xl border text-sm md:text-base leading-relaxed resize-y focus:outline-none transition-all font-sans ${
                                theme === 'dark'
                                  ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-indigo-500/60'
                                  : 'bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500 shadow-xs'
                              }`}
                            />
                          );
                        })}
                      </div>
                    );
                  })()
                )}

                {viewMode === 'split' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[480px]">
                    <div className="flex flex-col h-full">
                      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Edit3 className="w-3 h-3" />
                        Éditeur de texte
                      </div>
                      {(() => {
                        const segments = parseSegments(content);
                        const hasInk = segments.some((s) => s.type === 'ink');

                        if (!hasInk) {
                          return (
                            <textarea
                              ref={textareaRef}
                              value={content}
                              onChange={(e) => {
                                const next = e.target.value;
                                setContent(next);
                                triggerAutoSave(title, next, category, folderId, projectId, tagsInput, isPinned, attachments);
                                checkMathContext(next, e.target.selectionStart);
                              }}
                              onKeyDown={handleTextareaKeyDown}
                              onKeyUp={(e) => checkMathContext(e.currentTarget.value, e.currentTarget.selectionStart)}
                              onClick={(e) => checkMathContext(e.currentTarget.value, e.currentTarget.selectionStart)}
                              onSelect={(e) => checkMathContext(e.currentTarget.value, e.currentTarget.selectionStart)}
                              placeholder="Tapez vos formules en Markdown ou /frac, /sum, /int puis Tab..."
                              className={`w-full flex-1 min-h-[460px] p-4 rounded-2xl border text-sm leading-relaxed resize-none focus:outline-none transition-all font-mono ${
                                theme === 'dark'
                                  ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-indigo-500/60'
                                  : 'bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500 shadow-xs'
                              }`}
                            />
                          );
                        }

                        return (
                          <div className="flex flex-col space-y-4 w-full flex-1">
                            {segments.map((seg, idx) => {
                              if (seg.type === 'ink' && seg.blockId) {
                                return (
                                  <InlineInkBlock
                                    key={seg.blockId}
                                    noteId={currentNote.id}
                                    blockId={seg.blockId}
                                    data={inkBlocks[seg.blockId]}
                                    onChange={handleInkBlockChange}
                                    onDelete={handleDeleteInkBlock}
                                  />
                                );
                              }

                              return (
                                <textarea
                                  key={`text-split-${idx}`}
                                  value={seg.text || ''}
                                  ref={idx === 0 ? textareaRef : undefined}
                                  onFocus={(e) => {
                                    textareaRef.current = e.currentTarget;
                                  }}
                                  onChange={(e) => {
                                    const newText = e.target.value;
                                    const updatedSegments = [...segments];
                                    updatedSegments[idx] = { ...updatedSegments[idx], text: newText };
                                    const reconstructed = updatedSegments
                                      .map((s) => (s.type === 'ink' ? `\n\n@@ink:${s.blockId}@@\n\n` : s.text || ''))
                                      .join('');
                                    setContent(reconstructed);
                                    triggerAutoSave(title, reconstructed, category, folderId, projectId, tagsInput, isPinned, attachments);
                                    checkMathContext(reconstructed, seg.startOffset + e.target.selectionStart);
                                  }}
                                  onKeyDown={handleTextareaKeyDown}
                                  onKeyUp={(e) => checkMathContext(content, seg.startOffset + e.currentTarget.selectionStart)}
                                  onClick={(e) => checkMathContext(content, seg.startOffset + e.currentTarget.selectionStart)}
                                  onSelect={(e) => checkMathContext(content, seg.startOffset + e.currentTarget.selectionStart)}
                                  placeholder="Tapez vos formules en Markdown ou LaTeX..."
                                  rows={Math.max(3, (seg.text || '').split('\n').length + 1)}
                                  className={`w-full p-4 rounded-2xl border text-sm leading-relaxed resize-y focus:outline-none transition-all font-mono ${
                                    theme === 'dark'
                                      ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-indigo-500/60'
                                      : 'bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500 shadow-xs'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex flex-col h-full">
                      <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Rendu Présentation & LaTeX
                      </div>
                      <div
                        className={`w-full flex-1 min-h-[460px] p-6 rounded-2xl border overflow-y-auto transition-all ${
                          theme === 'dark'
                            ? 'bg-zinc-950/80 border-zinc-800'
                            : 'bg-white border-zinc-200 shadow-xs'
                        }`}
                      >
                        <LatexRenderer
                          content={content}
                          onToggleCheckbox={handleToggleCheckbox}
                          renderInkBlock={(blockId) => (
                            <InlineInkBlock
                              noteId={currentNote.id}
                              blockId={blockId}
                              data={inkBlocks[blockId]}
                              readOnly
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'preview' && (
                  <div
                    className={`p-6 md:p-10 rounded-2xl border shadow-sm transition-all min-h-[480px] ${
                      theme === 'dark'
                        ? 'bg-zinc-950/70 border-zinc-800/80 shadow-black/20'
                        : 'bg-white border-zinc-200 shadow-sm'
                    }`}
                  >
                    <div className="pb-4 mb-6 border-b border-inherit">
                      <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                        {title || 'Sans titre'}
                      </h1>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                        <span className="capitalize px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">
                          {category}
                        </span>
                        {(() => {
                          const noteFol = folders.find((f) => f.id === folderId);
                          if (!noteFol) return null;
                          return (
                            <span
                              className="px-2 py-0.5 rounded font-medium flex items-center gap-1"
                              style={{
                                backgroundColor: `${noteFol.color || '#6366f1'}20`,
                                color: noteFol.color || '#6366f1',
                              }}
                            >
                              📁 {noteFol.name}
                            </span>
                          );
                        })()}
                        <span>
                          Dernière mise à jour :{' '}
                          {new Date(currentNote.updatedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <LatexRenderer
                      content={content}
                      onToggleCheckbox={handleToggleCheckbox}
                      renderInkBlock={(blockId) => (
                        <InlineInkBlock
                          noteId={currentNote.id}
                          blockId={blockId}
                          data={inkBlocks[blockId]}
                          onChange={handleInkBlockChange}
                          onDelete={handleDeleteInkBlock}
                        />
                      )}
                    />
                  </div>
                )}

                {viewMode === 'ink' && (
                  <div className="w-full h-full min-h-[620px] flex flex-col">
                    <InkNoteEditor
                      key={currentNote.id}
                      note={currentNote}
                      onSaveInk={handleSaveInk}
                      className="w-full flex-1"
                    />
                  </div>
                )}
              </div>

              {/* Compteur de mots & Temps de lecture (si activé dans les paramètres) */}
              {settings.showWordCount && viewMode !== 'ink' && (
                <div
                  className={`mt-4 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-colors ${
                    theme === 'dark'
                      ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                      : 'bg-zinc-100/80 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-zinc-200">{noteMetrics.words}</strong> mots
                    </span>
                    <span>
                      <strong className="text-zinc-200">{noteMetrics.chars}</strong> caractères
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Lecture ~{noteMetrics.readTimeMinutes} min</span>
                  </div>
                </div>
              )}

              {/* Infobulle d'aperçu KaTeX en direct quand le curseur est dans une formule */}
              {activeMathContext && viewMode !== 'preview' && viewMode !== 'ink' && (
                <LatexLivePreview
                  math={activeMathContext.math}
                  displayMode={activeMathContext.displayMode}
                  onClose={() => setActiveMathContext(null)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4 p-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 shadow-lg">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-zinc-200">Base de Connaissances Syntropy</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Sélectionnez une note existante, créez-en une nouvelle ou importez directement vos documents (Word, Excel, PowerPoint, PDF, images).
              </p>
            </div>
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
                <span>Afficher les dossiers et notes</span>
              </button>
            )}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => handleCreateNewNote('text')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                + Note Classique
              </button>
              <button
                onClick={() => handleCreateNewNote('ink')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <PenTool className="w-3.5 h-3.5" />
                + Note Manuscrite
              </button>
              <label
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                title="Importer un document (Word, Excel, PowerPoint, PDF, Image...)"
              >
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                Importer Doc
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*,.txt,.md,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.tsv,.ods,.odt,.rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleImportFilesAsNewNotes(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Modal Création de Dossier */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base">
                  {newFolderParentId ? 'Nouveau sous-dossier' : 'Nouveau dossier de notes'}
                </h3>
              </div>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Nom du {newFolderParentId ? 'sous-dossier' : 'dossier'}
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={newFolderParentId ? 'Ex: Chapitre 1, Exercices, Documentation...' : 'Ex: Cours & Études, Projets 2026, Documentation...'}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-indigo-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-indigo-500'
                }`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmCreateFolder();
                }}
              />
            </div>

            {/* Dossier parent (optionnel) */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Emplacement / Dossier parent
              </label>
              <select
                value={newFolderParentId || ''}
                onChange={(e) => setNewFolderParentId(e.target.value || null)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-indigo-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-800 focus:border-indigo-500'
                }`}
              >
                <option value="">📁 Aucun (Dossier racine)</option>
                {flattenedFolderOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.level > 0 ? `${'\u00A0\u00A0'.repeat(f.level)}↳ 📁 ` : '📁 '}
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-2">
                Couleur thématique
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setNewFolderColor(c.color)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                      newFolderColor === c.color ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                  theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                }`}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {newFolderParentId ? 'Créer le sous-dossier' : 'Créer le dossier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'Aperçu d'Image Agrandie */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="font-semibold text-sm truncate">{previewImageModal.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadAttachment(previewImageModal)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </button>
                <button
                  onClick={() => setPreviewImageModal(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {previewImageModal.dataUrl ? (
              <img
                src={previewImageModal.dataUrl}
                alt={previewImageModal.name}
                className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-zinc-700"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-zinc-300 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <span className="text-sm font-medium">Chargement de l'image haute résolution depuis le Cloud...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Assistant de Formules LaTeX */}
      <LatexHelperModal
        isOpen={isLatexModalOpen}
        onClose={() => setIsLatexModalOpen(false)}
        onInsert={handleInsertLatexFormula}
      />

      {/* Modal Tutoriel Express LaTeX */}
      <LatexTutorialModal
        isOpen={isLatexTutorialOpen}
        onClose={() => setIsLatexTutorialOpen(false)}
        onCreateExampleNote={handleCreateLatexExampleNote}
      />

      {/* Modal Sélecteur de Modèles de Notes Syntropy */}
      <NoteTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
        hasCurrentNote={!!currentNote}
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
          Chargement de la base de connaissances...
        </div>
      }
    >
      <NotesContent />
    </Suspense>
  );
}
