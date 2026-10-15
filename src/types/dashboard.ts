export type WidgetId =
  | 'calendar'
  | 'clock'
  | 'weather'
  | 'quick_notes'
  | 'tasks'
  | 'projects_overview'
  | 'project_progress'
  | 'focus_timer'
  | 'daily_quote'
  | 'audio_player'
  | 'rss_feed'
  | 'news'
  | 'interactive'
  | 'meme'
  | 'streak_duo'
  | 'habits_sprint'
  | 'budget_mini';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidgetConfig {
  id: string; // unique instance id
  widgetId: WidgetId;
  size: WidgetSize;
  order: number;
  customSize?: {
    cols?: number; // 1 to 4
    rows?: number; // 1 to 2
  };
  settings?: Record<string, unknown>;
}

export interface WidgetMeta {
  id: WidgetId;
  name: string;
  description: string;
  defaultSize: WidgetSize;
  allowedSizes: WidgetSize[];
  iconName: string;
  category: 'productivity' | 'focus' | 'information' | 'lifestyle';
  canCustomizeSize?: boolean;
}

export const WIDGET_CATALOG: WidgetMeta[] = [
  {
    id: 'calendar',
    name: 'Calendrier',
    description: 'Vos événements et rendez-vous',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    iconName: 'Calendar',
    category: 'productivity',
  },
  {
    id: 'clock',
    name: 'Horloge',
    description: 'Cadran analogique & heure locale',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Clock',
    category: 'information',
  },
  {
    id: 'weather',
    name: 'Météo',
    description: 'Conditions météo en temps réel',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'CloudSun',
    category: 'information',
  },
  {
    id: 'quick_notes',
    name: 'Notes rapides',
    description: 'Captation express d\'idées et pense-bêtes',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'FileText',
    category: 'productivity',
  },
  {
    id: 'tasks',
    name: 'To-do list',
    description: 'Gérez vos tâches et priorités',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    iconName: 'CheckSquare',
    category: 'productivity',
  },
  {
    id: 'projects_overview',
    name: 'Projets & tâches',
    description: 'Vue d\'ensemble avec barres d\'avancement',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    iconName: 'FolderGit2',
    category: 'productivity',
  },
  {
    id: 'project_progress',
    name: 'Progression projet',
    description: 'Jauge circulaire de productivité',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Target',
    category: 'productivity',
  },
  {
    id: 'daily_quote',
    name: 'Citation du jour',
    description: 'Inspiration quotidienne et motivation',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    iconName: 'Quote',
    category: 'lifestyle',
    canCustomizeSize: true,
  },
  {
    id: 'focus_timer',
    name: 'Minuteur focus',
    description: 'Session Pomodoro 25min et pauses',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Timer',
    category: 'focus',
  },
  {
    id: 'audio_player',
    name: 'Lecteur audio',
    description: 'Musique d\'ambiance et sons Lofi',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Music',
    category: 'focus',
  },
  {
    id: 'rss_feed',
    name: 'Flux RSS / Veille',
    description: 'Veille d\'actualités pour vos Ressources',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    iconName: 'Rss',
    category: 'information',
  },
  {
    id: 'news',
    name: 'Actualités',
    description: 'Dernières dépêches et innovations tech',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium'],
    iconName: 'Newspaper',
    category: 'information',
  },
  {
    id: 'interactive',
    name: 'Widget interactif',
    description: 'Calculatrice & scratchpad rapide',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Sparkles',
    category: 'productivity',
  },
  {
    id: 'meme',
    name: 'Meme / GIF du jour',
    description: 'Une dose d\'humour quotidienne',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Image',
    category: 'lifestyle',
  },
  {
    id: 'streak_duo',
    name: 'Flamme & Streaks',
    description: 'Jours consécutifs Duolingo & matrice 28 jours',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Flame',
    category: 'lifestyle',
  },
  {
    id: 'habits_sprint',
    name: 'Sprint 10 Jours',
    description: 'Rituels du jour issus de votre cycle actif',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'CheckCircle2',
    category: 'productivity',
  },
  {
    id: 'budget_mini',
    name: 'Budget Mensuel',
    description: 'Solde net, dépenses et jauge de consommation',
    defaultSize: 'small',
    allowedSizes: ['small', 'medium'],
    iconName: 'Wallet',
    category: 'productivity',
  },
];

// Configuration par défaut correspondant exactement à la maquette de l'utilisateur (10 widgets)
export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetConfig[] = [
  // Ligne 1 (haut)
  { id: 'w-calendar-1', widgetId: 'calendar', size: 'small', order: 0 },
  { id: 'w-clock-1', widgetId: 'clock', size: 'small', order: 1 },
  { id: 'w-weather-1', widgetId: 'weather', size: 'small', order: 2 },
  { id: 'w-quicknotes-1', widgetId: 'quick_notes', size: 'small', order: 3 },

  // Ligne 2 (milieu)
  { id: 'w-tasks-1', widgetId: 'tasks', size: 'medium', order: 4 },
  { id: 'w-projects-1', widgetId: 'projects_overview', size: 'medium', order: 5 },

  // Ligne 3 (bas)
  { id: 'w-prog-1', widgetId: 'project_progress', size: 'small', order: 6 },
  { id: 'w-quote-1', widgetId: 'daily_quote', size: 'medium', order: 7, customSize: { cols: 2 } },
  { id: 'w-timer-1', widgetId: 'focus_timer', size: 'small', order: 8 },
  { id: 'w-audio-1', widgetId: 'audio_player', size: 'small', order: 9 },
];
