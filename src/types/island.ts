export type IslandStyle = 'pill' | 'notch';
export type IslandTrigger = 'hover' | 'click';
export type IslandShortcutTarget = 'island' | 'classic-window';
export type IslandTab = 'media' | 'tasks' | 'focus' | 'habits' | 'shelf';

export interface DesktopConfig {
  closeToTray?: boolean;
  trayClickAction?: 'toggle-app' | 'open-quick-capture';
  shortcut?: string;
  quickCaptureAutoClose?: boolean;
  hardwareAcceleration?: boolean;
  autoBackupInterval?: 'disabled' | 'on_close' | 'daily';
  autoBackupFolder?: string;

  // Dynamic Island Desktop
  dynamicIslandEnabled?: boolean;
  dynamicIslandStyle?: IslandStyle;
  dynamicIslandTrigger?: IslandTrigger;
  dynamicIslandAutoHideFullscreen?: boolean;
  dynamicIslandShortcutTarget?: IslandShortcutTarget;
  dynamicIslandDefaultTab?: IslandTab;
  dynamicIslandClipboardHistory?: boolean;
  dynamicIslandSystemStats?: boolean;
}

export interface SMTCMediaSession {
  id: string;
  label: string;
  status: 'playing' | 'paused' | 'stopped';
  isCurrent: boolean;
}

export interface SMTCMediaInfo {
  ok: boolean;
  hasSession: boolean;
  title?: string;
  artist?: string;
  albumTitle?: string;
  appId?: string;
  sessions?: SMTCMediaSession[];
  status?: 'playing' | 'paused' | 'stopped';
  canPlay?: boolean;
  canPause?: boolean;
  canNext?: boolean;
  canPrevious?: boolean;
  positionMs?: number;
  durationMs?: number;
  thumbnailBase64?: string;
}

export interface SyncedLyricLine {
  timeMs: number;
  text: string;
}

export interface ShelfItem {
  id: string;
  type: 'file' | 'image' | 'link' | 'text';
  name: string;
  content?: string;
  dataUrl?: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

export interface ClipboardEntry {
  id: string;
  text: string;
  kind: 'text' | 'link' | 'code';
  pinned: boolean;
  copiedAt: string;
}

export interface SystemStats {
  cpuPercent: number;
  ramPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
}

export interface PomodoroSyncState {
  mode: 'focus' | 'break';
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  completedSessions: number;
  updatedAt: number;
}
