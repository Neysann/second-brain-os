'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  AppSettings,
  ThemeSetting,
  ThemeMode,
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
} from '@/types';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'purple',
  darkBgStyle: 'zinc',
  neonIntensity: 'vibrant',
  typography: 'sans',
  density: 'comfortable',

  defaultEditorMode: 'write',
  defaultInkPaperColor: 'dark',
  showWordCount: true,
  autoSaveDelay: 2000,
  showBacklinks: true,

  startupView: '/',
  firstDayOfWeek: 'monday',
  hideEmptyParaCategories: false,
  defaultTaskPriority: 'medium',

  showSyncStatusBadge: true,

  greetingName: '',
  showQuotesWidget: false,
};

interface SettingsContextType {
  settings: AppSettings;
  effectiveTheme: ThemeMode;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateMultipleSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'syntropy_app_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // 1. Détection du thème système
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 2. Chargement initial depuis LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } else {
        // Migration depuis second_brain_theme si existant
        const oldTheme = localStorage.getItem('second_brain_theme');
        if (oldTheme === 'light' || oldTheme === 'dark') {
          setSettings((prev) => ({ ...prev, theme: oldTheme }));
        }
        const oldNeon = localStorage.getItem('syntropy_neon_intensity');
        if (oldNeon === 'vibrant' || oldNeon === 'subtle' || oldNeon === 'none') {
          setSettings((prev) => ({ ...prev, neonIntensity: oldNeon }));
        }
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des paramètres locaux:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 3. Synchronisation cloud avec Firebase (si l'utilisateur est connecté)
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) return;
    const firestore = db;

    const loadCloudSettings = async () => {
      try {
        const ref = doc(firestore, 'users', user.uid, 'settings', 'general');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const cloudData = snap.data() as Partial<AppSettings>;
          setSettings((prev) => {
            const merged = { ...prev, ...cloudData };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Impossible de charger les paramètres depuis Firestore:', err);
      }
    };

    loadCloudSettings();
  }, [user]);

  // 4. Calcul du thème effectif ('light' ou 'dark')
  const effectiveTheme: ThemeMode = useMemo(() => {
    if (settings.theme === 'auto') {
      return systemIsDark ? 'dark' : 'light';
    }
    return settings.theme;
  }, [settings.theme, systemIsDark]);

  // 5. Application des attributs DOM dynamiques
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    // A. Thème (dark / light)
    root.classList.remove('dark', 'light');
    body.classList.remove('dark', 'light');
    root.removeAttribute('data-theme');
    body.removeAttribute('data-theme');

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-color-mode', 'dark');
      root.setAttribute('data-theme', 'dark');
      body.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      body.classList.add('light');
      root.setAttribute('data-color-mode', 'light');
      root.setAttribute('data-theme', 'light');
      body.setAttribute('data-theme', 'light');
    }

    // B. Couleur d'accentuation
    const accent = settings.accentColor || 'purple';
    root.setAttribute('data-accent', accent);
    body.setAttribute('data-accent', accent);

    // C. Style de fond sombre (OLED vs Zinc)
    const isOled = effectiveTheme === 'dark' && settings.darkBgStyle === 'oled';
    if (isOled) {
      root.setAttribute('data-dark-bg', 'oled');
      body.setAttribute('data-dark-bg', 'oled');
      root.classList.add('oled');
      body.classList.add('oled');
    } else {
      root.setAttribute('data-dark-bg', 'zinc');
      body.setAttribute('data-dark-bg', 'zinc');
      root.classList.remove('oled');
      body.classList.remove('oled');
    }

    // D. Typographie
    const font = settings.typography || 'sans';
    root.setAttribute('data-font', font);
    body.setAttribute('data-font', font);

    // E. Densité d'affichage
    const density = settings.density || 'comfortable';
    root.setAttribute('data-density', density);
    body.setAttribute('data-density', density);

    // F. Intensité de l'effet néon & Luminescence (vibrant / subtle / none)
    const neon = settings.neonIntensity || 'vibrant';
    root.setAttribute('data-neon', neon);
    body.setAttribute('data-neon', neon);
    root.classList.remove('neon-vibrant', 'neon-subtle', 'neon-none');
    body.classList.remove('neon-vibrant', 'neon-subtle', 'neon-none');
    root.classList.add(`neon-${neon}`);
    body.classList.add(`neon-${neon}`);
  }, [effectiveTheme, settings.accentColor, settings.darkBgStyle, settings.neonIntensity, settings.typography, settings.density]);

  // 6. Sauvegarde des modifications
  const persistSettings = useCallback(
    async (newSettings: AppSettings) => {
      setSettings(newSettings);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        localStorage.setItem('second_brain_theme', newSettings.theme === 'auto' ? (systemIsDark ? 'dark' : 'light') : newSettings.theme);
        localStorage.setItem('syntropy_dark_bg_style', newSettings.darkBgStyle || 'zinc');
        localStorage.setItem('syntropy_neon_intensity', newSettings.neonIntensity || 'vibrant');

        // Sauvegarde Cloud Firestore si connecté
        if (user && isFirebaseConfigured && db) {
          const firestore = db;
          const ref = doc(firestore, 'users', user.uid, 'settings', 'general');
          await setDoc(ref, newSettings, { merge: true });
        }
      } catch (err) {
        console.error('Erreur lors de la sauvegarde des paramètres:', err);
      }
    },
    [user, systemIsDark]
  );

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      persistSettings({
        ...settings,
        [key]: value,
      });
    },
    [settings, persistSettings]
  );

  const updateMultipleSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      persistSettings({
        ...settings,
        ...partial,
      });
    },
    [settings, persistSettings]
  );

  const resetSettings = useCallback(() => {
    persistSettings(DEFAULT_SETTINGS);
  }, [persistSettings]);

  const toggleTheme = useCallback(() => {
    const cycle: ThemeSetting[] = ['dark', 'light'];
    const currentIndex = cycle.indexOf(effectiveTheme as ThemeSetting);
    const nextTheme = cycle[(currentIndex + 1) % cycle.length] || 'dark';
    updateSetting('theme', nextTheme);
  }, [effectiveTheme, updateSetting]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        effectiveTheme,
        updateSetting,
        updateMultipleSettings,
        resetSettings,
        toggleTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings doit être utilisé à l\'intérieur d\'un SettingsProvider');
  }
  return context;
};
