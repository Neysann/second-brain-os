// Types et Modèles de données pour Syntropy OS

export type ParaCategory = 'project' | 'area' | 'resource' | 'archive';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

export type ThemeMode = 'dark' | 'light';

export type ThemeSetting = 'light' | 'dark' | 'auto';
export type AccentColor = 'purple' | 'aether' | 'cyan' | 'emerald' | 'amber' | 'red' | 'rose' | 'mix' | 'monochrome';
export type DarkBgStyle = 'zinc' | 'oled';
export type NeonIntensity = 'vibrant' | 'subtle' | 'none';
export type TypographyStyle = 'sans' | 'serif' | 'mono';
export type DisplayDensity = 'comfortable' | 'compact';
export type DefaultEditorMode = 'write' | 'split' | 'preview';
export type AutoSaveDelay = 500 | 2000 | 5000;
export type StartupView = '/' | '/tasks' | '/notes' | '/calendar';
export type UiStyle = 'syntropy' | 'nothing' | 'cyberpunk' | string;

export interface AppSettings {
  // 1. Apparence & Personnalisation (UI / UX)
  uiStyle?: UiStyle; // 'syntropy' (Liquid Glass) ou 'nothing' (Nothing OS DA)
  theme: ThemeSetting;
  accentColor: AccentColor;
  previousAccentColor?: AccentColor;
  darkBgStyle: DarkBgStyle;
  neonIntensity: NeonIntensity;
  typography: TypographyStyle;
  density: DisplayDensity;
  surfaceTransparency?: number; // 0 à 45 % (défaut 35)
  reduceTransparency?: boolean; // désactive les effets de flou et de translucidité (défaut false)

  // 2. Éditeur de Notes & Markdown
  defaultEditorMode: DefaultEditorMode;
  defaultInkPaperColor?: InkPaperColor;
  showWordCount: boolean;
  autoSaveDelay: AutoSaveDelay;
  showBacklinks: boolean;

  // 3. Organisation & Méthode PARA
  startupView: StartupView;
  firstDayOfWeek: FirstDayOfWeek;
  hideEmptyParaCategories: boolean;
  defaultTaskPriority: TaskPriority;

  // 4. Gestion des Données & Confidentialité
  showSyncStatusBadge: boolean;

  // 5. Profil & Ambiance
  greetingName: string;
  showQuotesWidget?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  role?: 'admin' | 'user';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: ParaCategory;
  projectId?: string;
  dueDate?: string; // YYYY-MM-DD
  completedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  category: ParaCategory;
  status: ProjectStatus;
  color?: string; // Hex ou nom de couleur
  deadline?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD ou YYYY-MM-DDTHH:mm
  endDate?: string;   // YYYY-MM-DD ou YYYY-MM-DDTHH:mm
  allDay?: boolean;
  color?: string;     // Hex de couleur ou classe
  location?: string;
  category?: ParaCategory | 'event';
  source?: 'manual' | 'ical' | 'google';
  externalId?: string; // UID iCal ou Google pour déduplication
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface ICalSyncFeed {
  id: string;
  name: string;
  url: string;
  color?: string;
  lastSyncedAt?: string;
  eventsCount?: number;
  autoSync?: boolean;
  error?: string;
}

export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string | null; // Données base64 (peut être omis dans Firestore pour respecter la limite de 1 Mo)
  thumbnailUrl?: string | null; // Miniature ultralégère pour affichage instantané
  uploadedAt: string;
  chunksCount?: number; // Nombre de fragments stockés en sous-collection Firestore
  isCloudSynced?: boolean; // Indique si le fichier est répliqué sur le cloud
}

export interface NoteFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: string;
  userId?: string;
  parentId?: string | null; // ID du dossier parent (pour les sous-dossiers imbriqués)
}

// ===== Syntropy Stylus & Star Canvas =====
export type InkPenTool = 'pen' | 'fountain' | 'highlighter';
export type InkTool = InkPenTool | 'eraser' | 'lasso';
export type InkEraserMode = 'stroke' | 'pixel';
export type InkBackground = 'dark' | 'lined' | 'dots';
export type InkPaperColor = 'dark' | 'white' | 'sepia' | 'slate';
export type InkWidthPreset = 'thin' | 'medium' | 'thick';

export interface InkStroke {
  id: string;
  tool: InkPenTool;
  color: string;
  width: number; // en unités "monde"
  points: number[]; // [x, y, pressure, x, y, pressure, ...]
}

export interface InkLatexBlock {
  id: string;
  latex: string;
  x: number; // Coordonnée X dans l'espace monde
  y: number; // Coordonnée Y dans l'espace monde
  fontSize?: number; // Taille de police en px monde (défaut ~20)
  color?: string; // Couleur personnalisée
  displayMode?: boolean; // display $$ vs inline $
}

export interface InkDocument {
  version: 1;
  background: InkBackground;
  paperColor?: InkPaperColor;
  strokes: InkStroke[];
  latexBlocks?: InkLatexBlock[];
}

// Emplacement manuscrit intégré dans une note classique (référencé dans le texte par @@ink:<id>@@)
export interface InkBlockData {
  ink: string; // Encre encodée (voir inkCodec) — chaîne vide si l'emplacement est vierge
  h: number; // Hauteur d'affichage en pixels
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown
  category: ParaCategory;
  folderId?: string; // ID du dossier parent
  projectId?: string;
  tags: string[];
  isPinned?: boolean;
  attachments?: NoteAttachment[]; // Documents importés (PDF, images, etc.)
  format?: 'text' | 'ink'; // Mode d'affichage courant (texte ou manuscrit)
  ink?: string | null; // Données vectorielles encodées (compressées) — inline
  inkChunks?: number; // Nombre de chunks si stocké en sous-collection
  inkBlocks?: string | null; // JSON { [blockId]: InkBlockData } des emplacements manuscrits intégrés au texte — inline
  inkBlocksChunks?: number; // Nombre de chunks si stocké en sous-collection
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface ParaStats {
  projectsCount: number;
  areasCount: number;
  resourcesCount: number;
  archivesCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  totalNotesCount: number;
  notesCount: number;
  classicNotesCount: number;
  inkNotesCount: number;
}
