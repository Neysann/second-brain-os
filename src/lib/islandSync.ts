'use client';

import { PomodoroSyncState } from '@/types/island';

export const POMODORO_STORAGE_KEY = 'syntropy_pomodoro_state';
export const SYNTROPY_SYNC_CHANNEL = 'syntropy_sync';

export type SyntropySyncMessage =
  | { type: 'pomodoro-sync'; state: PomodoroSyncState; senderId: string }
  | { type: 'data-updated'; scope: 'tasks' | 'notes' | 'habits' | 'reading' | 'settings'; senderId: string };

let instanceSenderId = '';
function getSenderId(): string {
  if (!instanceSenderId) {
    instanceSenderId = 'win-' + Math.random().toString(36).slice(2, 9);
  }
  return instanceSenderId;
}

export function loadPomodoroSyncState(defaultFocusMins = 25): PomodoroSyncState {
  if (typeof window === 'undefined') {
    return {
      mode: 'focus',
      timeLeft: defaultFocusMins * 60,
      totalTime: defaultFocusMins * 60,
      isRunning: false,
      completedSessions: 0,
      updatedAt: Date.now(),
    };
  }
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PomodoroSyncState;
      if (parsed && typeof parsed.timeLeft === 'number') {
        if (parsed.isRunning && parsed.updatedAt) {
          const elapsedSec = Math.floor((Date.now() - parsed.updatedAt) / 1000);
          const adjusted = Math.max(0, parsed.timeLeft - Math.max(0, elapsedSec));
          return {
            ...parsed,
            timeLeft: adjusted,
            isRunning: adjusted > 0 ? parsed.isRunning : false,
          };
        }
        return parsed;
      }
    }
  } catch {}

  const savedCompleted = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem('syntropy_pomodoro_completed_today') || '0', 10) || 0
    : 0;

  return {
    mode: 'focus',
    timeLeft: defaultFocusMins * 60,
    totalTime: defaultFocusMins * 60,
    isRunning: false,
    completedSessions: savedCompleted,
    updatedAt: Date.now(),
  };
}

export function broadcastPomodoroState(state: Omit<PomodoroSyncState, 'updatedAt'>): void {
  if (typeof window === 'undefined') return;
  const fullState: PomodoroSyncState = {
    ...state,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(fullState));
    localStorage.setItem('syntropy_pomodoro_completed_today', String(fullState.completedSessions));
  } catch {}

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(SYNTROPY_SYNC_CHANNEL);
      const msg: SyntropySyncMessage = {
        type: 'pomodoro-sync',
        state: fullState,
        senderId: getSenderId(),
      };
      bc.postMessage(msg);
      bc.close();
    }
  } catch {}
}

export function broadcastDataUpdate(
  scope: 'tasks' | 'notes' | 'habits' | 'reading' | 'settings'
): void {
  if (typeof window === 'undefined') return;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(SYNTROPY_SYNC_CHANNEL);
      const msg: SyntropySyncMessage = {
        type: 'data-updated',
        scope,
        senderId: getSenderId(),
      };
      bc.postMessage(msg);
      bc.close();
    }
  } catch {}
}

export function subscribeSyntropySync(
  onMessage: (msg: SyntropySyncMessage) => void
): () => void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {};
  }
  const myId = getSenderId();
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(SYNTROPY_SYNC_CHANNEL);
    bc.onmessage = (ev: MessageEvent<SyntropySyncMessage>) => {
      if (!ev.data || ev.data.senderId === myId) return;
      onMessage(ev.data);
    };
  } catch {}

  return () => {
    try {
      bc?.close();
    } catch {}
  };
}
