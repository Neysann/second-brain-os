'use client';

import React, { useState, useId, useEffect, useRef } from 'react';
import {
  Palette,
  FileText,
  FolderGit2,
  Database,
  User,
  Sun,
  Moon,
  Laptop,
  Check,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Cloud,
  Sliders,
  Type,
  Maximize2,
  Clock,
  Calendar,
  CheckSquare,
  ShieldCheck,
  Eye,
  Columns2,
  Edit3,
  Layers,
  Save,
  RotateCcw,
  Zap,
  ZapOff,
  SunMedium,
  PenTool,
  Crown,
  ShieldAlert,
  Brain,
  Info,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { isSiteAdmin } from '@/lib/admin';
import AdminControlPanel from '@/components/AdminControlPanel';
import DesktopSettingsSection from '@/components/settings/DesktopSettingsSection';
import { CURRENT_VERSION } from '@/components/WhatsNewModal';
import { SecretThemeModal, playSecretUnlockSound } from '@/components/SecretThemeModal';
import {
  ThemeSetting,
  AccentColor,
  DarkBgStyle,
  NeonIntensity,
  TypographyStyle,
  DisplayDensity,
  DefaultEditorMode,
  AutoSaveDelay,
  StartupView,
  FirstDayOfWeek,
  TaskPriority,
  InkPaperColor,
} from '@/types';
import JSZip from 'jszip';

export type SettingsTab = 'appearance' | 'editor' | 'para' | 'data' | 'desktop' | 'admin';

const NEON_INTENSITY_OPTIONS: {
  id: NeonIntensity;
  name: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'subtle',
    name: 'Discret / Atténué',
    badge: 'Recommandé',
    desc: 'Lueur adoucie à 25% pour reposer la vue lors des longues sessions de travail.',
    icon: SunMedium,
  },
  {
    id: 'none',
    name: 'Minimaliste / Éteint',
    badge: 'Zéro néon',
    desc: 'Style épuré type Notion / Linear sans aucun halo lumineux ni reflet fluorescent.',
    icon: ZapOff,
  },
  {
    id: 'vibrant',
    name: 'Vibrant / Cyber',
    badge: 'Original',
    desc: 'Luminescence complète et saturation maximale pour l’ambiance cyberpunk native.',
    icon: Zap,
  },
];

