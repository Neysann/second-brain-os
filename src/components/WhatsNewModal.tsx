'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Moon,
  X,
  Sliders,
  FileText,
  Download,
  Calendar as CalendarIcon,
  ArrowRight,
  CheckCircle2,
  Palette,
  Clock,
  Link2,
  Zap,
  PenTool,
  Users,
  User,
  Music,
  Eye,
  Cloud,
  Search,
  Command,
  Globe,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { CURRENT_VERSION } from '@/lib/version';

export { CURRENT_VERSION };

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

    // Afficher la pop-up lorsque la version actuelle n'a pas encore été consultée
    const lastSeen = localStorage.getItem('syntropy_last_seen_version');
    if (lastSeen !== CURRENT_VERSION) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, forceOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('syntropy_last_seen_version', CURRENT_VERSION);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleGoToSettings = () => {
    handleClose();
    router.push('/settings');
  };

  const features = [
    {
      icon: Palette,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      title: 'Syntropy OS V2.6.25 : Verrouillage Accentuation Bi-ton Jaune & Cyan Cyberpunk HUD',
      desc: 'Dans le thème Cyberpunk 2077 HUD, la couleur d\'accentuation est désormais entièrement verrouillée sur le bi-ton officiel Jaune néon (#FCEE0A) et Bleu électrique (#00F0FF) sur 100% de l\'interface (boutons haute lisibilité, formulaires, badges, bordures, scrollbars et sélections de texte). Le sélecteur des paramètres affiche une carte verrouillée dédiée, et votre ancienne couleur d\'accentuation est automatiquement restaurée en revenant au thème classique.',
    },
    {
      icon: Zap,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      title: 'Syntropy OS V2.6.24 : Nouveau Thème Secret Cyberpunk HUD & Cascade Matrix',
      desc: 'Découvrez la nouvelle direction artistique Cyberpunk HUD accessible depuis le menu secret : esthétique Cyberdeck haute fidélité avec découpes angulaires, tags techniques de série (CAL-001, CLK-001...), accents jaune fluo (#FCEE0A) et cyan (#00F0FF), horloge numérique cyan luminescente, panneau de télémétrie système et cascade Matrix de caractères ASCII en arrière-plan discret.',
    },
    {
      icon: Sparkles,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Syntropy OS V2.6.23 : Un Secret se Cache dans les Paramètres...',
      desc: 'Un menu secret a été discrètement ajouté au sein de l\'application. Il permet d\'accéder à un laboratoire expérimental pour explorer et basculer facilement entre les directions artistiques. Saurez-vous trouver comment le faire apparaître ?',
    },
    {
      icon: CalendarIcon,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      title: 'Syntropy OS V2.6.21 : Synchronisation Google Agenda Directe & Native',
      desc: 'Téléchargement direct et instantané de vos flux iCal / Webcal Google Agenda dans l\'application de bureau Electron via une passerelle native Node.js. Contournement définitif des restrictions CORS des navigateurs sans dépendance à des proxys externes, et affichage de diagnostics détaillés en cas d\'URL erronée.',
    },
    {
      icon: Palette,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'Syntropy OS V2.6.20 : Thème Aether en Dégradé Bleu Violacé Céleste',
      desc: 'Refonte exclusive du thème d\'accentuation Aether sous la forme d\'un dégradé bleu violacé cyberpunk vibrant (#3b82f6 → #6366f1 → #8b5cf6). Unification complète sur les boutons d\'action, les effets néon, les bordures interactives et les orbes d\'aurore boréale du fond d\'écran.',
    },
    {
      icon: Moon,
      color: 'text-red-500 bg-red-500/10 border-red-500/30',
      title: 'Syntropy OS V2.6.19 : Mode Sombre Absolu & Verrouillage Signature Nothing Red',
      desc: 'Activation discrète de l\'expérience Nothing OS via le mode « Sombre absolu » (renommé depuis Noir Pur OLED). Retrait de Nothing OS de la sélection publique des thèmes pour en faire un mode immersif secret. Verrouillage exclusif de la couleur d\'accentuation sur le Rouge vermillon Nothing (#D71920) avec masquage automatique du sélecteur de couleurs, et restauration automatique de votre ancienne couleur dès que vous quittez le mode Sombre absolu.',
    },
    {
      icon: Sparkles,
      color: 'text-red-500 bg-red-500/10 border-red-500/30',
      title: 'Syntropy OS V2.6.18 : Écosystème Glyph Matériel & Widgets Nothing OS V3.0',
      desc: 'Simulation intégrale du dos transparent des Nothing Phone (2/2a) avec anneau Glyph LED dynamique, ruban de charge sans fil et barre de progression de batterie avec LED rouge Nothing. Refonte intégrale de tous les widgets aux codes Nothing : Météo monochrome avec rétro-éclairage LED blanc, Todo list avec cases squircles rouges, Streak heatmap à micro-points, Calendrier OLED noir pur, faisceau drag & drop laser Nothing Red et palette universelle ⌘K Nothing.',
    },
    {
      icon: Sparkles,
      color: 'text-red-500 bg-red-500/10 border-red-500/30',
      title: 'Syntropy OS V2.6.17 : Direction Artistique Nothing OS (Authentique)',
      desc: 'Nouvelle option de design immersif inspirée de Nothing OS dans Paramètres > Apparence : noir pur OLED (#000000), typographie matricielle à points NDOT 57 officielle pour les compteurs et horloges, accent rouge vermillon Nothing (#D71920), cadran analogique Nothing signature avec trotteuse rouge, matrice de points Glyph subtile et préservation intégrale de la lisibilité pour les notes et contenus textuels.',
    },
    {
      icon: User,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.6.16 : Navigation Profil & Gestion de Compte Sécurisée',
      desc: 'Correction de la navigation au clic sur le badge ou l\'avatar du profil utilisateur : redirection directe vers l\'onglet « Profil & Salutations » des paramètres (/settings?tab=profile) lorsque vous êtes connecté, et affichage d\'une modale de compte enrichie (statut, rôle, synchronisation Firestore et déconnexion sécurisée) au lieu d\'un formulaire de connexion redondant.',
    },
    {
      icon: Sparkles,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      title: 'Syntropy OS V2.6.0 : Transparence des surfaces & Effet Liquid Glass iOS',
      desc: 'Nouvelle expérience esthétique premium inspirée du Liquid Glass d\'iOS avec flou d\'arrière-plan (backdrop-filter blur) et translucidité réglable de 0 % à 45 % (curseur fluide, préréglages Opaque / Équilibrée / Verre, commutateur d\'accessibilité "Réduire les effets de transparence"), panneau d\'aperçu en direct dynamique avec fond d\'écran fluide et synchronisation Firestore / LocalStorage avec debounce 700ms.',
    },
    {
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.5.0 : Moteur Desktop Native Windows (.exe), Capture Alt+Espace & Console Admin',
      desc: 'Version exécutable Windows native (Syntropy-OS-Setup-2.5.0.exe) avec raccourci global Alt+Espace, mini-fenêtre de capture flottante au-dessus de tout, icône System Tray interactive avec menus contextuels, démarrage automatique au boot, notifications natives interactives, synchronisation locale du système de fichiers et onglet Paramètres Administrateur dédié.',
    },
    {
      icon: Shield,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Syntropy OS V2.3.9 : Enregistrement Backend Définitif des Domaines Google OAuth',
      desc: 'Application directe et synchronisation de https://evris-syntropy-os.web.app au niveau de Google Cloud Identity Platform (Identity Toolkit API). La connexion Google OAuth est désormais autorisée sans délai d\'attente sur tous vos navigateurs.',
    },
    {
      icon: KeyRound,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.3.8 : Récupération Sécurisée de Mot de Passe & Ergonomie',
      desc: 'Intégration du module « Mot de passe oublié ? » directement dans le menu de connexion avec envoi instantané d\'un lien officiel de réinitialisation sécurisé par email et typographie contrastée respectant le mode clair.',
    },
    {
      icon: Globe,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'Syntropy OS V2.3.7 : Nouvelle Adresse Web Officielle (evris-syntropy-os.web.app)',
      desc: 'Votre application Syntropy OS est désormais déployée et accessible sur son adresse dédiée : https://evris-syntropy-os.web.app ! Les synchronisations Firebase, l\'authentification Google, la base Firestore et les fichiers restent parfaitement connectés.',
    },
    {
      icon: Search,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.3.6 : Palette de Commandes Universelle & Nouveau Logo Tableau de Bord',
      desc: 'Déploiement de la Command Palette Universelle accessible de partout via Ctrl+K / Cmd+K : navigation clavier intégrale (↑/↓/Entrée), création instantanée (+note, +tâche, +événement, +habitude), bascule du thème et plein écran, et recherche enrichie (notes, tâches, projets, agenda, habitudes). Correction du bug d\'ouverture de la barre de recherche et intégration du logo officiel Syntropy dans le tableau de bord avec raccourci rapide.',
    },
    {
      icon: Link2,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'Syntropy OS V2.3.5 : Synchronisation Intégrale Widgets ↔ Écrans Dédiés',
      desc: 'Élimination totale des données fictives et du stockage isolé sur le tableau de bord : le widget Calendriers se synchronise en temps réel avec vos événements réels et tâches du calendrier (/calendar), le widget Notes Rapides crée et affiche directement vos vraies notes (/notes), la To-do List et les widgets de Progression Projets sont reliés à vos vraies tâches et projets (/tasks), et le widget Sprint Habitudes synchronise dynamiquement le jour réel du cycle actif (/habits).',
    },
    {
      icon: Sparkles,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Syntropy OS V2.3.4 : Refonte du Module Habitude & Typographie Noire en Thème Clair',
      desc: 'Suppression définitive de la grille 196-cases Syntropy Streaks au profit d\'un gestionnaire de rituels quotidien épuré et intuitif : validation instantanée (« Fait aujourd\'hui »), bandeau interactif des 7 derniers jours et filtres par catégorie. Règle absolue appliquée : en thème clair, toutes les polices (séries actives, objectifs, citations, tableaux de sprint) s\'affichent en noir haute lisibilité pour éliminer tout bug de texte blanc invisible.',
    },
    {
      icon: Palette,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.3.3 : Cohérence Visuelle Intégrale en Mode Clair & Sombre',
      desc: 'Tous les widgets du tableau de bord (Horloge Double, Météo, Notes Rapides, To-do list, Progression Projet, Calendrier, Habitudes, Budget Donut, Lecteur Audio, Minuteur, etc.) s\'adaptent désormais au thème actif : cartes claires épurées, typographies et bordures haute lisibilité en mode clair, et préservation intégrale du style néon sombre.',
    },
    {
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.3.2 : Rendu Optimisé Mode Clair (Dashboard & Widgets)',
      desc: 'Lisibilité parfaite en thème clair : texte d\'accueil contrasté (« Bonsoir »), boutons « Modifier widgets » et compteur adaptés sur fond blanc épuré, menu latéral des widgets et contrôles flottants intégralement compatibles mode clair & sombre.',
    },
    {
      icon: Cloud,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.3.1 : Synchronisation Rétroactive & Envoi Cloud des Fichiers',
      desc: 'Correction majeure pour vos fichiers déjà importés : détection et téléversement automatique en tâche de fond vers Cloud Firestore, bouton direct « Synchroniser vers le Cloud » dans l\'éditeur de note et badges clairs « ☁️ Cloud » / « 💾 Local ».',
    },
    {
      icon: Cloud,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      title: 'Syntropy OS V2.3 : Synchronisation Multi-Appareils Cloud des Fichiers & Notes',
      desc: 'Résolution définitive du bug de non-synchronisation entre PC, tablettes et smartphones ! Les documents importés (PDF, PowerPoint, Word, Excel, Images haute définition jusqu\'à 25 Mo) sont automatiquement découpés en fragments Cloud Firestore et mis en cache permanent IndexedDB.',
    },
    {
      icon: Download,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'Téléchargement à la Demande & Performance Optimale',
      desc: 'Les pièces jointes sont téléchargées instantanément au clic (lecture PDF, aperçu photo, téléchargement) pour préserver la mémoire de votre tablette, avec miniatures ultralégères disponibles immédiatement sur tous vos écrans.',
    },
    {
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy OS V2.2 : Couleur d\'Accentuation « Aether Céleste »',
      desc: 'Inspirée du système de design Aether (uiverse.io) : dégradé iridescent cyan céleste vers violet néon profond (#00d2ff → #6366f1 → #a855f7) enrichi pour faire ressortir les halos et reflets violacés de Syntropy.',
    },
    {
      icon: Eye,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'Barres de Défilement (Scrollbars) 100% Transparentes',
      desc: 'Disparition complète des ascenseurs visuels encombrants : profitez d\'un rendu ultra-épuré et fluide sur toutes les pages, widgets et modales avec défilement naturel préservé.',
    },
    {
      icon: Sliders,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Barre Latérale Épurée : Retrait du Sélecteur de Thème Rapide',
      desc: 'L\'interface principale gagne en clarté et sérénité avec le retrait du bouton de bascule jour/nuit de la barre latérale. La gestion du thème reste disponible dans vos Paramètres.',
    },
    {
      icon: Music,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Lecteur Audio & Ambiance Universel (Spotify, Deezer, YouTube Music)',
      desc: 'Widget audio avec intégration en un clic de vos plateformes musicales et générateur d\'ondes Zen binaurales (Lofi, Pluie, 432Hz).',
    },
    {
      icon: Sliders,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'Widgets Pleine Largeur (4 colonnes / 100% de la feuille)',
      desc: 'Nouvelle option de dimensionnement "Pleine largeur" permettant à vos widgets (Notes, Budget, Musique, Calendrier) d\'occuper toute la largeur avec un redimensionnement cyclique en 1 clic.',
    },
    {
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Module Habitudes Épuré & Matrice Annuelle Compacte',
      desc: 'Optimisation de l\'espace visuel : les cartes d\'habitudes sont désormais ultra-compactes, réactives et épurées de tout nom tiers, avec calcul dynamique des streaks consécutifs.',
    },
    {
      icon: Sliders,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Gestion Financière & Budget Donut SVG',
      desc: 'Suivez vos dépenses et revenus sans données parasites : répartition visuelle circulaire par postes, seuil d\'alerte mensuel et synthèse nette en direct sur /budget et en widget d\'accueil.',
    },
    {
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      title: 'Panneau Admin : Historique des Connexions & Accès Firebase',
      desc: 'Tableau en direct de tous les comptes connectés (emails, sessions, rôles, UID) synchronisé dans Firestore, et boutons d\'accès rapide directs vers la console Firebase Auth et Firestore.',
    },
    {
      icon: FileText,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Widget Notes Rapides Dédié & Guidé',
      desc: 'Le widget de mémos sur le tableau de bord démarre propre avec un encart tutoriel d\'aide et enregistre uniquement vos vraies notes personnelles créées sans idées préremplies.',
    },
    {
      icon: Sparkles,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'Tableau de Bord Modulaire Grille & Widgets',
      desc: 'Refonte majeure avec 17 widgets modulaires, tiroir latéral sans superposition avec prévisualisations visuelles réelles, commandes intégrées et bandeau haut agrandi.',
    },
    {
      icon: Clock,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      title: 'Widgets Réactifs Enrichis (Horloge Double & Météo Avancée)',
      desc: 'Accédez à des options enrichies en format étendu : double fuseau horaire mondial (Paris & Tokyo/New York), prévisions météo heure par heure sur 4h, vent, humidité et indice UV.',
    },
    {
      icon: PenTool,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Syntropy Stylus & Star Canvas (Prise de Notes Manuscrite)',
      desc: 'Basculez instantanément en mode Manuscrit dans vos notes pour dessiner et écrire au stylet (Apple Pencil, S-Pen) ou au doigt avec rejet de la paume, plume calligraphique, surligneur, gomme intelligente, lasso, reconnaissance de formes géométriques et export PNG/SVG.',
    },
    {
      icon: Zap,
      color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
      title: 'Atténuation de l\'Effet Néon & Luminescence (/settings)',
      desc: 'Nouvelle option dédiée pour reposer vos yeux : basculez entre l\'effet néon "Discret / Atténué" (-75% de lueur), "Minimaliste / Éteint" (style sobre sans reflets), ou "Vibrant / Élevé".',
    },
    {
      icon: Sparkles,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      title: 'Mise à Jour Automatique en Temps Réel (Zéro Actualisation)',
      desc: 'Tous vos ajouts, modifications ou suppressions de notes, tâches, projets et dossiers s\'affichent instantanément à l\'écran sans jamais nécessiter de rafraîchir la page (F5).',
    },
    {
      icon: Sliders,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Centre de Paramètres & Personnalisation Avancée (/settings)',
      desc: 'Menu complet avec 5 modules : Thème (Clair/Sombre/Auto), palette néon (6 nuances), fond Noir OLED #000000, polices au choix et densité compacte ou aérée.',
    },
    {
      icon: Clock,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'Métriques de Lecture, Backlinks & Rendu KaTeX',
      desc: 'Affichage du compteur de mots et de caractères, temps de lecture estimé, liens bidirectionnels [[Titre de note]] automatiques et délai de sauvegarde réglable.',
    },
    {
      icon: Download,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Exportation Markdown (.zip) & Sauvegarde Intégrale',
      desc: 'Téléchargez toutes vos notes classées par dossiers en archives .zip (compatibles Obsidian/Logseq) ou exportez/importez un backup JSON en 1 clic.',
    },
    {
      icon: CalendarIcon,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'Organisation PARA & Premier Jour de la Semaine',
      desc: 'Choisissez si votre semaine commence le Lundi ou le Dimanche sur le calendrier, masquez les catégories vides et configurez la priorité par défaut des tâches.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all relative ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-purple-950/40'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* En-tête décoratif */}
        <div className="p-6 md:p-8 border-b border-inherit relative overflow-hidden bg-gradient-to-br from-purple-900/30 via-transparent to-indigo-900/30">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors z-10 cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-purple-500/30 flex items-center justify-center">
              <img src="/logo.png" alt="Syntropy Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Nouveautés • Version {CURRENT_VERSION}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Quoi de neuf sur Syntropy ?
          </h2>
          <p
            className={`text-xs md:text-sm mt-1.5 leading-relaxed ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            Découvrez le tout nouveau centre de paramètres, la personnalisation graphique complète et les métriques de productivité.
          </p>
        </div>

        {/* Liste des fonctionnalités récentes */}
        <div className="p-6 space-y-3.5 max-h-[50vh] overflow-y-auto scrollbar-thin">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/60 border-zinc-800/80'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${f.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm tracking-tight">{f.title}</h3>
                  <p
                    className={`text-xs leading-relaxed ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                    }`}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer avec Bouton de confirmation */}
        <div
          className={`p-4 md:p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Version {CURRENT_VERSION} installée</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleGoToSettings}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              <span>Paramètres</span>
            </button>

            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsNewModal;
