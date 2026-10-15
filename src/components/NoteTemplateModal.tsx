'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Search,
  GraduationCap,
  BookOpen,
  FlaskConical,
  FolderGit2,
  BookMarked,
  Users,
  PenTool,
  Check,
  Plus,
  Eye,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { NOTE_TEMPLATES, NoteTemplate } from '@/lib/noteTemplates';
import LatexRenderer from './LatexRenderer';

interface NoteTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NoteTemplate, mode: 'create_new' | 'apply_current') => void;
  hasCurrentNote?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  BookOpen,
  FlaskConical,
  FolderGit2,
  BookMarked,
  Users,
  PenTool,
};

export const NoteTemplateModal: React.FC<NoteTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  hasCurrentNote = false,
}) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(NOTE_TEMPLATES[0].id);
  const [previewTab, setPreviewTab] = useState<'preview' | 'raw'>('preview');

  const categories = [
    { id: 'all', label: 'Tous les modèles' },
    { id: 'research', label: '📖 Synthèse & Lecture' },
    { id: 'meeting', label: '🤝 Réunions & Décisions' },
    { id: 'general', label: '☀️ Quotidien & Clarté' },
    { id: 'project', label: '🚀 Projets, Idéation & SOP' },
    { id: 'study', label: '🎓 Études & Stylet' },
  ];

  const filteredTemplates = useMemo(() => {
    return NOTE_TEMPLATES.filter((tpl) => {
      if (selectedCategory !== 'all' && tpl.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = tpl.title.toLowerCase().includes(query);
        const matchSummary = tpl.summary.toLowerCase().includes(query);
        const matchTags = tpl.defaultTags.some((t) => t.toLowerCase().includes(query));
        return matchTitle || matchSummary || matchTags;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const activeTemplate = useMemo(() => {
    return (
      filteredTemplates.find((t) => t.id === activeTemplateId) ||
      filteredTemplates[0] ||
      NOTE_TEMPLATES[0]
    );
  }, [filteredTemplates, activeTemplateId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl h-[92vh] sm:h-[86vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 shadow-purple-950/20'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
        }`}
      >
        {/* En-tête de la modale */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b flex-shrink-0 transition-colors ${
            theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                Modèles de Notes Syntropy
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono font-semibold border border-purple-500/30 hidden sm:inline">
                  {NOTE_TEMPLATES.length} templates
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden xs:block">
                Choisissez une structure éprouvée pour vos cours, révisions et projets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'
            }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de Filtres & Recherche */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0 transition-colors ${
            theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50/40'
          }`}
        >
          {/* Onglets Catégories */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : theme === 'dark'
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Recherche */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un modèle..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-colors ${
                theme === 'dark'
                  ? 'border-zinc-700/80 bg-zinc-900 text-zinc-200 placeholder:text-zinc-500 focus:border-purple-500'
                  : 'border-zinc-300 bg-white text-zinc-800 placeholder:text-zinc-400 focus:border-purple-600 shadow-sm'
              }`}
            />
          </div>
        </div>

        {/* Corps de la modale en deux panneaux (Liste à gauche, Prévisualisation à droite) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Panneau Gauche : Cartes des Modèles */}
          <div
            className={`w-full md:w-5/12 border-b md:border-b-0 md:border-r overflow-y-auto p-3 sm:p-4 space-y-2.5 flex-shrink-0 scrollbar-thin ${
              theme === 'dark' ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50/20'
            }`}
          >
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Aucun modèle ne correspond à votre recherche.
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = activeTemplate?.id === tpl.id;
                const IconComponent = ICON_MAP[tpl.iconName] || FileText;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setActiveTemplateId(tpl.id)}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer text-left relative group ${
                      isSelected
                        ? theme === 'dark'
                          ? 'border-purple-500/80 bg-purple-950/30 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/30'
                          : 'border-purple-500 bg-purple-50/80 ring-1 ring-purple-400/50 shadow-sm'
                        : theme === 'dark'
                        ? 'border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-850/80 hover:border-zinc-700'
                        : 'border-zinc-200 bg-white hover:bg-zinc-100 hover:border-zinc-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{
                          backgroundColor: `${tpl.color}20`,
                          color: tpl.color,
                        }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isSelected
                                ? 'text-purple-600 dark:text-purple-300'
                                : theme === 'dark'
                                ? 'text-zinc-100'
                                : 'text-zinc-900'
                            }`}
                          >
                            {tpl.title}
                          </h3>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold font-mono flex-shrink-0"
                            style={{
                              backgroundColor: `${tpl.color}15`,
                              color: tpl.color,
                            }}
                          >
                            {tpl.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-snug">
                          {tpl.summary}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {tpl.defaultTags.map((tag) => (
                            <span
                              key={tag}
                              className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                theme === 'dark'
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panneau Droit : Prévisualisation Interactive */}
          <div className="w-full md:w-7/12 flex-1 flex flex-col overflow-hidden bg-transparent">
            {activeTemplate && (
              <>
                {/* Barre supérieure de prévisualisation */}
                <div
                  className={`px-4 sm:px-6 py-2 border-b flex items-center justify-between flex-shrink-0 transition-colors ${
                    theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Aperçu en direct</span>
                    </span>
                    <span className="text-xs font-semibold truncate hidden sm:inline text-purple-500">
                      • {activeTemplate.title}
                    </span>
                  </div>

                  <div
                    className={`flex items-center p-0.5 rounded-lg border text-xs ${
                      theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <button
                      onClick={() => setPreviewTab('preview')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        previewTab === 'preview'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Rendu Formaté
                    </button>
                    <button
                      onClick={() => setPreviewTab('raw')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        previewTab === 'raw'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Markdown Brut
                    </button>
                  </div>
                </div>

                {/* Contenu de la prévisualisation */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                  {previewTab === 'preview' ? (
                    <div
                      className={`prose prose-sm max-w-none transition-colors ${
                        theme === 'dark' ? 'prose-invert text-zinc-200' : 'text-zinc-800'
                      }`}
                    >
                      <LatexRenderer content={activeTemplate.content} />
                    </div>
                  ) : (
                    <pre
                      className={`font-mono text-xs p-4 rounded-xl border whitespace-pre-wrap overflow-x-auto ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                      }`}
                    >
                      {activeTemplate.content}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pied de la modale avec actions d'insertion */}
        <div
          className={`p-3.5 sm:px-6 border-t flex items-center justify-between gap-3 flex-wrap flex-shrink-0 transition-colors ${
            theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <div className="text-xs text-zinc-500 hidden sm:block">
            Modèle actif : <span className="font-semibold text-purple-400">{activeTemplate?.title}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              Annuler
            </button>

            {hasCurrentNote && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Appliquer ce modèle va remplacer le texte de la note actuelle par "${activeTemplate.title}". Voulez-vous continuer ?`
                    )
                  ) {
                    onSelectTemplate(activeTemplate, 'apply_current');
                    onClose();
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300'
                    : 'border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700'
                }`}
                title="Remplacer le contenu de la note actuellement ouverte"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Appliquer à cette note</span>
              </button>
            )}

            <button
              onClick={() => {
                onSelectTemplate(activeTemplate, 'create_new');
                onClose();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              title="Créer une nouvelle note vierge avec la structure de ce modèle"
            >
              <Plus className="w-4 h-4" />
              <span>Créer avec ce modèle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteTemplateModal;
