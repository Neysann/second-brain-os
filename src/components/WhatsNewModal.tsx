'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  X,
  Palette,
  ArrowRight,
  CheckCircle2,
  Music,
  Sliders,
  FileCode,
  Laptop,
  BookOpen,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { CURRENT_VERSION } from '@/lib/version';

export { CURRENT_VERSION };

/**
 * Règle de déclenchement :
 * IS_MAJOR_RELEASE = true uniquement lors d'une refonte majeure ou d'une grosse mise à jour.
 * Pour les correctifs de bugs ou les micro-changements (patchs réguliers), laisser à false
 * pour que la pop-up ne s'ouvre PAS au démarrage de l'utilisateur.
 */
export const IS_MAJOR_RELEASE = true;
export const LAST_MAJOR_VERSION = '2.6.40';

interface FeatureCard {
  icon: React.ElementType;
  color: string;
  title: string;
  points: string[];
}

interface WhatsNewModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener('open-whats-new', handleCustomOpen);
    return () => window.removeEventListener('open-whats-new', handleCustomOpen);
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Si ce n'est pas une mise à jour majeure, ne pas déranger l'utilisateur au lancement
    if (!IS_MAJOR_RELEASE) {
      return;
    }

    // Pour une mise à jour majeure, afficher la pop-up si cette étape clé n'a pas encore été vue
    const lastSeenMajor = localStorage.getItem('syntropy_last_seen_major_version');
    if (lastSeenMajor !== LAST_MAJOR_VERSION) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, forceOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('syntropy_last_seen_major_version', LAST_MAJOR_VERSION);
    localStorage.setItem('syntropy_last_seen_version', CURRENT_VERSION);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleGoToSettings = () => {
    handleClose();
    router.push('/settings');
  };

  // Liste épurée des fonctionnalités majeures (points clés courts et visuels)
  const features: FeatureCard[] = [
    {
      icon: BookOpen,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'V2.6.40 — Refonte Interface des Notes (Obsidian / Notion)',
      points: [
        'Explorateur 2 volets : arborescence permanente des dossiers et sous-dossiers avec vues rapides (Toutes, Épinglées, Manuscrites).',
        'En-tête épuré 46px : fil d\'Ariane interactif avec sélecteur de dossier rapide en 1 clic et menu d\'actions compact (···).',
        'Barre de formatage capsule flottante au bas de l\'écran et palette mathématique LaTeX activable à la demande (∑ Math).',
      ],
    },
    {
      icon: Music,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'V2.6.38 — Widgets Multitailles & Audio Hybride',
      points: [
        'Widgets réactifs : affichages authentiques selon la taille (1x1 express, 2x1 standard, 2x2 et 4x1 avec Kanban et matrices).',
        'Actualités en direct : vrais flux RSS réactifs (Tech, Sciences, Monde, Économie) avec recherche et mise en cache hors-ligne.',
        'Lecteur audio connecté : détection en temps réel de votre musique PC (Spotify, Deezer, YouTube) et ambiances relaxantes 432Hz.',
      ],
    },
    {
      icon: Sliders,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'V2.6.36 — Refonte du Menu des Paramètres',
      points: [
        'Navigation latérale verticale moderne et fluide style macOS / Linear.',
        'Options dédupliquées et réorganisées en 5 sections claires.',
        'Aperçu réactif compact en direct de vos choix de personnalisation.',
      ],
    },
    {
      icon: FileCode,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'V2.6.35 — Import Markdown (.md)',
      points: [
        'Importez vos fichiers Markdown par simple glisser-déposer ou via la barre latérale.',
        'Lecture intelligente des tags YAML et choix entre créer une note ou compléter l\'existante.',
      ],
    },
    {
      icon: Laptop,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'V2.6.33 — Paramètres Application Bureau',
      points: [
        'Onglet dédié au client Windows : raccourci de capture rapide personnalisable.',
        'Gestion de la barre des tâches, démarrage automatique et accélération matérielle.',
      ],
    },
    {
      icon: BookOpen,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'V2.6.28 — Écran Lectures & Romans Web',
      points: [
        'Suivi de vos livres, manga et romans web dans une bibliothèque visuelle.',
        'Objectif annuel, streaks de lecture et recherche automatique des couvertures.',
      ],
    },
    {
      icon: Sparkles,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      title: 'V2.6.0 — Design Syntropy Liquid Glass',
      points: [
        'Esthétique moderne avec translucidité des surfaces et flou d\'arrière-plan réglable.',
        'Thèmes sombres OLED et personnalisation intégrale des accents de couleur.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all relative ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-purple-950/40'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* En-tête épuré */}
        <div className="p-5 md:p-6 border-b border-inherit relative overflow-hidden bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors z-10 cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden border border-purple-500/30 flex items-center justify-center">
              <img src="/logo.png" alt="Syntropy Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3" />
              Nouveautés majeures • V{CURRENT_VERSION}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Quoi de neuf sur Syntropy ?
          </h2>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            Voici les grandes nouveautés ajoutées récemment pour enrichir votre quotidien.
          </p>
        </div>

        {/* Liste épurée des fonctionnalités majeures */}
        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex items-start gap-3 transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/60 border-zinc-800/80'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${f.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-bold text-xs tracking-tight text-zinc-900 dark:text-white">
                    {f.title}
                  </h3>
                  <ul className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                    {f.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-purple-500 font-bold shrink-0">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pied de fenêtre avec boutons d'action */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Version {CURRENT_VERSION} installée</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleGoToSettings}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Paramètres</span>
            </button>

            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Continuer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
