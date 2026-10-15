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

const ACCENT_OPTIONS: { id: AccentColor; name: string; hex: string; desc: string }[] = [
  { id: 'purple', name: 'Violet Synaptique', hex: '#8b5cf6', desc: 'Ambiance néon cyberpunk classique Syntropy' },
  { id: 'aether', name: 'Aether Céleste', hex: '#a855f7', desc: 'Dégradé cyan céleste vers violet néon iridescent (Aether UI)' },
  { id: 'cyan', name: 'Cyan Électrique', hex: '#06b6d4', desc: 'Énergique et haute clarté visuelle' },
  { id: 'emerald', name: 'Vert Émeraude', hex: '#10b981', desc: 'Concentration, sérénité & productivité' },
  { id: 'amber', name: 'Orange Ambre', hex: '#f59e0b', desc: 'Chaleureux, dynamique et stimulant' },
  { id: 'rose', name: 'Rose Magenta', hex: '#f43f5e', desc: 'Vibrant, audacieux et créatif' },
  { id: 'monochrome', name: 'Blanc Minimaliste', hex: '#e4e4e7', desc: 'Épuré, sobre et focalisé sur le contenu' },
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
              onClick={() => setActiveTab(tab.id)}
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
      {/* 1. APPARENCE & PERSONNALISATION                          */}
      {/* ======================================================== */}
      {activeTab === 'appearance' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* A. Mode de Thème */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <Sun className="w-4 h-4 text-amber-500" />
                Mode de thème
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Définissez l'ambiance lumineuse générale ou synchronisez-la sur votre système d'exploitation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'dark' as ThemeSetting, label: 'Sombre', icon: Moon, desc: 'Contraste reposant pour les yeux' },
                { id: 'light' as ThemeSetting, label: 'Clair', icon: Sun, desc: 'Haute clarté en environnement lumineux' },
                { id: 'auto' as ThemeSetting, label: 'Automatique', icon: Laptop, desc: 'Suit les réglages de votre appareil' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = settings.theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      updateSetting('theme', item.id);
                      showNotification(`Thème réglé sur "${item.label}"`);
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div className="mt-4">
                      <span className={`font-semibold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {item.label}
                      </span>
                      <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Couleur d'accentuation */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Couleur d'accentuation (Palette Néon)
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Personnalise les boutons actifs, pastilles de statut, bordures néon et barres de progression.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ACCENT_OPTIONS.map((color) => {
                const isSelected = settings.accentColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => {
                      updateSetting('accentColor', color.id);
                      showNotification(`Palette d'accentuation réglée sur "${color.name}"`);
                    }}
                    style={
                      isSelected
                        ? {
                            borderColor: color.hex,
                            boxShadow:
                              (settings.neonIntensity || 'vibrant') === 'none'
                                ? 'none'
                                : (settings.neonIntensity || 'vibrant') === 'subtle'
                                ? `0 0 8px ${color.hex}25`
                                : `0 0 20px ${color.hex}35`,
                            backgroundColor: isDark ? `${color.hex}15` : `${color.hex}10`,
                          }
                        : undefined
                    }
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'ring-2'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/60'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex-shrink-0 shadow-md ring-2 ring-white/20 mt-0.5 relative flex items-center justify-center overflow-hidden"
                      style={{
                        background: color.id === 'aether'
                          ? 'linear-gradient(135deg, #00d2ff 0%, #6366f1 45%, #a855f7 80%, #9333ea 100%)'
                          : color.hex,
                      }}
                    >
                      {isSelected && (settings.neonIntensity || 'vibrant') !== 'none' && (
                        <span
                          className={`absolute -inset-1 rounded-full pointer-events-none ${
                            (settings.neonIntensity || 'vibrant') === 'subtle'
                              ? 'opacity-25 animate-pulse'
                              : 'opacity-40 animate-ping'
                          }`}
                          style={{
                            background: color.id === 'aether'
                              ? 'linear-gradient(135deg, #00d2ff 0%, #a855f7 100%)'
                              : color.hex,
                          }}
                        />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm truncate ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                          {color.name}
                        </span>
                        {isSelected && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: color.hex }}
                          >
                            <Check
                              className="w-3.5 h-3.5"
                              style={{ color: color.id === 'monochrome' ? '#09090b' : '#ffffff' }}
                            />
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] block mt-0.5 line-clamp-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {color.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Studio de Démonstration en Direct (Live Accent Studio) */}
            <div className={`mt-4 p-5 rounded-2xl border space-y-3 transition-colors ${
              isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aperçu en direct (Couleur & Effet Néon)
                </span>
                <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Palette : <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{ACCENT_OPTIONS.find((c) => c.id === settings.accentColor)?.name}</span> • Néon : <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{NEON_INTENSITY_OPTIONS.find((n) => n.id === (settings.neonIntensity || 'vibrant'))?.name}</span>
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Chaque élément ci-dessous s'adapte instantanément à la couleur et à l'intensité néon choisie :
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  style={
                    (settings.neonIntensity || 'vibrant') === 'none'
                      ? { boxShadow: 'none' }
                      : (settings.neonIntensity || 'vibrant') === 'subtle'
                      ? { boxShadow: '0 4px 10px -2px rgba(0, 0, 0, 0.25)' }
                      : undefined
                  }
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bouton Actif Principal</span>
                </button>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  (settings.neonIntensity || 'vibrant') === 'none'
                    ? 'border-purple-500/25 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : (settings.neonIntensity || 'vibrant') === 'subtle'
                    ? 'border-purple-500/35 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'border-purple-500/50 bg-purple-500/15 text-purple-600 dark:text-purple-400'
                }`}>
                  {(settings.neonIntensity || 'vibrant') !== 'none' && (
                    <span className={`w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 ${
                      (settings.neonIntensity || 'vibrant') === 'subtle' ? 'opacity-30' : 'animate-ping'
                    }`} />
                  )}
                  <span>Statut & Badge Néon</span>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold text-purple-600 dark:text-purple-400 ${
                  isDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-200 bg-white shadow-sm'
                }`}>
                  Texte Accent
                </div>

                <div className="p-2 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Palette className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* C. Intensité de l'effet néon & Luminescence (Glow) */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Intensité de l'effet néon & Luminescence (Glow)
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Ajustez les halos lumineux, reflets et ombres colorées pour reposer vos yeux ou épurer l'interface.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
                  settings.neonIntensity === 'none'
                    ? 'border-zinc-700 bg-zinc-800/60 text-zinc-300'
                    : settings.neonIntensity === 'subtle'
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                    : 'border-purple-500/40 bg-purple-500/15 text-purple-400 font-bold'
                }`}>
                  Actuel : {NEON_INTENSITY_OPTIONS.find((n) => n.id === (settings.neonIntensity || 'vibrant'))?.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {NEON_INTENSITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = (settings.neonIntensity || 'vibrant') === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      updateSetting('neonIntensity', opt.id);
                      showNotification(`Effet néon réglé sur "${opt.name}"`);
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : isDark
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            opt.id === 'subtle'
                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                              : opt.id === 'none'
                              ? 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/40'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>
                            {opt.badge}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                        </div>
                      </div>

                      <span className={`font-semibold text-sm block ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {opt.name}
                      </span>
                      <span className={`text-[11px] block mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {opt.desc}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-[11px]">
                      <span className="opacity-75">{opt.tagline}</span>
                      <span className="font-mono text-[10px] opacity-60">
                        {opt.id === 'none' ? '0% Glow' : opt.id === 'subtle' ? '25% Glow' : '100% Glow'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* D. Style de fond sombre (OLED vs Zinc) */}
          <div className={`p-6 rounded-3xl border space-y-5 transition-colors ${
            isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <Moon className="w-4 h-4 text-purple-500" />
                  Nuance du thème sombre
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Choisissez l'intensité du noir lorsque le mode sombre est activé
                </p>
              </div>

              {!isDark && (
                <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Visible en Mode Sombre
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DARK_BG_OPTIONS.map((opt) => {
                const isSelected = (settings.darkBgStyle || 'zinc') === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSetting('darkBgStyle', opt.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/20'
                        : isDark
                        ? 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl border border-zinc-700/60 shadow-inner flex items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: opt.hex }}
                        >
                          <div
                            className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full border border-zinc-600"
                            style={{ backgroundColor: opt.id === 'oled' ? '#09090b' : '#18181b' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${
                              isSelected
                                ? isDark ? 'text-white font-bold' : 'text-zinc-950 font-bold'
                                : isDark ? 'text-zinc-200' : 'text-zinc-800'
                            }`}>
                              {opt.name}
                            </span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                              opt.id === 'oled'
                                ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                                : isDark
                                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                : 'bg-zinc-200 text-zinc-700 border border-zinc-300'
                            }`}>
                              {opt.badge}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {opt.hex}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{
                            backgroundColor: settings.accentColor === 'monochrome' ? '#ffffff' : (ACCENT_OPTIONS.find(c => c.id === settings.accentColor)?.hex || '#8b5cf6'),
                            color: settings.accentColor === 'monochrome' ? '#09090b' : '#ffffff',
                          }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {opt.desc}
                    </p>

                    {/* Aperçu visuel en miniature */}
                    <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center gap-2">
                      <div
                        className="flex-1 h-6 rounded-lg border border-zinc-800 flex items-center px-2 gap-1.5"
                        style={{ backgroundColor: opt.hex }}
                      >
                        <div
                          className="h-3 w-8 rounded text-[9px] font-mono flex items-center justify-center text-zinc-400"
                          style={{ backgroundColor: opt.id === 'oled' ? '#09090b' : '#18181b' }}
                        >
                          card
                        </div>
                        <div className="h-1.5 flex-1 rounded bg-zinc-800/80" />
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* D. Typographie & Densité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Typographie */}
            <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
              isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <Type className="w-4 h-4 text-cyan-500" />
                  Typographie de l'interface
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Police d'écriture pour les textes et l'éditeur
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'sans' as TypographyStyle, label: 'Sans-Serif Moderne', preview: 'Inter / Apple System — Neutre et optimisé' },
                  { id: 'serif' as TypographyStyle, label: 'Serif Littéraire', preview: 'Georgia / Lora — Style livre & Notion élégant' },
                  { id: 'mono' as TypographyStyle, label: 'Monospace Technique', preview: 'JetBrains Mono — Précision de code' },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      updateSetting('typography', font.id);
                      showNotification(`Police réglée sur ${font.label}`);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      settings.typography === font.id
                        ? isDark
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300'
                          : 'bg-purple-50 border-purple-500 text-purple-700 font-semibold'
                        : isDark
                        ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100/60'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{font.label}</span>
                      <span className={`text-[11px] block ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{font.preview}</span>
                    </div>
                    {settings.typography === font.id && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Densité d'affichage */}
            <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
              isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              <div>
                <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  <Maximize2 className="w-4 h-4 text-emerald-500" />
                  Densité d'affichage
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Espacements des éléments et listes
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'comfortable' as DisplayDensity, label: 'Mode Aéré (Standard)', icon: Maximize2, desc: 'Espacements généreux et lecture confortable' },
                  { id: 'compact' as DisplayDensity, label: 'Mode Compact', icon: Minimize2, desc: 'Idéal pour afficher plus de tâches et notes simultanément' },
                ].map((d) => {
                  const Icon = d.icon;
                  const isSelected = settings.density === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        updateSetting('density', d.id);
                        showNotification(`Densité réglée sur "${d.label}"`);
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-purple-500/15 border-purple-500 text-purple-300'
                            : 'bg-purple-50 border-purple-500 text-purple-700 font-semibold'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
                        <div>
                          <span className="text-xs font-bold block">{d.label}</span>
                          <span className={`text-[11px] block ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>{d.desc}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