const ACCENT_OPTIONS: {
  id: AccentColor;
  name: string;
  shortName: string;
  hex: string;
  colorHex: string;
  desc: string;
  isGradient?: boolean;
}[] = [
  { id: 'purple', name: 'Violet Synaptique', shortName: 'Violet', hex: '#8b5cf6', colorHex: '#8b5cf6', desc: 'Ambiance néon cyberpunk classique' },
  { id: 'aether', name: 'Aether (Bleu Violacé)', shortName: 'Aether', hex: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)', colorHex: '#6366f1', isGradient: true, desc: 'Dégradé vibrant bleu électrique vers violet' },
  { id: 'mix', name: 'Harmonie Mix', shortName: 'Mix', hex: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 33%, #10b981 66%, #e03148 100%)', colorHex: '#8b5cf6', isGradient: true, desc: 'Mélange dynamique et harmonieux' },
  { id: 'cyan', name: 'Bleu Cyan', shortName: 'Cyan', hex: '#06b6d4', colorHex: '#06b6d4', desc: 'Haute clarté visuelle et énergie' },
  { id: 'emerald', name: 'Vert Émeraude', shortName: 'Vert', hex: '#10b981', colorHex: '#10b981', desc: 'Concentration, sérénité & nature' },
  { id: 'amber', name: 'Orange Ambre', shortName: 'Ambre', hex: '#f59e0b', colorHex: '#f59e0b', desc: 'Chaleureux, stimulant et vif' },
  { id: 'red', name: 'Rouge Rubis', shortName: 'Rouge', hex: '#e03148', colorHex: '#e03148', desc: 'Feutré, velours noble et élégant' },
  { id: 'monochrome', name: 'Monochrome', shortName: 'Gris', hex: '#71717a', colorHex: '#71717a', desc: 'Minimalisme sobre et pur' },
];

const DARK_BG_OPTIONS: { id: DarkBgStyle; name: string; hex: string; desc: string; badge: string }[] = [
  {
    id: 'zinc',
    name: 'Zinc / Anthracite',
    hex: '#09090b',
    desc: 'Fond feutré moderne (#09090b) avec contrastes doux et reflets tamisés.',
    badge: 'Standard',
  },
  {
    id: 'oled',
    name: 'Sombre absolu (OLED)',
    hex: '#000000',
    desc: 'Noir pur profond (#000000). Immersion totale et économie d\'énergie sur écrans OLED.',
    badge: 'Contraste Absolu',
  },
];

const PAPER_COLOR_SETTINGS: {
  id: InkPaperColor;
  label: string;
  badge: string;
  desc: string;
  bgHex: string;
  borderHex: string;
}[] = [
  {
    id: 'dark',
    label: 'Noir Pur (OLED)',
    badge: 'Défaut',
    desc: 'Fond sombre profond avec tracé lumineux néon.',
    bgHex: '#09090b',
    borderHex: '#27272a',
  },
  {
    id: 'white',
    label: 'Blanc Pur',
    badge: 'Classique',
    desc: 'Feuille claire traditionnelle idéale pour imprimer ou exporter.',
    bgHex: '#ffffff',
    borderHex: '#e4e4e7',
  },
  {
    id: 'sepia',
    label: 'Jauni / Sépia',
    badge: 'Confort Yeux',
    desc: 'Teinte carnet vintage reposante anti-lumière bleue.',
    bgHex: '#fbf0d9',
    borderHex: '#e7d6b8',
  },
  {
    id: 'slate',
    label: 'Ardoise Sombre',
    badge: 'Moderne',
    desc: 'Gris ardoise contemporain (#1e293b) à faible éblouissement.',
    bgHex: '#1e293b',
    borderHex: '#334155',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [isDesktop, setIsDesktop] = useState(false);
  const { settings, effectiveTheme, updateSetting, updateMultipleSettings, resetSettings } = useSettings();
  const { notes, tasks, projects, folders, isFirebaseConnected, addNote } = useData();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || (user?.email && isSiteAdmin(user.email)));

  const isDark = effectiveTheme === 'dark';

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const fileInputId = useId();

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Détection Desktop et écoute des query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDesktopApp = Boolean((window as unknown as { electronAPI?: { isDesktop?: boolean } })?.electronAPI?.isDesktop);
    setIsDesktop(isDesktopApp);

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as string | null;

    if (tabParam === 'profile') {
      setActiveTab('data');
    } else if (tabParam) {
      const validTabs: SettingsTab[] = ['appearance', 'editor', 'para', 'data', 'desktop', 'admin'];
      if (validTabs.includes(tabParam as SettingsTab)) {
        setActiveTab(tabParam as SettingsTab);
      }
    }
  }, []);

  const handleTabChange = (newTab: SettingsTab) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Easter Egg : Konami Code (Touches fléchées)
  const [isSecretThemeModalOpen, setIsSecretThemeModalOpen] = useState(false);
  const konamiSequenceRef = useRef<string[]>([]);
  const KONAMI_ARROW_CODE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.w-md-editor'))
      ) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        konamiSequenceRef.current.push(e.key);
        if (konamiSequenceRef.current.length > KONAMI_ARROW_CODE.length) {
          konamiSequenceRef.current.shift();
        }

        if (
          konamiSequenceRef.current.length === KONAMI_ARROW_CODE.length &&
          konamiSequenceRef.current.every((key, i) => key === KONAMI_ARROW_CODE[i])
        ) {
          konamiSequenceRef.current = [];
          playSecretUnlockSound();
          setIsSecretThemeModalOpen(true);
        }
      } else {
        konamiSequenceRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Export JSON complet
  const handleExportJson = () => {
    try {
      setIsExporting(true);
      const fullBackup = {
        app: 'Syntropy OS',
        version: CURRENT_VERSION,
        exportedAt: new Date().toISOString(),
        user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
        settings,
        stats: {
          notesCount: notes.length,
          tasksCount: tasks.length,
          projectsCount: projects.length,
          foldersCount: folders.length,
        },
        data: {
          notes,
          tasks,
          projects,
          folders,
        },
      };

      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syntropy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('Sauvegarde JSON exportée avec succès !');
    } catch (e) {
      console.error(e);
      showNotification("Erreur lors de l'exportation JSON.", 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export Markdown Archive (.zip)
  const handleExportMarkdownZip = async () => {
    try {
      setIsExporting(true);
      const zip = new JSZip();

      const folderMap = new Map<string, string>();
      folders.forEach((f) => folderMap.set(f.id, f.name));

      notes.forEach((note) => {
        let folderName = 'Sans Dossier';
        if (note.folderId && folderMap.has(note.folderId)) {
          folderName = folderMap.get(note.folderId)!;
        }

        const safeFolderName = folderName.replace(/[/\\?%*:|"<>]/g, '-');
        const safeTitle = (note.title || 'Note sans titre').replace(/[/\\?%*:|"<>]/g, '-');

        const metadataHeader = [
          '---',
          `title: "${note.title.replace(/"/g, '\\"')}"`,
          `created: "${note.createdAt}"`,
          `updated: "${note.updatedAt}"`,
          `tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]`,
          `category: "${note.category}"`,
          `folder: "${folderName}"`,
          '---',
          '',
          '',
        ].join('\n');

        const fullContent = metadataHeader + (note.content || '');
        zip.folder(safeFolderName)?.file(`${safeTitle}.md`, fullContent);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syntropy-notes-markdown-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification(`${notes.length} note(s) exportée(s) en archive ZIP Markdown !`);
    } catch (e) {
      console.error(e);
      showNotification("Erreur lors de la création de l'archive ZIP.", 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Importation de fichiers .md ou .json
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    let importedNotesCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();

        if (file.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(text);
            if (parsed.data && Array.isArray(parsed.data.notes)) {
              for (const n of parsed.data.notes) {
                await addNote({
                  title: n.title || 'Note importée',
                  content: n.content || '',
                  tags: n.tags || [],
                  category: n.category || 'resource',
                  isPinned: Boolean(n.isPinned),
                });
                importedNotesCount++;
              }
            }
          } catch (jsonErr) {
            console.warn('Fichier JSON non conforme Syntropy:', jsonErr);
          }
        } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
          const title = file.name.replace(/\.(md|markdown)$/i, '');
          let content = text;
          const tags: string[] = ['import'];

          if (text.startsWith('---')) {
            const secondIndex = text.indexOf('---', 3);
            if (secondIndex !== -1) {
              const frontmatter = text.substring(3, secondIndex);
              content = text.substring(secondIndex + 3).trim();

              const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
              if (tagsMatch && tagsMatch[1]) {
                const parsedTags = tagsMatch[1]
                  .split(',')
                  .map((t) => t.replace(/["'\s]/g, ''))
                  .filter(Boolean);
                tags.push(...parsedTags);
              }
            }
          }

          await addNote({
            title: title || 'Note sans titre',
            content,
            tags: Array.from(new Set(tags)),
            category: 'resource',
            isPinned: false,
          });
          importedNotesCount++;
        }
      }

      setImportSummary(`${importedNotesCount} note(s) importée(s) avec succès !`);
      showNotification(`Importation réussie : ${importedNotesCount} note(s) ajoutée(s).`);
    } catch (err) {
      console.error(err);
      showNotification('Format de fichier non reconnu ou erreur de lecture.', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Définition des onglets de la barre latérale
  const navTabs: { id: SettingsTab; label: string; sub: string; icon: React.ComponentType<{ className?: string }>; highlight?: 'admin' | 'desktop' }[] = [
    { id: 'appearance', label: 'Apparence & Design', sub: 'Luminosité, accents, néon & OLED', icon: Palette },
    { id: 'editor', label: 'Éditeur & Notes', sub: 'Mode d\'ouverture, stylet & sauvegarde', icon: FileText },
    { id: 'para', label: 'Productivité & PARA', sub: 'Vue par défaut, calendrier & priorités', icon: FolderGit2 },
    { id: 'data', label: 'Données & Profil', sub: 'Compte, Firestore, exports & imports', icon: Database },
    ...(isDesktop
      ? [{ id: 'desktop' as SettingsTab, label: 'Application Desktop', sub: 'Raccourcis, cache & démarrage', icon: Laptop, highlight: 'desktop' as const }]
      : []),
    ...(isAdmin
      ? [{ id: 'admin' as SettingsTab, label: 'Console Admin', sub: 'Rôles, maintenance & audit', icon: Crown, highlight: 'admin' as const }]
      : []),
  ];

  // Calculs pour les styles d'accentuation et prévisualisation compacte
  const isCyberpunk = settings.uiStyle === 'cyberpunk';
  const isNothing = !isCyberpunk && settings.uiStyle === 'nothing';
  const activeAccent = isCyberpunk
    ? { id: 'cyberpunk' as AccentColor, name: 'Cyberpunk HUD', shortName: 'Cyber', colorHex: '#FCEE0A', hex: '#FCEE0A', desc: '' }
    : isNothing
    ? (ACCENT_OPTIONS.find((c) => c.id === 'red') || ACCENT_OPTIONS[0])
    : (ACCENT_OPTIONS.find((c) => c.id === settings.accentColor || (c.id === 'red' && settings.accentColor === 'rose')) || ACCENT_OPTIONS[0]);

  const activeAccentHex = isCyberpunk ? '#FCEE0A' : isNothing ? '#D71920' : activeAccent.colorHex;

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      {/* Toast de notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200 ${
          isDark ? 'bg-zinc-900/95 text-white border-zinc-700/80 shadow-black/50' : 'bg-white text-zinc-900 border-zinc-200 shadow-zinc-300'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
            notification.type === 'error' ? 'bg-rose-500' : notification.type === 'info' ? 'bg-cyan-400' : 'bg-emerald-400'
          }`} />
          <span className="text-xs font-medium">{notification.message}</span>
        </div>
      )}

      {/* En-tête principal */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b ${isDark ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-500 mb-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Panneau de Configuration</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Paramètres
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
              v{CURRENT_VERSION}
            </span>
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Personnalisez l’environnement, l’éditeur de notes, les données et l’application desktop.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Voulez-vous réinitialiser tous les paramètres aux valeurs d\'origine ?')) {
              resetSettings();
              showNotification('Paramètres réinitialisés aux valeurs par défaut.');
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer self-start sm:self-auto ${
            isDark
              ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 shadow-xs'
          }`}
          title="Réinitialiser tous les réglages"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser par défaut</span>
        </button>
      </div>

      {/* Layout 2 colonnes : Barre Latérale Gauche + Contenu Principal */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* ========================================================= */}
        {/* BARRE LATÉRALE DE NAVIGATION (Sidebar gauche)            */}
        {/* ========================================================= */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className={`p-2 rounded-2xl border space-y-1 ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-100/80 border-zinc-200 shadow-xs'
          }`}>
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isAdminTab = tab.highlight === 'admin';
              const isDesktopTab = tab.highlight === 'desktop';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 relative ${
                    isActive
                      ? isAdminTab
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-md shadow-amber-500/20'
                        : isDesktopTab
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/25'
                      : isAdminTab
                      ? isDark
                        ? 'text-amber-400 hover:bg-amber-950/30 border border-amber-500/20'
                        : 'text-amber-700 hover:bg-amber-50 border border-amber-300/60'
                      : isDesktopTab
                      ? isDark
                        ? 'text-cyan-400 hover:bg-cyan-950/30 border border-cyan-500/20'
                        : 'text-cyan-700 hover:bg-cyan-50 border border-cyan-300/60'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? '' : 'opacity-80'}`} />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold block leading-tight truncate">
                      {tab.label}
                    </span>
                    <span className={`text-[10px] block mt-0.5 truncate ${
                      isActive
                        ? isAdminTab ? 'text-amber-950' : 'text-purple-100/90'
                        : isDark ? 'text-zinc-500' : 'text-zinc-500'
                    }`}>
                      {tab.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ========================================================= */}
        {/* CONTENU PRINCIPAL                                        */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* ======================================================= */}
          {/* 1. APPARENCE & THÈMES                                  */}
          {/* ======================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Carte Compacte de Prévisualisation Réactive */}
              <div className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                isDark ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: activeAccentHex }} />
                    <span className="text-xs font-bold uppercase tracking-wider">Aperçu Réactif en Direct</span>
                  </div>
                  {(isCyberpunk || isNothing) ? (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      ⚡ Thème secret : {isCyberpunk ? 'Cyberpunk HUD' : 'Nothing OS'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-zinc-800/60 text-zinc-400 border border-zinc-700/50">
                      Liquid Glass UI
                    </span>
                  )}
                </div>

                <div
                  className="p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{
                    backgroundColor: isDark
                      ? (settings.darkBgStyle === 'oled' ? '#000000' : '#09090b')
                      : '#f8fafc',
                    borderColor: `${activeAccentHex}40`,
                    boxShadow: settings.neonIntensity === 'none' ? 'none' : `0 0 20px ${activeAccentHex}20`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
                      style={{ backgroundColor: activeAccentHex }}
                    >
                      <Brain className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          settings.typography === 'mono' ? 'font-mono' : settings.typography === 'serif' ? 'font-serif' : 'font-sans'
                        }`}>
                          Syntropy OS • {user?.displayName || 'Nathan'}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full animate-ping"
                          style={{ backgroundColor: activeAccentHex }}
                        />
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Transparence : {settings.reduceTransparency ? '0% (Désactivée)' : `${settings.surfaceTransparency ?? 35}%`} • Densité : {settings.density === 'compact' ? 'Compact' : 'Aéré'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-950 shadow-sm transition-transform active:scale-95 cursor-pointer"
                      style={{ backgroundColor: activeAccentHex }}
                    >
                      Bouton Accent
                    </button>
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs border font-medium"
                      style={{ borderColor: `${activeAccentHex}50`, color: activeAccentHex }}
                    >
                      Badge Actif
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerte discrète si un thème secret est actuellement actif */}
              {(isCyberpunk || isNothing) && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
                  isCyberpunk
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200'
                    : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isCyberpunk ? 'bg-yellow-500/20 text-[#FCEE0A]' : 'bg-red-500/20 text-[#D71920]'}`}>
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">
                        Thème secret actif : {isCyberpunk ? 'Cyberpunk HUD 2077' : 'Nothing OS (Monochrome)'}
                      </span>
                      <span className="text-[11px] opacity-80 block">
                        Cette direction artistique provient du laboratoire secret des thèmes.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        updateMultipleSettings({
                          uiStyle: 'syntropy',
                          accentColor: settings.previousAccentColor || 'purple',
                        });
                        showNotification('Retour au style standard Syntropy Liquid Glass');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white cursor-pointer transition-colors shadow-xs"
                    >
                      Revenir au style standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSecretThemeModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors shadow-xs"
                    >
                      Ouvrir le menu secret
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Sombre / Clair / Auto */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    Luminosité & Nuance Sombre
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Contrôlez le thème clair/sombre et choisissez la profondeur du noir en mode sombre.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dark' as ThemeSetting, label: 'Mode Sombre', icon: Moon, desc: 'Interface tamisée haute lisibilité' },
                    { id: 'light' as ThemeSetting, label: 'Mode Clair', icon: Sun, desc: 'Pureté éclatante pour le jour' },
                    { id: 'auto' as ThemeSetting, label: 'Automatique', icon: Laptop, desc: 'Synchronisé avec le système d\'exploitation' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = settings.theme === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          updateSetting('theme', m.id);
                          showNotification(`Thème réglé sur "${m.label}"`);
                        }}
                        className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold ring-1 ring-purple-500/30'
                            : isDark
                            ? 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                        }`}
                        style={isSelected ? { borderColor: activeAccentHex, color: activeAccentHex } : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-semibold">{m.label}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>

                {/* Nuance du noir OLED vs Zinc */}
                <div className="pt-3 border-t border-inherit">
                  <span className="text-xs font-semibold block mb-2">Nuance du fond en mode sombre :</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DARK_BG_OPTIONS.map((opt) => {
                      const isSelected = (settings.darkBgStyle || 'zinc') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            updateSetting('darkBgStyle', opt.id);
                            showNotification(opt.id === 'oled' ? 'Mode Sombre absolu OLED activé' : 'Nuance Zinc anthracite activée');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/10 font-bold'
                              : isDark
                              ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                          }`}
                          style={isSelected ? { borderColor: activeAccentHex } : undefined}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-zinc-700" style={{ backgroundColor: opt.hex }} />
                            <div>
                              <span className="text-xs block font-semibold">{opt.name}</span>
                              <span className="text-[10px] text-zinc-500 block">{opt.badge}</span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" style={{ color: activeAccentHex }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Palette de couleurs d'accentuation */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Couleur d'accentuation
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Colore les boutons primaires, sélections, indicateurs d’état et lueurs actives.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ACCENT_OPTIONS.map((c) => {
                    const isSelected = settings.accentColor === c.id || (c.id === 'red' && settings.accentColor === 'rose');
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          updateSetting('accentColor', c.id);
                          showNotification(`Accent réglé sur "${c.name}"`);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'ring-2 border-transparent bg-zinc-800/80 text-white font-bold'
                            : isDark
                            ? 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                        }`}
                        style={isSelected ? { borderColor: c.colorHex, boxShadow: `0 0 12px ${c.colorHex}30` } : undefined}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs"
                          style={{ background: c.hex }}
                        />
                        <span className="text-xs truncate">{c.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typographie, Densité & Lueur Néon */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Typographie */}
                <div className={`p-5 rounded-3xl border space-y-3 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <h3 className="text-xs font-bold flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-cyan-400" />
                    Typographie
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { id: 'sans' as TypographyStyle, label: 'Sans-Serif (Inter)' },
                      { id: 'serif' as TypographyStyle, label: 'Serif (Lora)' },
                      { id: 'mono' as TypographyStyle, label: 'Monospace (JetBrains)' },
                    ].map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => updateSetting('typography', font.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                          settings.typography === font.id
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                            : isDark ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <span>{font.label}</span>
                        {settings.typography === font.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Densité */}
                <div className={`p-5 rounded-3xl border space-y-3 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <h3 className="text-xs font-bold flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    Densité d'affichage
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { id: 'comfortable' as DisplayDensity, label: 'Mode Aéré (Standard)' },
                      { id: 'compact' as DisplayDensity, label: 'Mode Compact' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => updateSetting('density', d.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                          settings.density === d.id
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                            : isDark ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <span>{d.label}</span>
                        {settings.density === d.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensité du néon */}
                <div className={`p-5 rounded-3xl border space-y-3 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <h3 className="text-xs font-bold flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Luminescence Néon
                  </h3>
                  <div className="space-y-1.5">
                    {NEON_INTENSITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateSetting('neonIntensity', opt.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                          (settings.neonIntensity || 'vibrant') === opt.id
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                            : isDark ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <span>{opt.name.split('/')[0]}</span>
                        {(settings.neonIntensity || 'vibrant') === opt.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transparence & Flou Liquid Glass */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                      Transparence des Surfaces (Liquid Glass)
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Ajustez le niveau d’opacité et de flou translucide sur les barres et fenêtres.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {settings.reduceTransparency ? 'Désactivée (0%)' : `${settings.surfaceTransparency ?? 35}%`}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="65"
                    step="5"
                    disabled={settings.reduceTransparency}
                    value={settings.surfaceTransparency ?? 35}
                    onChange={(e) => updateSetting('surfaceTransparency', Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateSetting('reduceTransparency', !settings.reduceTransparency)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex-shrink-0 cursor-pointer transition-colors ${
                      settings.reduceTransparency
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : isDark ? 'border-zinc-800 bg-zinc-800/50 text-zinc-400' : 'border-zinc-300 bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {settings.reduceTransparency ? 'Réduire la transparence : OUI' : 'Désactiver le flou'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 2. ÉDITEUR & NOTES                                      */}
          {/* ======================================================= */}
          {activeTab === 'editor' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Mode d'ouverture par défaut */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-purple-400" />
                    Mode d'ouverture par défaut d'une note
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Déterminez la vue affichée automatiquement au clic sur une note.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'write' as DefaultEditorMode, label: 'Mode Rédaction', icon: Edit3, desc: 'Plein écran pour rédiger immédiatement en Markdown' },
                    { id: 'split' as DefaultEditorMode, label: 'Côte-à-Côte (Split)', icon: Columns2, desc: 'Code source à gauche, rendu temps réel KaTeX à droite' },
                    { id: 'preview' as DefaultEditorMode, label: 'Mode Lecture', icon: Eye, desc: 'Mise en page épurée prête pour la révision' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = settings.defaultEditorMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          updateSetting('defaultEditorMode', m.id);
                          showNotification(`Mode d'ouverture défini sur "${m.label}"`);
                        }}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                            : isDark
                            ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div>
                          <span className="font-semibold text-sm block">{m.label}</span>
                          <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{m.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Couleur de la feuille manuscrite par défaut (Stylet Stylus) */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-400" />
                    Couleur de la feuille manuscrite (Stylet Syntropy)
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Teinte de fond par défaut pour les esquisses, schémas et prises de notes au stylet.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PAPER_COLOR_SETTINGS.map((item) => {
                    const isSelected = (settings.defaultInkPaperColor || 'dark') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          updateSetting('defaultInkPaperColor', item.id);
                          showNotification(`Feuille manuscrite réglée sur "${item.label}"`);
                        }}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                            : isDark
                            ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-lg border shadow-xs"
                              style={{ backgroundColor: item.bgHex, borderColor: item.borderHex }}
                            />
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-300">
                              {item.badge}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div>
                          <span className="font-semibold text-sm block">{item.label}</span>
                          <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {item.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Délai de sauvegarde automatique */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Délai d'enregistrement automatique
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Intervalle entre chaque frappe pour persister vers Firestore et la mémoire locale.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 500 as AutoSaveDelay, label: 'Instantané (0.5s)', desc: 'Sauvegarde immédiate réactive' },
                    { id: 2000 as AutoSaveDelay, label: 'Équilibré (2 sec)', desc: 'Idéal et optimisé pour le réseau' },
                    { id: 5000 as AutoSaveDelay, label: 'Détendu (5 sec)', desc: 'Parfait pour les longues sessions' },
                  ].map((delay) => {
                    const isSelected = settings.autoSaveDelay === delay.id;
                    return (
                      <button
                        key={delay.id}
                        type="button"
                        onClick={() => {
                          updateSetting('autoSaveDelay', delay.id);
                          showNotification(`Délai réglé sur ${delay.label}`);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                            : isDark
                            ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{delay.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </div>
                        <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{delay.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles : Compteur de mots & Backlinks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div>
                    <span className="font-semibold text-sm block">Compteur de mots & lecture</span>
                    <span className={`text-xs block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Affiche les statistiques en bas de l’éditeur
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('showWordCount', !settings.showWordCount)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      settings.showWordCount ? 'bg-purple-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div>
                    <span className="font-semibold text-sm block">Liens bidirectionnels & Backlinks</span>
                    <span className={`text-xs block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Réseau de connexions automatiques entre notes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('showBacklinks', !settings.showBacklinks)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      settings.showBacklinks ? 'bg-purple-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 3. PRODUCTIVITÉ & MÉTHODE PARA                          */}
          {/* ======================================================= */}
          {activeTab === 'para' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Page de démarrage */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Écran de démarrage par défaut
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Vue chargée immédiatement lors du lancement de Syntropy OS.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: '/' as StartupView, label: 'Tableau de bord', desc: 'Synthèse globale & objectifs' },
                    { id: '/tasks' as StartupView, label: 'Kanban des Projets', desc: 'Gestion des flux et des tâches' },
                    { id: '/notes' as StartupView, label: 'Notes & Savoirs', desc: 'Base de connaissances immédiate' },
                    { id: '/calendar' as StartupView, label: 'Calendrier', desc: 'Planning temporel des échéances' },
                  ].map((v) => {
                    const isSelected = settings.startupView === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          updateSetting('startupView', v.id);
                          showNotification(`Démarrage réglé sur "${v.label}"`);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                            : isDark
                            ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{v.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </div>
                        <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{v.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendrier & Priorité des tâches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      Premier jour de la semaine
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Utilisé pour le calendrier et les échéanciers.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'monday' as FirstDayOfWeek, label: 'Lundi', desc: 'Norme ISO (Europe)' },
                      { id: 'sunday' as FirstDayOfWeek, label: 'Dimanche', desc: 'Norme US' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          updateSetting('firstDayOfWeek', d.id);
                          showNotification(`Semaine débutant le ${d.label}`);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.firstDayOfWeek === d.id
                            ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-bold'
                            : isDark
                            ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{d.label}</span>
                          {settings.firstDayOfWeek === d.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      Priorité par défaut des tâches
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Attribuée lors de la création d’une tâche.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'low' as TaskPriority, label: 'Basse', color: 'text-zinc-400' },
                      { id: 'medium' as TaskPriority, label: 'Moyenne', color: 'text-amber-400' },
                      { id: 'high' as TaskPriority, label: 'Haute', color: 'text-rose-400' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          updateSetting('defaultTaskPriority', p.id);
                          showNotification(`Priorité par défaut : ${p.label}`);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          settings.defaultTaskPriority === p.id
                            ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500/30'
                            : isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        <span className={`text-xs font-bold ${p.color}`}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Masquer les sections vides */}
              <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <span className="font-semibold text-sm block">Masquer les catégories PARA vides</span>
                  <span className={`text-xs block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Cache dans la barre latérale les sections (Projets, Domaines, Ressources, Archives) ayant 0 élément
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('hideEmptyParaCategories', !settings.hideEmptyParaCategories)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    settings.hideEmptyParaCategories ? 'bg-purple-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 4. DONNÉES, PROFIL & SAUVEGARDES                        */}
          {/* ======================================================= */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Carte Profil & Salutations */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className={`w-12 h-12 rounded-2xl object-cover ${
                          user?.isAdmin ? 'ring-2 ring-amber-500' : 'ring-2 ring-purple-500/40'
                        }`}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-lg text-white shadow-md ${
                        user?.isAdmin ? 'bg-amber-600 ring-2 ring-amber-400' : 'bg-purple-600'
                      }`}>
                        {user?.isAdmin ? '👑' : (user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{user?.displayName || 'Utilisateur Syntropy'}</span>
                        {user?.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            👑 Super-Admin
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 font-mono block">{user?.email || 'Non connecté'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.greetingName}
                      onChange={(e) => updateSetting('greetingName', e.target.value)}
                      placeholder={user?.displayName || 'Nathan'}
                      className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                      title="Nom pour la salutation du dashboard"
                    />
                    <button
                      type="button"
                      onClick={() => showNotification(`Salutation définie sur "${settings.greetingName || user?.displayName || 'Nathan'}"`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Sauvegarder</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* État de synchronisation Cloud Firestore */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-base font-bold">Synchronisation Cloud Firestore</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        second-brain-os-e6a83
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Sauvegarde en direct sur Google Cloud Firestore avec cache local résilient (0ms de latence).
                    </p>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border w-fit ${
                    isFirebaseConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                    <span>{isFirebaseConnected ? 'Cloud : Connecté' : 'Hors-Ligne (Local)'}</span>
                  </div>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {[
                    { count: notes.length, label: 'Notes', color: 'text-purple-400' },
                    { count: tasks.length, label: 'Tâches', color: 'text-indigo-400' },
                    { count: projects.length, label: 'Projets', color: 'text-cyan-400' },
                    { count: folders.length, label: 'Dossiers', color: 'text-emerald-400' },
                  ].map((s, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border text-center ${
                      isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <span className={`text-base font-bold font-mono ${s.color}`}>{s.count}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sauvegardes Souveraines (Exports) */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Download className="w-4 h-4 text-purple-400" />
                    Exports Souverains & Sauvegardes
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Téléchargez vos données aux formats ouverts et interopérables (Markdown et JSON).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleExportMarkdownZip}
                    disabled={isExporting}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                      isDark ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Archive ZIP Markdown (.md)</span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Toutes les notes classées par dossiers, prêtes pour Obsidian & Logseq.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={isExporting}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                      isDark ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Sauvegarde Intégrale (.json)</span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Toutes vos données (notes, tâches, projets, dossiers, préférences) en un fichier.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Importation .md / .json */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Importation de fichiers (.md & .json)
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Importez des notes Obsidian, Notion ou des sauvegardes JSON complètes.
                  </p>
                </div>

                <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDark ? 'border-zinc-800 hover:border-purple-500/60 bg-zinc-950/30' : 'border-zinc-300 hover:border-purple-500/60 bg-zinc-50/70'
                }`}>
                  <input
                    id={fileInputId}
                    type="file"
                    multiple
                    accept=".md,.markdown,.json"
                    onChange={handleFileUpload}
                    disabled={isImporting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    <Upload className="w-6 h-6 text-purple-400 mb-2 animate-bounce" />
                    <span className="font-bold text-xs">
                      {isImporting ? 'Importation en cours...' : 'Glissez vos fichiers .md ou .json ici'}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-0.5">
                      ou cliquez pour parcourir vos dossiers locaux.
                    </span>
                  </div>
                </div>

                {importSummary && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{importSummary}</span>
                  </div>
                )}
              </div>

              {/* Nouveautés & Version */}
              <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Syntropy OS v{CURRENT_VERSION}</h3>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Dernières améliorations, notes de version et rafraîchissement d'application.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-whats-new'));
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nouveautés</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('syntropy_last_seen_version');
                        window.location.reload();
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                    }`}
                    title="Recharger le cache"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recharger</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 5. APPLICATION DESKTOP (Electron)                       */}
          {/* ======================================================= */}
          {activeTab === 'desktop' && isDesktop && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <DesktopSettingsSection
                isDark={isDark}
                onNotification={showNotification}
                notes={notes}
                tasks={tasks}
                projects={projects}
                folders={folders}
              />
            </div>
          )}

          {/* ======================================================= */}
          {/* 6. CONSOLE ADMINISTRATEUR                               */}
          {/* ======================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {isAdmin ? (
                <AdminControlPanel isDark={isDark} onNotification={showNotification} />
              ) : (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-md mx-auto my-6 ${
                  isDark ? 'bg-zinc-900/80 border-rose-500/40 shadow-xl' : 'bg-white border-rose-300 shadow-md'
                }`}>
                  <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
                  <h2 className="text-base font-bold">Accès Restreint — Espace Administrateur</h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Cet écran est réservé aux comptes avec le rôle &apos;admin&apos; dans Cloud Firestore.
                  </p>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700 inline-block">
                    {user?.email || 'Non connecté'}
                  </span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modale Easter Egg : Secret Theme Lab */}
      <SecretThemeModal
        isOpen={isSecretThemeModalOpen}
        onClose={() => setIsSecretThemeModalOpen(false)}
        onNotification={showNotification}
      />
    </div>
  );
}
