'use client';

import React, { useState, useId } from 'react';
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
  Minimize2,
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
  Activity,
  Server,
  ShieldAlert,
  Compass,
  EyeOff,
  Ban,
  MapPin,
  CloudSun,
  Folder,
  Flame,
  Wallet,
  Brain,
  Search,
  Plus,
  UserCheck,
  Archive,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_PRIVILEGES, isSiteAdmin } from '@/lib/admin';
import AdminControlPanel from '@/components/AdminControlPanel';
import { CURRENT_VERSION } from '@/components/WhatsNewModal';
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
  Note,
  InkPaperColor,
} from '@/types';
import JSZip from 'jszip';

type SettingsTab = 'appearance' | 'editor' | 'para' | 'data' | 'profile' | 'admin';

const NEON_INTENSITY_OPTIONS: {
  id: NeonIntensity;
  name: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
}[] = [
  {
    id: 'subtle',
    name: 'Discret / Atténué',
    badge: 'Recommandé',
    desc: 'Lueur néon diminuée de 75%. Halos adoucis et reflets apaisants pour reposer les yeux lors de longues sessions.',
    icon: SunMedium,
    tagline: 'Effet néon adouci & reposant',
  },
  {
    id: 'none',
    name: 'Minimaliste / Éteint',
    badge: 'Zéro néon',
    desc: 'Supprime totalement les lueurs et halos colorés. Style épuré et sobre type Notion ou Linear sans reflets lumineux.',
    icon: ZapOff,
    tagline: 'Style épuré sans halos',
  },
  {
    id: 'vibrant',
    name: 'Vibrant / Élevé',
    badge: 'Original',
    desc: 'Lueur néon complète avec halos intenses, reflets saturés et ambiance cyberpunk d\'origine.',
    icon: Zap,
    tagline: 'Luminescence maximale',
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
  { id: 'purple', name: 'Violet Synaptique', shortName: 'Violet', hex: '#8b5cf6', colorHex: '#8b5cf6', desc: 'Ambiance néon cyberpunk classique Syntropy' },
  { id: 'aether', name: 'Aether (Uiverse)', shortName: 'Aether', hex: 'linear-gradient(135deg, #06b6d4 0%, #ec4899 50%, #f59e0b 100%)', colorHex: '#06b6d4', isGradient: true, desc: 'Design System Uiverse Aether : réfraction iridescente Cyan-Magenta-Ambre sur noir profond' },
  { id: 'mix', name: 'Harmonie Mix (Multichrome)', shortName: 'Mix', hex: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 33%, #10b981 66%, #e03148 100%)', colorHex: '#8b5cf6', isGradient: true, desc: 'Mélange cohérent et harmonieux des accents selon la fonction de chaque bouton' },
  { id: 'cyan', name: 'Bleu Cyan', shortName: 'Bleu', hex: '#06b6d4', colorHex: '#06b6d4', desc: 'Énergique et haute clarté visuelle' },
  { id: 'emerald', name: 'Vert Émeraude', shortName: 'Vert', hex: '#10b981', colorHex: '#10b981', desc: 'Concentration, sérénité & productivité' },
  { id: 'amber', name: 'Orange Ambre', shortName: 'Ambre', hex: '#f59e0b', colorHex: '#f59e0b', desc: 'Chaleureux, dynamique et stimulant' },
  { id: 'red', name: 'Rouge Rubis', shortName: 'Rouge', hex: '#e03148', colorHex: '#e03148', desc: 'Rouge velours noble et feutré, chaleureux et non agressif' },
  { id: 'monochrome', name: 'Monochrome Minimaliste', shortName: 'Monochrome', hex: '#71717a', colorHex: '#71717a', desc: 'Épuré, sobre et focalisé sur le contenu' },
];

const DARK_BG_OPTIONS: { id: DarkBgStyle; name: string; hex: string; desc: string; badge: string }[] = [
  {
    id: 'zinc',
    name: 'Zinc / Anthracite',
    hex: '#09090b',
    desc: 'Fond gris foncé feutré (#09090b), moderne et équilibré avec contrastes doux.',
    badge: 'Standard',
  },
  {
    id: 'oled',
    name: 'Noir Pur OLED',
    hex: '#000000',
    desc: 'Noir absolu (#000000). Éteint les pixels sur écrans OLED/AMOLED et maximise les contrastes.',
    badge: 'Éco-Énergie & Contraste Max',
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
    desc: 'Fond noir absolu (#09090b). Économise la batterie et offre un rendu néon saisissant.',
    bgHex: '#09090b',
    borderHex: '#27272a',
  },
  {
    id: 'white',
    label: 'Blanc Pur',
    badge: 'Classique',
    desc: 'Feuille blanche standard (#ffffff). Rendu traditionnel parfait pour exporter ou imprimer.',
    bgHex: '#ffffff',
    borderHex: '#e4e4e7',
  },
  {
    id: 'sepia',
    label: 'Jauni / Crème',
    badge: 'Confort Yeux',
    desc: 'Teinte carnet vintage (#fbf0d9). Anti-lumière bleue, particulièrement reposant pour de longues sessions.',
    bgHex: '#fbf0d9',
    borderHex: '#e7d6b8',
  },
  {
    id: 'slate',
    label: 'Ardoise Sombre',
    badge: 'Zinc / Slate',
    desc: 'Gris ardoise profond (#1e293b). Contraste doux et contemporain.',
    bgHex: '#1e293b',
    borderHex: '#334155',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const { settings, effectiveTheme, updateSetting, resetSettings } = useSettings();
  const { notes, tasks, projects, folders, isFirebaseConnected, addNote } = useData();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || (user?.email && isSiteAdmin(user.email)));

  // Synchroniser avec les query params de l'URL (?tab=profile, etc.) au chargement et navigation
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as SettingsTab | null;
    if (tabParam && ['appearance', 'editor', 'para', 'data', 'profile', 'admin'].includes(tabParam)) {
      setActiveTab(tabParam);
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
      showNotification("Erreur lors de l'exportation JSON.", 'info');
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
      showNotification("Erreur lors de la création de l'archive ZIP.", 'info');
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
                  isPinned: !!n.isPinned,
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

      setImportSummary(`${importedNotesCount} note(s) importée(s) avec succès dans votre espace !`);
      showNotification(`Importation terminée : ${importedNotesCount} note(s) ajoutée(s).`);
    } catch (err) {
      console.error(err);
      showNotification('Format de fichier non reconnu ou erreur de lecture.', 'info');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      {/* Toast de confirmation */}
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
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-6 border-b ${isDark ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuration & Préférences</span>
          </div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Paramètres
          </h1>
          <p className={`text-xs md:text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Personnalisez l'esthétique, l'éditeur de notes, la méthode PARA et gérez vos données.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Voulez-vous réinitialiser tous les paramètres aux valeurs d\'origine ?')) {
              resetSettings();
              showNotification('Paramètres réinitialisés aux valeurs par défaut.');
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer self-start md:self-auto ${
            isDark
              ? 'border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 shadow-sm'
          }`}
          title="Réinitialiser tous les réglages"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser par défaut</span>
        </button>
      </div>

      {/* Onglets de navigation horizontaux */}
      <div className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl border overflow-x-auto scrollbar-none transition-colors ${
        isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200 shadow-sm'
      }`}>
        {[
          { id: 'appearance' as SettingsTab, label: 'Apparence & UI', icon: Palette },
          { id: 'editor' as SettingsTab, label: 'Éditeur & Notes', icon: FileText },
          { id: 'para' as SettingsTab, label: 'Méthode PARA', icon: FolderGit2 },
          { id: 'data' as SettingsTab, label: 'Données & Sauvegardes', icon: Database },
          { id: 'profile' as SettingsTab, label: 'Profil & Salutations', icon: User },
          ...(isAdmin
            ? [{ id: 'admin' as SettingsTab, label: 'Paramètres Administrateur 👑', icon: Crown }]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isAdminTab = tab.id === 'admin';
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                isActive
                  ? isAdminTab
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-md shadow-amber-500/30'
                    : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : isAdminTab
                  ? isDark
                    ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 border border-amber-500/30'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50 border border-amber-300'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. APPARENCE & PERSONNALISATION (V2.6 Liquid Glass UI)    */}
      {/* ======================================================== */}
      {activeTab === 'appearance' && (() => {
        const transparency = typeof settings.surfaceTransparency === 'number' ? settings.surfaceTransparency : 35;
        const isReduced = Boolean(settings.reduceTransparency);
        const effectiveTrans = isReduced ? 0 : transparency;
        const blurPx = isReduced ? 0 : Math.round((effectiveTrans / 45) * 20);
        const alpha = isReduced ? 1 : Math.max(0.45, 1 - (effectiveTrans / 100));
        const cardAlpha = isReduced ? 1 : Math.max(0.55, 1 - (effectiveTrans * 0.75 / 100));
        const activeAccent = ACCENT_OPTIONS.find((c) => c.id === settings.accentColor || (c.id === 'red' && settings.accentColor === 'rose')) || ACCENT_OPTIONS[0];
        const activeAccentHex = activeAccent.colorHex;
        const previewIsDark = effectiveTheme === 'dark';

        const MAIN_ACCENTS = ACCENT_OPTIONS;

        return (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Grille principale en 2 colonnes (Référence Visuelle V2.6) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* =================================================== */}
              {/* COLONNE GAUCHE (Contrôles et réglages)              */}
              {/* =================================================== */}
              <div className="xl:col-span-5 space-y-5">
                {/* 1. Mode de thème */}
                <div className={`p-5 rounded-3xl border space-y-4 transition-colors ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div>
                    <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      <Sun className="w-4 h-4 text-purple-400" />
                      Mode de thème
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Choisissez l'apparence générale de l'application.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Carte Sombre */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('theme', 'dark');
                        showNotification('Thème Sombre activé');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        settings.theme === 'dark'
                          ? isDark
                            ? 'ring-2 border-purple-500 bg-purple-500/10'
                            : 'ring-2 border-purple-500 bg-purple-50'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      }`}
                      style={settings.theme === 'dark' ? { borderColor: activeAccentHex } : undefined}
                    >
                      <div className="w-full h-14 rounded-xl bg-zinc-950 border border-zinc-800 p-1.5 flex gap-1 overflow-hidden mb-2 relative">
                        <div className="w-1/3 h-full rounded-md bg-zinc-900 border border-zinc-800/80 p-0.5 flex flex-col gap-0.5">
                          <div className="w-3 h-1 rounded" style={{ backgroundColor: activeAccentHex }} />
                          <div className="w-full h-1 rounded bg-zinc-800" />
                          <div className="w-3/4 h-1 rounded bg-zinc-800" />
                        </div>
                        <div className="flex-1 h-full rounded-md bg-zinc-900/50 p-1 flex flex-col gap-1">
                          <div className="w-1/2 h-1 rounded bg-zinc-700" />
                          <div className="w-full h-1.5 rounded bg-zinc-800/80" />
                          <div className="w-4/5 h-1.5 rounded bg-zinc-800/80" />
                        </div>
                        {settings.theme === 'dark' && (
                          <div
                            className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: activeAccentHex }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Sombre</span>
                        <span className={`text-[10px] block mt-0.5 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Interface sombre par défaut.
                        </span>
                      </div>
                    </button>

                    {/* Carte Clair */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('theme', 'light');
                        showNotification('Thème Clair activé');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        settings.theme === 'light'
                          ? isDark
                            ? 'ring-2 border-purple-500 bg-purple-500/10'
                            : 'ring-2 border-purple-500 bg-purple-50'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      }`}
                      style={settings.theme === 'light' ? { borderColor: activeAccentHex } : undefined}
                    >
                      <div className="w-full h-14 rounded-xl bg-white border border-zinc-200 p-1.5 flex gap-1 overflow-hidden mb-2 relative">
                        <div className="w-1/3 h-full rounded-md bg-purple-50 border border-purple-100 p-0.5 flex flex-col gap-0.5">
                          <div className="w-3 h-1 rounded" style={{ backgroundColor: activeAccentHex }} />
                          <div className="w-full h-1 rounded bg-zinc-200" />
                          <div className="w-3/4 h-1 rounded bg-zinc-200" />
                        </div>
                        <div className="flex-1 h-full rounded-md bg-zinc-50 p-1 flex flex-col gap-1">
                          <div className="w-1/2 h-1 rounded bg-zinc-400" />
                          <div className="w-full h-1.5 rounded bg-zinc-200" />
                          <div className="w-4/5 h-1.5 rounded bg-zinc-200" />
                        </div>
                        {settings.theme === 'light' && (
                          <div
                            className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: activeAccentHex }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Clair</span>
                        <span className={`text-[10px] block mt-0.5 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Interface claire et épurée.
                        </span>
                      </div>
                    </button>

                    {/* Carte Automatique */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('theme', 'auto');
                        showNotification('Thème Automatique activé');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        settings.theme === 'auto'
                          ? isDark
                            ? 'ring-2 border-purple-500 bg-purple-500/10'
                            : 'ring-2 border-purple-500 bg-purple-50'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      }`}
                      style={settings.theme === 'auto' ? { borderColor: activeAccentHex } : undefined}
                    >
                      <div className="w-full h-14 rounded-xl border border-zinc-700/60 overflow-hidden mb-2 relative flex">
                        <div className="w-1/2 h-full bg-zinc-950 p-1 flex flex-col justify-between">
                          <Moon className="w-3 h-3 text-purple-400" />
                          <div className="space-y-0.5">
                            <div className="w-full h-0.5 bg-zinc-800 rounded" />
                            <div className="w-2/3 h-0.5 bg-zinc-800 rounded" />
                          </div>
                        </div>
                        <div className="w-1/2 h-full bg-white p-1 flex flex-col justify-between border-l border-zinc-700/40">
                          <Sun className="w-3 h-3 text-amber-500 ml-auto" />
                          <div className="space-y-0.5">
                            <div className="w-full h-0.5 bg-zinc-200 rounded" />
                            <div className="w-2/3 h-0.5 bg-zinc-200 rounded" />
                          </div>
                        </div>
                        {settings.theme === 'auto' && (
                          <div
                            className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: activeAccentHex }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Automatique</span>
                        <span className={`text-[10px] block mt-0.5 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Suit les paramètres de votre système.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Couleur d'accentuation */}
                <div className={`p-5 rounded-3xl border space-y-4 transition-colors ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div>
                    <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      <Palette className="w-4 h-4 text-purple-400" />
                      Couleur d'accentuation
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Personnalisez la couleur principale de Syntropy.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 pt-1">
                    {MAIN_ACCENTS.map((color) => {
                      const isSelected = settings.accentColor === color.id || (color.id === 'red' && settings.accentColor === 'rose');
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            updateSetting('accentColor', color.id);
                            showNotification(`Couleur d'accentuation réglée sur "${color.shortName}"`);
                          }}
                          className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none flex-1 min-w-[50px]"
                          title={color.name}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'ring-2 ring-offset-2 ring-offset-zinc-950 scale-105 shadow-md'
                                : 'hover:scale-105 opacity-85 hover:opacity-100'
                            }`}
                            style={{
                              background: color.hex,
                              boxShadow: isSelected
                                ? color.isGradient
                                  ? '0 0 14px rgba(6, 182, 212, 0.6)'
                                  : `0 0 12px ${color.colorHex}60`
                                : undefined,
                              ['--tw-ring-color' as any]: color.colorHex,
                            }}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                            )}
                          </div>
                          <span
                            className={`text-[11px] transition-colors ${
                              isSelected
                                ? isDark
                                  ? 'text-zinc-100 font-bold'
                                  : 'text-zinc-900 font-bold'
                                : isDark
                                ? 'text-zinc-400 group-hover:text-zinc-200'
                                : 'text-zinc-500 group-hover:text-zinc-800'
                            }`}
                          >
                            {color.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Transparence des surfaces (Liquid Glass - V2.6) */}
                <div className={`p-5 rounded-3xl border space-y-4 transition-colors ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div>
                    <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Transparence des surfaces
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Ajustez le niveau de transparence et de flou des éléments en verre.
                    </p>
                  </div>

                  {/* Slider & Badge */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min={0}
                          max={45}
                          step={1}
                          value={transparency}
                          onChange={(e) => updateSetting('surfaceTransparency', Number(e.target.value))}
                          aria-label="Transparence des surfaces"
                          aria-valuemin={0}
                          aria-valuemax={45}
                          aria-valuenow={transparency}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                          style={{
                            background: `linear-gradient(to right, ${activeAccentHex} 0%, ${activeAccentHex} ${(transparency / 45) * 100}%, ${isDark ? '#27272a' : '#e4e4e7'} ${(transparency / 45) * 100}%, ${isDark ? '#27272a' : '#e4e4e7'} 100%)`,
                          }}
                        />
                      </div>
                      <div className={`px-3 py-1 rounded-xl text-xs font-bold font-mono min-w-[54px] text-center ${
                        isDark ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80' : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                      }`}>
                        {transparency} %
                      </div>
                    </div>

                    {/* Repères sous le slider */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium px-0.5">
                      <span>Opaque</span>
                      <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
                        {isReduced ? 'Flou d\'arrière-plan · Désactivé' : `Flou d'arrière-plan · ${blurPx} px`}
                      </span>
                      <span>Verre</span>
                    </div>
                  </div>

                  {/* 3 Préréglages : Opaque, Équilibrée, Verre */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('surfaceTransparency', 0);
                        showNotification('Préréglage Opaque (0%) appliqué');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        transparency === 0
                          ? isDark
                            ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-1 ring-purple-500/30'
                            : 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`}
                      style={transparency === 0 ? { borderColor: activeAccentHex } : undefined}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Opaque</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('surfaceTransparency', 35);
                        showNotification('Préréglage Équilibrée (35%) appliqué');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        transparency === 35
                          ? isDark
                            ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-1 ring-purple-500/30'
                            : 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`}
                      style={transparency === 35 ? { borderColor: activeAccentHex } : undefined}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Équilibrée</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('surfaceTransparency', 45);
                        showNotification('Préréglage Verre (45%) appliqué');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        transparency === 45
                          ? isDark
                            ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-1 ring-purple-500/30'
                            : 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`}
                      style={transparency === 45 ? { borderColor: activeAccentHex } : undefined}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verre</span>
                    </button>
                  </div>

                  {/* Interrupteur « Réduire les effets de transparence » */}
                  <div className="pt-3 border-t border-inherit flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                        <EyeOff className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                          Réduire les effets de transparence
                        </span>
                        <span className={`text-[11px] block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Désactive les effets de flou et de transparence pour plus de lisibilité.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isReduced}
                      aria-label="Réduire les effets de transparence"
                      onClick={() => {
                        updateSetting('reduceTransparency', !isReduced);
                        showNotification(isReduced ? 'Effets de transparence réactivés' : 'Effets de transparence réduits');
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${
                        isReduced ? 'bg-purple-600' : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isReduced ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* =================================================== */}
              {/* COLONNE DROITE (Aperçu en direct & Référence UI)   */}
              {/* =================================================== */}
              <div className="xl:col-span-7 space-y-4">
                <div className={`p-5 rounded-3xl border space-y-4 transition-colors ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  {/* En-tête Aperçu */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        <Eye className="w-4 h-4 text-purple-400" />
                        Aperçu en direct
                      </h2>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Voyez les changements en temps réel sur votre environnement Syntropy.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${activeAccentHex}15`,
                          borderColor: `${activeAccentHex}35`,
                          color: activeAccentHex,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeAccentHex }} />
                        Accent {activeAccent.shortName.toLowerCase()} • Mode {previewIsDark ? 'sombre' : 'clair'}
                      </span>
                    </div>
                  </div>

                  {/* Toile d'ambiance avec fond fluide abstrait (Papier peint Aurora macOS / iOS) */}
                  <div className="relative rounded-2xl overflow-hidden p-3 sm:p-4 border border-zinc-800/80 shadow-2xl bg-zinc-950 select-none">
                    {/* Fond d'ondes fluides colorées */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-85 transition-opacity"
                      style={{
                        background: `
                          radial-gradient(circle at 15% 20%, rgba(139, 92, 246, 0.55), transparent 45%),
                          radial-gradient(circle at 85% 25%, rgba(59, 130, 246, 0.45), transparent 40%),
                          radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.4), transparent 50%),
                          radial-gradient(circle at 90% 85%, rgba(6, 182, 212, 0.35), transparent 45%),
                          #0b0c14
                        `,
                      }}
                    />

                    {/* Fenêtre miniature du Dashboard Syntropy */}
                    <div
                      className="relative z-10 rounded-2xl border flex overflow-hidden shadow-2xl"
                      style={{
                        borderColor: previewIsDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                        boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 25px -5px ${activeAccentHex}20`,
                      }}
                    >
                      {/* Mini Sidebar Translucide */}
                      <div
                        className="w-36 sm:w-40 flex-shrink-0 p-2.5 flex flex-col justify-between border-r transition-all duration-200"
                        style={{
                          backgroundColor: previewIsDark
                            ? `rgba(18, 18, 24, ${alpha})`
                            : `rgba(255, 255, 255, ${alpha})`,
                          backdropFilter: isReduced ? 'none' : `blur(${blurPx}px)`,
                          WebkitBackdropFilter: isReduced ? 'none' : `blur(${blurPx}px)`,
                          borderColor: previewIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                          color: previewIsDark ? '#e4e4e7' : '#27272a',
                        }}
                      >
                        <div className="space-y-2.5">
                          {/* Mini Logo */}
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center p-0.5 shadow-sm"
                              style={{ backgroundColor: `${activeAccentHex}25`, border: `1px solid ${activeAccentHex}50` }}
                            >
                              <Brain className="w-3 h-3" style={{ color: activeAccentHex }} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold block leading-tight tracking-tight">Syntropy</span>
                              <span className="text-[7px] text-zinc-500 block leading-none">Productivité & Savoir</span>
                            </div>
                          </div>

                          {/* Mini Recherche */}
                          <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] border"
                            style={{
                              backgroundColor: previewIsDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              borderColor: previewIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                              color: previewIsDark ? '#a1a1aa' : '#71717a',
                            }}
                          >
                            <Search className="w-2 h-2" />
                            <span className="truncate flex-1">Recherche rapide ...</span>
                            <span className="text-[7px] opacity-70">⌘K</span>
                          </div>

                          {/* Section ESPACE DE TRAVAIL */}
                          <div className="space-y-0.5">
                            <span className="text-[7px] font-semibold tracking-wider text-zinc-500 uppercase block">
                              Espace de travail
                            </span>
                            <div
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-semibold text-white shadow-sm"
                              style={{ backgroundColor: activeAccentHex }}
                            >
                              <LayoutDashboard className="w-2 h-2" />
                              <span className="truncate">Tableau de bord</span>
                            </div>
                            <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <CheckSquare className="w-2 h-2" />
                                <span className="truncate">Projets & Tâches</span>
                              </span>
                              <span className="text-[7px] px-1 rounded-full bg-zinc-800 text-zinc-400">7</span>
                            </div>
                            <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <FileText className="w-2 h-2" />
                                <span className="truncate">Notes</span>
                              </span>
                              <span className="text-[7px] px-1 rounded-full bg-zinc-800 text-zinc-400">16</span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <Calendar className="w-2 h-2" />
                              <span className="truncate">Calendrier</span>
                            </div>
                          </div>

                          {/* Section DAILY LIFE */}
                          <div className="space-y-0.5">
                            <span className="text-[7px] font-semibold tracking-wider text-zinc-500 uppercase block">
                              Daily Life
                            </span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <Flame className="w-2 h-2" />
                              <span className="truncate">Habitude</span>
                            </div>
                            <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Wallet className="w-2 h-2" />
                                <span className="truncate">Budget</span>
                              </span>
                              <span className="text-[7px] text-zinc-500">0%</span>
                            </div>
                          </div>

                          {/* Section MÉTHODE PARA */}
                          <div className="space-y-0.5">
                            <span className="text-[7px] font-semibold tracking-wider text-zinc-500 uppercase block">
                              Méthode PARA
                            </span>
                            <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <span className="flex items-center gap-1"><Folder className="w-2 h-2" />Projets</span>
                              <span className="text-[7px]">3</span>
                            </div>
                            <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <span className="flex items-center gap-1"><Layers className="w-2 h-2" />Domaines</span>
                              <span className="text-[7px]">0</span>
                            </div>
                            <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <span className="flex items-center gap-1"><Compass className="w-2 h-2" />Ressources</span>
                              <span className="text-[7px]">0</span>
                            </div>
                            <div className="flex items-center justify-between px-1.5 py-0.5 text-[8px] text-zinc-400">
                              <span className="flex items-center gap-1"><Archive className="w-2 h-2" />Archives</span>
                              <span className="text-[7px]">0</span>
                            </div>
                          </div>
                        </div>

                        {/* Mini Profil Utilisateur */}
                        <div
                          className="pt-1.5 border-t mt-2 flex items-center gap-1.5"
                          style={{ borderColor: previewIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                        >
                          <div
                            className="w-4 h-4 rounded-full text-[7px] font-bold flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: activeAccentHex }}
                          >
                            N
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-bold truncate">Nathan</span>
                              <span className="text-[6px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                                Admin
                              </span>
                            </div>
                            <span className="text-[6px] text-zinc-500 truncate block">ndebeaupuis@gmail.com</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Contenu Principal */}
                      <div
                        className="flex-1 p-2.5 space-y-2.5 min-w-0 transition-colors"
                        style={{
                          backgroundColor: previewIsDark ? 'rgba(10, 10, 14, 0.75)' : 'rgba(244, 244, 246, 0.85)',
                        }}
                      >
                        {/* Mini En-tête Salutations */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: `${activeAccentHex}20`, border: `1px solid ${activeAccentHex}40` }}
                            >
                              <Brain className="w-3.5 h-3.5" style={{ color: activeAccentHex }} />
                            </div>
                            <div>
                              <h3 className="text-[11px] font-bold leading-tight flex items-center gap-1">
                                <span className={previewIsDark ? 'text-zinc-100' : 'text-zinc-900'}>Bon matin,</span>
                                <span style={{ color: activeAccentHex }}>Nathan</span>
                              </h3>
                              <span className="text-[8px] text-zinc-500 block leading-none">Vendredi 16 Octobre 2026</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <div
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] border"
                              style={{
                                backgroundColor: previewIsDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                                borderColor: previewIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                color: previewIsDark ? '#a1a1aa' : '#71717a',
                              }}
                            >
                              <Search className="w-2 h-2" />
                              <span className="truncate">Recherche ...</span>
                              <span className="text-[7px] opacity-60">⌘K</span>
                            </div>
                            <button
                              type="button"
                              className="w-4 h-4 rounded-md text-white flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: activeAccentHex }}
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* 4 Mini Widgets en grille 2x2 */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Widget 1: Calendriers */}
                          <div
                            className="p-2 rounded-xl border space-y-1.5 transition-all"
                            style={{
                              backgroundColor: previewIsDark ? `rgba(24, 24, 28, ${cardAlpha})` : `rgba(255, 255, 255, ${cardAlpha})`,
                              backdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              WebkitBackdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              borderColor: previewIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            }}
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className={`font-bold flex items-center gap-1 ${previewIsDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                <Calendar className="w-2 h-2 text-purple-400" />
                                <span>Calendriers</span>
                              </span>
                              <span className="text-[7px] text-zinc-500">Voir &gt;</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-[7px]">
                              <span className="px-1 py-0.2 rounded text-white font-semibold" style={{ backgroundColor: activeAccentHex }}>Tous</span>
                              <span className="px-1 py-0.2 rounded text-zinc-400 bg-zinc-800/50">Perso</span>
                              <span className="px-1 py-0.2 rounded text-zinc-400 bg-zinc-800/50">Travail</span>
                              <span className="px-1 py-0.2 rounded text-zinc-400 bg-zinc-800/50">Google</span>
                            </div>
                            <div className="flex items-start gap-1.5 pt-0.5 text-[8px]">
                              <span className="font-bold text-[7px] text-zinc-500 uppercase leading-none">
                                VEN.<br/><strong className={`text-[10px] ${previewIsDark ? 'text-zinc-200' : 'text-zinc-800'}`}>16</strong>
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-zinc-400 block truncate text-[7px]">Aucun événement aujourd'hui</span>
                                <span className="text-[7px] font-semibold block mt-0.5" style={{ color: activeAccentHex }}>+ En programmer un</span>
                              </div>
                            </div>
                          </div>

                          {/* Widget 2: Météo */}
                          <div
                            className="p-2 rounded-xl border space-y-1.5 transition-all"
                            style={{
                              backgroundColor: previewIsDark ? `rgba(24, 24, 28, ${cardAlpha})` : `rgba(255, 255, 255, ${cardAlpha})`,
                              backdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              WebkitBackdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              borderColor: previewIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            }}
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className={`font-bold flex items-center gap-1 ${previewIsDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                <CloudSun className="w-2 h-2 text-amber-400" />
                                <span>Météo</span>
                              </span>
                              <span className="text-[7px] flex items-center gap-0.5" style={{ color: activeAccentHex }}>
                                <MapPin className="w-1.5 h-1.5" />Paris
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <SunMedium className="w-5 h-5 text-amber-400 flex-shrink-0" />
                              <div>
                                <span className={`text-sm font-black leading-none block ${previewIsDark ? 'text-zinc-100' : 'text-zinc-900'}`}>18°</span>
                                <span className="text-[7px] text-zinc-400 block leading-tight">Nuages épars</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[7px] text-zinc-500 pt-0.5">
                              <span>Paris, France</span>
                              <span>↑ 21° ↓ 13°</span>
                            </div>
                          </div>

                          {/* Widget 3: To-do list */}
                          <div
                            className="p-2 rounded-xl border space-y-1 transition-all"
                            style={{
                              backgroundColor: previewIsDark ? `rgba(24, 24, 28, ${cardAlpha})` : `rgba(255, 255, 255, ${cardAlpha})`,
                              backdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              WebkitBackdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              borderColor: previewIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            }}
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className={`font-bold flex items-center gap-1 ${previewIsDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                <CheckSquare className="w-2 h-2 text-purple-400" />
                                <span>To-do list (7 à faire)</span>
                              </span>
                              <span className="text-[7px] text-zinc-500">Voir tout &gt;</span>
                            </div>
                            <div className="space-y-0.5 text-[8px]">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`truncate flex items-center gap-1 ${previewIsDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                  <span className="w-1.5 h-1.5 rounded-full border border-zinc-500 inline-block" />
                                  <span>Design MCU</span>
                                </span>
                                <span className="text-[6px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300">Haute</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className={`truncate flex items-center gap-1 ${previewIsDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                  <span className="w-1.5 h-1.5 rounded-full border border-zinc-500 inline-block" />
                                  <span>Rapport Robotique</span>
                                </span>
                                <span className="text-[6px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300">Haute</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className={`truncate flex items-center gap-1 ${previewIsDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                  <span className="w-1.5 h-1.5 rounded-full border border-zinc-500 inline-block" />
                                  <span>fonction #4</span>
                                </span>
                                <span className="text-[6px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">Moyenne</span>
                              </div>
                            </div>
                            <div className="pt-0.5 text-[7px] text-zinc-500">+ Nouvelle tâche</div>
                          </div>

                          {/* Widget 4: Projets & tâches */}
                          <div
                            className="p-2 rounded-xl border space-y-1.5 transition-all"
                            style={{
                              backgroundColor: previewIsDark ? `rgba(24, 24, 28, ${cardAlpha})` : `rgba(255, 255, 255, ${cardAlpha})`,
                              backdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              WebkitBackdropFilter: isReduced ? 'none' : `blur(${Math.round(blurPx * 0.75)}px)`,
                              borderColor: previewIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            }}
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className={`font-bold flex items-center gap-1 ${previewIsDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                <Folder className="w-2 h-2 text-purple-400" />
                                <span>Projets & tâches (3)</span>
                              </span>
                              <span className="text-[7px] text-zinc-500">Voir tous &gt;</span>
                            </div>
                            <div className="space-y-1 text-[8px]">
                              <div>
                                <div className="flex items-center justify-between text-[7px]">
                                  <span className={`font-semibold flex items-center gap-1 ${previewIsDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                    <Folder className="w-2 h-2" style={{ color: activeAccentHex }} />Syntropy
                                  </span>
                                  <span className="text-zinc-400">4/9 tâches • 44%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-800/80 rounded-full mt-0.5 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: '44%', backgroundColor: activeAccentHex }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between text-[7px]">
                                  <span className={`font-semibold flex items-center gap-1 ${previewIsDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                    <Folder className="w-2 h-2 text-emerald-400" />Robotique Salford
                                  </span>
                                  <span className="text-zinc-400">0/1 tâches • 0%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-800/80 rounded-full mt-0.5 overflow-hidden">
                                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '0%' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sélecteur de Thème Miniature en bas de l'aperçu */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Carte Sombre */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('theme', 'dark');
                        showNotification('Thème Sombre activé');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        effectiveTheme === 'dark'
                          ? 'ring-2'
                          : isDark
                          ? 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                      }`}
                      style={
                        effectiveTheme === 'dark'
                          ? {
                              borderColor: activeAccentHex,
                              boxShadow: `0 0 16px ${activeAccentHex}25`,
                              ['--tw-ring-color' as any]: activeAccentHex,
                            }
                          : undefined
                      }
                    >
                      <div className="w-full h-12 rounded-xl bg-zinc-950 border border-zinc-800 p-1.5 flex gap-1 overflow-hidden mb-2 relative">
                        <div className="w-1/4 h-full rounded bg-zinc-900 border border-zinc-800/60 p-0.5 flex flex-col gap-0.5">
                          <div className="w-full h-1 rounded" style={{ backgroundColor: activeAccentHex }} />
                          <div className="w-3/4 h-0.5 rounded bg-zinc-800" />
                        </div>
                        <div className="flex-1 h-full rounded bg-zinc-900/50 p-1 grid grid-cols-2 gap-0.5">
                          <div className="rounded bg-zinc-850 border border-zinc-800/50" />
                          <div className="rounded bg-zinc-850 border border-zinc-800/50" />
                          <div className="rounded bg-zinc-850 border border-zinc-800/50" />
                          <div className="rounded bg-zinc-850 border border-zinc-800/50" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
                        <Moon className="w-3.5 h-3.5" style={{ color: activeAccentHex }} />
                        <span>Sombre</span>
                      </div>
                    </button>

                    {/* Carte Clair */}
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('theme', 'light');
                        showNotification('Thème Clair activé');
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        effectiveTheme === 'light'
                          ? 'ring-2'
                          : isDark
                          ? 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
                      }`}
                      style={
                        effectiveTheme === 'light'
                          ? {
                              borderColor: activeAccentHex,
                              boxShadow: `0 0 16px ${activeAccentHex}25`,
                              ['--tw-ring-color' as any]: activeAccentHex,
                            }
                          : undefined
                      }
                    >
                      <div className="w-full h-12 rounded-xl bg-zinc-100 border border-zinc-300 p-1.5 flex gap-1 overflow-hidden mb-2 relative">
                        <div className="w-1/4 h-full rounded bg-white border border-zinc-200 p-0.5 flex flex-col gap-0.5">
                          <div className="w-full h-1 rounded" style={{ backgroundColor: activeAccentHex }} />
                          <div className="w-3/4 h-0.5 rounded bg-zinc-200" />
                        </div>
                        <div className="flex-1 h-full rounded bg-white/70 p-1 grid grid-cols-2 gap-0.5">
                          <div className="rounded bg-zinc-50 border border-zinc-200/80" />
                          <div className="rounded bg-zinc-50 border border-zinc-200/80" />
                          <div className="rounded bg-zinc-50 border border-zinc-200/80" />
                          <div className="rounded bg-zinc-50 border border-zinc-200/80" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Clair</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* OPTIONS COMPLÉMENTAIRES D'AFFICHAGE & TYPOGRAPHIE        */}
            {/* ======================================================== */}
            <div className="pt-2 border-t border-inherit space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Réglages complémentaires d'affichage
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Intensité néon, style de noir OLED, police de caractères et espacement.
                  </p>
                </div>
              </div>

              {/* Intensité du néon & Style de fond OLED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Intensité néon */}
                <div className={`p-5 rounded-3xl border space-y-3 transition-colors ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Intensité de l'effet néon
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {NEON_INTENSITY_OPTIONS.find((n) => n.id === (settings.neonIntensity || 'vibrant'))?.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {NEON_INTENSITY_OPTIONS.map((opt) => {
                      const isSelected = (settings.neonIntensity || 'vibrant') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateSetting('neonIntensity', opt.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                              : isDark
                              ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          <span className="text-xs block">{opt.name.split('/')[0]}</span>
                          <span className="text-[9px] text-zinc-500 block mt-0.5">{opt.tagline}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Style de fond sombre OLED vs Zinc */}
                <div className={`p-5 rounded-3xl border space-y-3 transition-colors ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      <Moon className="w-3.5 h-3.5 text-purple-400" />
                      Nuance du thème sombre
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {(settings.darkBgStyle || 'zinc') === 'oled' ? 'Noir Pur (#000000)' : 'Zinc (#09090b)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DARK_BG_OPTIONS.map((opt) => {
                      const isSelected = (settings.darkBgStyle || 'zinc') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateSetting('darkBgStyle', opt.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                              : isDark
                              ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full border border-zinc-700"
                              style={{ backgroundColor: opt.hex }}
                            />
                            <span className="text-xs font-semibold">{opt.name}</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 block mt-1">{opt.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Typographie & Densité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Typographie */}
                <div className={`p-5 rounded-3xl border space-y-3 transition-colors ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    <Type className="w-3.5 h-3.5 text-cyan-400" />
                    Typographie de l'interface
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'sans' as TypographyStyle, label: 'Sans-Serif Moderne (Inter / System)' },
                      { id: 'serif' as TypographyStyle, label: 'Serif Littéraire (Georgia / Lora)' },
                      { id: 'mono' as TypographyStyle, label: 'Monospace Technique (JetBrains Mono)' },
                    ].map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => updateSetting('typography', font.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          settings.typography === font.id
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                            : isDark
                            ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="text-xs">{font.label}</span>
                        {settings.typography === font.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Densité */}
                <div className={`p-5 rounded-3xl border space-y-3 transition-colors ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800/70' : 'bg-white border-zinc-200 shadow-sm'
                }`}>
                  <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    Densité d'affichage
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'comfortable' as DisplayDensity, label: 'Mode Aéré (Standard)', desc: 'Espacements généreux et confort de lecture' },
                      { id: 'compact' as DisplayDensity, label: 'Mode Compact', desc: 'Plus de contenu visible par écran' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => updateSetting('density', d.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          settings.density === d.id
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold'
                            : isDark
                            ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-semibold block">{d.label}</span>
                          <span className="text-[10px] text-zinc-500 block">{d.desc}</span>
                        </div>
                        {settings.density === d.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 2. ÉDITEUR DE NOTES & MARKDOWN                          */}
      {/* ======================================================== */}
      {activeTab === 'editor' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Mode d'ouverture par défaut */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Mode d'ouverture par défaut d'une note
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Choisissez comment une note s'affiche lorsque vous cliquez dessus dans la liste.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'write' as DefaultEditorMode, label: 'Mode Édition', icon: Edit3, desc: 'Plein écran pour rédiger immédiatement' },
                { id: 'split' as DefaultEditorMode, label: 'Côte-à-Côte (Split)', icon: Columns2, desc: 'Markdown à gauche, rendu à droite' },
                { id: 'preview' as DefaultEditorMode, label: 'Mode Lecture', icon: Eye, desc: 'Mise en page épurée prête à lire' },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = settings.defaultEditorMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      updateSetting('defaultEditorMode', m.id);
                      showNotification(`Mode d'ouverture défini sur "${m.label}"`);
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${
                        isSelected ? 'bg-purple-600 text-white' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div>
                      <span className={`font-semibold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{m.label}</span>
                      <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Couleur par défaut de la feuille manuscrite (Syntropy Stylus) */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <PenTool className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Couleur de la feuille manuscrite par défaut (Stylet)
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Choisissez la couleur de fond de la feuille utilisée pour vos prises de notes manuscrites et schémas.
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
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-lg border shadow-xs"
                          style={{ backgroundColor: item.bgHex, borderColor: item.borderHex }}
                        />
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          item.id === 'sepia'
                            ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                            : isDark
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            : 'bg-zinc-200 text-zinc-700 border border-zinc-300'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div>
                      <span className={`font-semibold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {item.label}
                      </span>
                      <span className={`text-[11px] block mt-0.5 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Délai de sauvegarde automatique */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <Clock className="w-4 h-4 text-cyan-500" />
                Délai de sauvegarde automatique
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Fréquence d'enregistrement de vos modifications vers Firebase Cloud Firestore et la mémoire locale.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 500 as AutoSaveDelay, label: 'Instantané (0.5 sec)', desc: 'Sauvegarde immédiate à chaque frappe' },
                { id: 2000 as AutoSaveDelay, label: 'Équilibré (2 sec)', desc: 'Idéal pour économiser la bande passante' },
                { id: 5000 as AutoSaveDelay, label: 'Détendu (5 sec)', desc: 'Regroupe les longues sessions d\'écriture' },
              ].map((delay) => {
                const isSelected = settings.autoSaveDelay === delay.id;
                return (
                  <button
                    key={delay.id}
                    onClick={() => {
                      updateSetting('autoSaveDelay', delay.id);
                      showNotification(`Délai de sauvegarde réglé sur ${delay.label}`);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{delay.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{delay.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles : Métriques et Liens Bidirectionnels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Compteur de mots */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
              isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <span className={`font-semibold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Compteur de mots & temps de lecture
                </span>
                <span className={`text-xs block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Affiche les métriques sous l'éditeur de notes
                </span>
              </div>
              <button
                onClick={() => updateSetting('showWordCount', !settings.showWordCount)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  settings.showWordCount ? 'bg-purple-600 justify-end' : isDark ? 'bg-zinc-800 justify-start' : 'bg-zinc-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Liens bidirectionnels */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
              isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <span className={`font-semibold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Liens bidirectionnels & Backlinks
                </span>
                <span className={`text-xs block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Connecte automatiquement les notes mentionnées entre elles
                </span>
              </div>
              <button
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

      {/* ======================================================== */}
      {/* 3. ORGANISATION & MÉTHODE PARA                           */}
      {/* ======================================================== */}
      {activeTab === 'para' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Vue au démarrage */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Page de démarrage par défaut
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Choisissez l'écran affiché automatiquement à l'ouverture de Syntropy OS.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: '/' as StartupView, label: 'Tableau de bord', desc: 'Synthèse globale & objectifs' },
                { id: '/tasks' as StartupView, label: 'Kanban des Projets', desc: 'Vue orientée exécution & tâches' },
                { id: '/notes' as StartupView, label: 'Notes & Savoirs', desc: 'Accès direct à la base de connaissances' },
                { id: '/calendar' as StartupView, label: 'Calendrier des Échéances', desc: 'Planning temporel des livraisons' },
              ].map((v) => {
                const isSelected = settings.startupView === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      updateSetting('startupView', v.id);
                      showNotification(`Page de démarrage définie sur "${v.label}"`);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{v.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{v.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Premier jour de la semaine & Priorité par défaut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Premier jour */}
            <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
              isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <Calendar className="w-4 h-4 text-cyan-500" />
                  Premier jour de la semaine
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Utilisé pour les calendriers et échéanciers
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'monday' as FirstDayOfWeek, label: 'Lundi', desc: 'Norme européenne ISO' },
                  { id: 'sunday' as FirstDayOfWeek, label: 'Dimanche', desc: 'Norme nord-américaine' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      updateSetting('firstDayOfWeek', d.id);
                      showNotification(`Semaine débutant le ${d.label}`);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.firstDayOfWeek === d.id
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300'
                          : 'bg-purple-50 border-purple-500 text-purple-700 font-semibold'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{d.label}</span>
                      {settings.firstDayOfWeek === d.id && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priorité par défaut des tâches */}
            <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
              isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  Priorité par défaut des tâches
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Attribuée automatiquement lors de la création
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low' as TaskPriority, label: 'Basse', color: isDark ? 'text-zinc-400' : 'text-zinc-600' },
                  { id: 'medium' as TaskPriority, label: 'Moyenne', color: 'text-amber-500' },
                  { id: 'high' as TaskPriority, label: 'Haute', color: 'text-rose-500' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      updateSetting('defaultTaskPriority', p.id);
                      showNotification(`Priorité par défaut : ${p.label}`);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      settings.defaultTaskPriority === p.id
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-500 ring-1 ring-purple-500/30 font-semibold'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <span className={`text-xs font-bold ${p.color}`}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Masquer les catégories vides */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <span className={`font-semibold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Masquer les catégories PARA vides
              </span>
              <span className={`text-xs block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Masque dans la barre latérale les sections (Projets, Domaines, Ressources, Archives) ayant 0 élément
              </span>
            </div>
            <button
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

      {/* ======================================================== */}
      {/* 4. GESTION DES DONNÉES & CONFIDENTIALITÉ                */}
      {/* ======================================================== */}
      {activeTab === 'data' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Statut de Synchronisation Cloud */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    État & Persistance Firebase Cloud Firestore
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    second-brain-os
                  </span>
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Vos notes, tâches, projets et dossiers sont sauvegardés en temps réel sur Google Cloud Firestore avec bascule automatique en stockage local de secours.
                </p>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border w-fit ${
                  isFirebaseConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <span>{isFirebaseConnected ? 'Cloud Firestore : Connecté' : 'Mode Local Dégradé (Hors-Ligne)'}</span>
              </div>
            </div>

            {/* Détails d'infrastructure backend */}
            <div className={`p-3.5 rounded-2xl border text-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${
              isDark ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Backend : <strong>Firebase Firestore v12</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Sync : <strong>Écouteurs temps réel</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Fallback : <strong>Mémoire locale persistante</strong></span>
              </div>
            </div>

            {/* Statistiques stockées */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { count: notes.length, label: 'Notes & Savoirs', color: 'text-purple-600 dark:text-purple-400' },
                { count: tasks.length, label: 'Tâches totales', color: 'text-indigo-600 dark:text-indigo-400' },
                { count: projects.length, label: 'Projets PARA', color: 'text-cyan-600 dark:text-cyan-400' },
                { count: folders.length, label: 'Dossiers créés', color: 'text-emerald-600 dark:text-emerald-400' },
              ].map((s, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border text-center transition-colors ${
                  isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <span className={`text-lg font-bold font-mono ${s.color}`}>{s.count}</span>
                  <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exportation complète */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Exportation & Sauvegarde souveraine
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Gardez le contrôle total : téléchargez vos données dans des formats standards et pérennes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Markdown (.zip) */}
              <button
                onClick={handleExportMarkdownZip}
                disabled={isExporting}
                className={`p-5 rounded-2xl border transition-all text-left flex items-start gap-4 cursor-pointer group ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-purple-500/50'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white hover:border-purple-400 shadow-sm'
                }`}
              >
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className={`font-bold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Exporter toutes les Notes (.zip Markdown)
                  </span>
                  <span className={`text-xs block mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Génère une archive ZIP avec chaque note au format .md pur, structurée par dossiers. Compatible Obsidian & Logseq.
                  </span>
                </div>
              </button>

              {/* Export JSON */}
              <button
                onClick={handleExportJson}
                disabled={isExporting}
                className={`p-5 rounded-2xl border transition-all text-left flex items-start gap-4 cursor-pointer group ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-indigo-500/50'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white hover:border-indigo-400 shadow-sm'
                }`}
              >
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <span className={`font-bold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Sauvegarde Intégrale (.json)
                  </span>
                  <span className={`text-xs block mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Télécharge l'intégralité de vos notes, tâches, projets, dossiers et préférences dans un seul fichier JSON universel.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Importation Notion / Obsidian */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <Upload className="w-4 h-4 text-cyan-500" />
                Importation de notes (Obsidian & Notion)
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Importez des fichiers Markdown (.md) ou une sauvegarde JSON complète directement dans Syntropy OS.
              </p>
            </div>

            <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              isDark
                ? 'border-zinc-800 hover:border-purple-500/60 bg-zinc-950/30'
                : 'border-zinc-300 hover:border-purple-500/60 bg-zinc-50/70 hover:bg-white'
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
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 mb-3">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <span className={`font-bold text-sm ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  {isImporting ? 'Importation en cours...' : 'Glissez vos fichiers .md ou .json ici'}
                </span>
                <span className={`text-xs mt-1 max-w-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  ou cliquez pour sélectionner un ou plusieurs fichiers depuis votre explorateur.
                </span>
              </div>
            </div>

            {importSummary && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{importSummary}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PROFIL & AMBIANCE                                     */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Nom de salutation personnalisée */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Nom de salutation personnalisée
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Modifiez le prénom affiché sur l'en-tête du tableau de bord (ex: "Bon après-midi, Nathan").
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={settings.greetingName}
                onChange={(e) => updateSetting('greetingName', e.target.value)}
                placeholder={user?.displayName || 'Nathan'}
                className={`w-full sm:max-w-md px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
                    : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 shadow-sm'
                }`}
              />
              <button
                onClick={() => showNotification(`Salutation enregistrée : "${settings.greetingName || user?.displayName || 'Nathan'}"`)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 cursor-pointer transition-colors shadow-md shadow-purple-600/30 self-stretch sm:self-auto justify-center"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>

          {/* Informations Compte & Sécurité */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className={`w-12 h-12 rounded-2xl object-cover ${
                    user?.isAdmin ? 'ring-2 ring-amber-500/80 shadow-md shadow-amber-500/20' : 'ring-2 ring-purple-500/30'
                  }`}
                />
              ) : (
                <div className={`w-12 h-12 rounded-2xl text-white font-bold flex items-center justify-center text-lg shadow-lg ${
                  user?.isAdmin
                    ? 'bg-gradient-to-tr from-amber-500 to-purple-600 ring-2 ring-amber-400/50 shadow-amber-500/20'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-900/30'
                }`}>
                  {user?.isAdmin ? '👑' : (user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-base block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    {user?.displayName || 'Utilisateur Syntropy'}
                  </span>
                  {user?.isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40">
                      👑 Super-Administrateur
                    </span>
                  )}
                </div>
                <span className={`text-xs block font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {user?.email || 'Non renseigné'}
                </span>
              </div>
            </div>

            <div className={`pt-3 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'
            }`}>
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {user?.isAdmin ? 'Session Administrateur Validée' : 'Session sécurisée par Firebase Auth'}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">ID: {user?.uid.slice(0, 10)}...</span>
            </div>
          </div>

          {/* Espace Super-Administrateur (Réservé aux comptes administrateurs) */}
          {user?.isAdmin && (
            <div className={`p-6 rounded-3xl border space-y-4 transition-all relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-amber-950/20 via-zinc-900/60 to-purple-950/20 border-amber-500/40 shadow-xl shadow-amber-500/5'
                : 'bg-gradient-to-br from-amber-50/70 via-white to-purple-50/70 border-amber-300 shadow-md'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-300 shadow-md">
                    <Crown className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        Espace Super-Administrateur
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                        Accès Maître
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Vous disposez des droits administrateurs complets (Gestion des rôles, maintenance BDD, drapeaux système et journal d'audit).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
                >
                  <Crown className="w-4 h-4" />
                  <span>Ouvrir la Console Admin 👑</span>
                </button>
              </div>
            </div>
          )}

          {/* Version du Système & Nouveautés */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Syntropy OS Version {CURRENT_VERSION}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    Dernière version
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Consultez les fonctionnalités déployées ou forcez le rafraîchissement des fichiers du navigateur.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-whats-new'));
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Voir les nouveautés</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('syntropy_last_seen_version');
                      window.location.reload();
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                  }`}
                  title="Vider le cache local et recharger"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recharger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CONTRÔLES ADMINISTRATEUR SYSTÈME                      */}
      {/* ======================================================== */}
      {activeTab === 'admin' && (
        isAdmin ? (
          <AdminControlPanel isDark={isDark} onNotification={showNotification} />
        ) : (
          <div className={`p-10 rounded-3xl border text-center space-y-4 max-w-lg mx-auto my-8 ${
            isDark ? 'bg-zinc-900/80 border-rose-500/40 shadow-xl shadow-rose-950/20' : 'bg-white border-rose-300 shadow-md'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Accès Restreint — Espace Administrateur
            </h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed`}>
              L'onglet des Paramètres Administrateur et le téléchargement de l'exécutable natif Windows sont réservés aux comptes administrateurs certifiés (rôle &apos;admin&apos; dans Firestore / Custom Claims).
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700 inline-block">
                Compte actuel : {user?.email || 'Non connecté'}
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
