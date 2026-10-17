'use client';

import React, { useState } from 'react';
import {
  X,
  Settings,
  MapPin,
  Clock,
  CloudSun,
  Timer,
  FileText,
  CheckSquare,
  Music,
  Sliders,
  Check,
  Plus,
  Trash2,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { DashboardWidgetConfig } from '@/types/dashboard';
import { CitySearchModal } from './CitySearchModal';
import { CityResult } from '@/lib/geocoding';

interface WidgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: DashboardWidgetConfig | null;
  widgetConfig?: DashboardWidgetConfig | null;
  onSaveSettings: (widgetId: string, settings: Record<string, any>) => void;
}

export const WidgetSettingsModal: React.FC<WidgetSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  widgetConfig,
  onSaveSettings,
}) => {
  const activeConfig = config || widgetConfig;
  const [settings, setSettings] = useState<Record<string, any>>(() => activeConfig?.settings || {});
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [citySearchTarget, setCitySearchTarget] = useState<'weather' | 'clock_primary' | 'clock_secondary'>('weather');
  const [secondaryEditIndex, setSecondaryEditIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (activeConfig) {
      setSettings(activeConfig.settings || {});
    }
  }, [activeConfig]);

  const updateField = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (activeConfig) {
      onSaveSettings(activeConfig.id, settings);
    }
    onClose();
  };

  const handleCitySelected = (city: CityResult) => {
    if (citySearchTarget === 'weather') {
      setSettings((prev) => ({
        ...prev,
        city: `${city.name}, ${city.country}`,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
        flag: city.flag,
      }));
    } else if (citySearchTarget === 'clock_primary') {
      setSettings((prev) => ({
        ...prev,
        primaryCityName: city.name,
        primaryTimezone: city.timezone,
        primaryFlag: city.flag,
      }));
    } else if (citySearchTarget === 'clock_secondary') {
      const currentList = settings.secondaryCities || [
        { name: 'Tokyo', country: 'Japon', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
        { name: 'New York', country: 'États-Unis', timezone: 'America/New_York', flag: '🇺🇸' },
        { name: 'San Francisco', country: 'États-Unis', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
      ];
      const updated = [...currentList];
      const newCity = {
        name: city.name,
        country: city.country,
        timezone: city.timezone,
        flag: city.flag,
      };

      if (secondaryEditIndex !== null && secondaryEditIndex >= 0 && secondaryEditIndex < updated.length) {
        updated[secondaryEditIndex] = newCity;
      } else {
        updated.push(newCity);
      }
      setSettings((prev) => ({ ...prev, secondaryCities: updated }));
    }
  };

  const renderWeatherSettings = () => {
    const currentCity = settings.city || 'Paris, France';
    const tempUnit = settings.temperatureUnit || 'celsius';
    const windUnit = settings.windSpeedUnit || 'kmh';
    const showDetails = settings.showDetails !== false;
    const showHourly = settings.showHourly !== false;

    return (
      <div className="space-y-4">
        {/* Ville Météo */}
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Ville sélectionnée
          </label>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{settings.flag || '🇫🇷'}</span>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">{currentCity}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {settings.timezone || 'Europe/Paris'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCitySearchTarget('weather');
                setIsCitySearchOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Changer la ville</span>
            </button>
          </div>
        </div>

        {/* Unités de mesure */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Température
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => updateField('temperatureUnit', 'celsius')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tempUnit === 'celsius'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                °C (Celsius)
              </button>
              <button
                type="button"
                onClick={() => updateField('temperatureUnit', 'fahrenheit')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tempUnit === 'fahrenheit'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                °F (Fahrenheit)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Vent
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => updateField('windSpeedUnit', 'kmh')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  windUnit === 'kmh'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                km/h
              </button>
              <button
                type="button"
                onClick={() => updateField('windSpeedUnit', 'mph')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  windUnit === 'mph'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                mph
              </button>
            </div>
          </div>
        </div>

        {/* Détails visuels */}
        <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <span className="text-xs text-zinc-800 dark:text-zinc-200">
              Afficher le vent et l'humidité
            </span>
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(e) => updateField('showDetails', e.target.checked)}
              className="rounded-md border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <span className="text-xs text-zinc-800 dark:text-zinc-200">
              Afficher les prévisions par heure (format étendu)
            </span>
            <input
              type="checkbox"
              checked={showHourly}
              onChange={(e) => updateField('showHourly', e.target.checked)}
              className="rounded-md border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>
    );
  };

  const renderClockSettings = () => {
    const mode = settings.mode || 'dual';
    const showSeconds = settings.showSeconds !== false;
    const timeFormat = settings.timeFormat || '24h';
    const showWeek = settings.showWeekNumber !== false;
    const secondaryCities = settings.secondaryCities || [
      { name: 'Tokyo', country: 'Japon', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
      { name: 'New York', country: 'États-Unis', timezone: 'America/New_York', flag: '🇺🇸' },
      { name: 'San Francisco', country: 'États-Unis', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
    ];

    return (
      <div className="space-y-4">
        {/* Style d'Horloge */}
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Style du Cadran
          </label>
          <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => updateField('mode', 'dual')}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'dual'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              🌍 Double Fuseau
            </button>
            <button
              type="button"
              onClick={() => updateField('mode', 'analog')}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'analog'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              ⏱️ Analogique
            </button>
            <button
              type="button"
              onClick={() => updateField('mode', 'digital')}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'digital'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              🔢 Numérique
            </button>
          </div>
        </div>

        {/* Ville Principale (Horloge Locale) */}
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Fuseau Horaire Principal
          </label>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80">
            <div className="flex items-center gap-2">
              <span className="text-xl">{settings.primaryFlag || '🏠'}</span>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {settings.primaryCityName ? settings.primaryCityName : 'Heure Locale (Système)'}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {settings.primaryTimezone || 'Automatique'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {settings.primaryCityName && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('primaryCityName', undefined);
                    updateField('primaryTimezone', undefined);
                    updateField('primaryFlag', undefined);
                  }}
                  className="px-2 py-1 text-[11px] text-zinc-500 hover:text-rose-500 cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCitySearchTarget('clock_primary');
                  setIsCitySearchOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Villes Secondaires pour le mode Double Fuseau */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Villes Secondaires (Horloge Mondiale)
            </label>
            {secondaryCities.length < 5 && (
              <button
                type="button"
                onClick={() => {
                  setSecondaryEditIndex(null);
                  setCitySearchTarget('clock_secondary');
                  setIsCitySearchOpen(true);
                }}
                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Ajouter une ville
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {secondaryCities.map((city: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60"
              >
                <div className="flex items-center gap-2">
                  <span>{city.flag || '🌐'}</span>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {city.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">({city.timezone})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSecondaryEditIndex(idx);
                      setCitySearchTarget('clock_secondary');
                      setIsCitySearchOpen(true);
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
                    title="Changer cette ville"
                  >
                    <Sliders className="w-3 h-3" />
                  </button>
                  {secondaryCities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = secondaryCities.filter((_: any, i: number) => i !== idx);
                        updateField('secondaryCities', updated);
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Supprimer cette ville"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Options d'affichage */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-800 dark:text-zinc-200">Format d'heure</span>
            <div className="flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => updateField('timeFormat', '24h')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  timeFormat === '24h'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                24 Heures
              </button>
              <button
                type="button"
                onClick={() => updateField('timeFormat', '12h')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  timeFormat === '12h'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                12h (AM/PM)
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <span className="text-xs text-zinc-800 dark:text-zinc-200">Afficher les secondes</span>
            <input
              type="checkbox"
              checked={showSeconds}
              onChange={(e) => updateField('showSeconds', e.target.checked)}
              className="rounded-md border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <span className="text-xs text-zinc-800 dark:text-zinc-200">
              Afficher le numéro de semaine
            </span>
            <input
              type="checkbox"
              checked={showWeek}
              onChange={(e) => updateField('showWeekNumber', e.target.checked)}
              className="rounded-md border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>
    );
  };

  const renderFocusTimerSettings = () => {
    const focusDuration = settings.focusDuration || 25;
    const breakDuration = settings.breakDuration || 5;
    const soundEnabled = settings.soundEnabled !== false;

    return (
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Durée de Concentration (Focus)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 25, 45, 60].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => updateField('focusDuration', dur)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  focusDuration === dur
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
              >
                {dur} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Durée de la Pause
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => updateField('breakDuration', dur)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  breakDuration === dur
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
              >
                {dur} min
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <span className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-500" />
              Signal sonore discret à la fin du cycle
            </span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => updateField('soundEnabled', e.target.checked)}
              className="rounded-md border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>
    );
  };

  const renderQuickNotesSettings = () => {
    const themeColor = settings.themeColor || 'amber';
    const fontSize = settings.fontSize || 'medium';

    const colors = [
      { id: 'amber', name: 'Ambre classique', bg: 'bg-amber-500' },
      { id: 'purple', name: 'Violet Syntropy', bg: 'bg-purple-600' },
      { id: 'emerald', name: 'Vert Émeraude', bg: 'bg-emerald-500' },
      { id: 'cyan', name: 'Cyan Lagon', bg: 'bg-cyan-500' },
      { id: 'rose', name: 'Rose Doux', bg: 'bg-rose-500' },
      { id: 'dark', name: 'Sombre Épuré', bg: 'bg-zinc-800' },
    ];

    return (
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Nuance du Post-it & Accents
          </label>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => updateField('themeColor', c.id)}
                className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all cursor-pointer ${
                  themeColor === c.id
                    ? 'border-purple-500 bg-purple-500/10 shadow-xs ring-1 ring-purple-500'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0`} />
                <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Taille de Police des Notes
          </label>
          <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            {['small', 'medium', 'large'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateField('fontSize', s)}
                className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  fontSize === s
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {s === 'small' ? 'Petite' : s === 'medium' ? 'Normale' : 'Grande'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTodoListSettings = () => {
    const filter = settings.filter || 'all';
    const hideCompleted = settings.hideCompleted === true;
    const maxItems = settings.maxItems || 4;

    return (
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Filtre des Tâches Affichées
          </label>
          <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => updateField('filter', 'all')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => updateField('filter', 'urgent')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'urgent'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Urgentes
            </button>
            <button
              type="button"
              onClick={() => updateField('filter', 'high')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'high'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Haute priorité
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Nombre maximal de tâches visibles
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[3, 4, 6].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => updateField('maxItems', count)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  maxItems === count
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {count} tâches
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
            <span className="text-xs text-zinc-800 dark:text-zinc-200">
              Masquer les tâches terminées
            </span>
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => updateField('hideCompleted', e.target.checked)}
              className="rounded-md border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>
    );
  };

  const renderAudioPlayerSettings = () => {
    const defaultService = settings.defaultService || 'zen';
    const defaultZenSound = settings.defaultZenSound || 'rain';

    const sounds = [
      { id: 'rain', name: 'Pluie douce' },
      { id: 'waves', name: 'Vagues océan' },
      { id: 'cafe', name: 'Café cosy' },
      { id: 'alpha', name: 'Ondes Alpha 432Hz' },
      { id: 'fire', name: 'Feu crépitant' },
      { id: 'birds', name: 'Forêt & Oiseaux' },
    ];

    return (
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Service Favori par Défaut
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'zen', name: 'Ambiance Zen & Bruit Blanc' },
              { id: 'spotify', name: 'Spotify Web' },
              { id: 'deezer', name: 'Deezer' },
              { id: 'youtube', name: 'YouTube Audio' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => updateField('defaultService', s.id)}
                className={`p-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  defaultService === s.id
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Ambiance Zen Favorite
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sounds.map((sound) => (
              <button
                key={sound.id}
                type="button"
                onClick={() => updateField('defaultZenSound', sound.id)}
                className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  defaultZenSound === sound.id
                    ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {sound.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getWidgetTitle = () => {
    if (!activeConfig) return 'Options du Widget';
    switch (activeConfig.widgetId) {
      case 'weather':
        return 'Personnalisation Météo & Ville';
      case 'clock':
        return 'Personnalisation Horloge & Fuseaux';
      case 'focus_timer':
        return 'Réglages Minuteur Focus';
      case 'quick_notes':
        return 'Personnalisation Notes Rapides';
      case 'tasks':
        return 'Filtres de la To-Do List';
      case 'audio_player':
        return 'Préférences Lecteur Audio';
      default:
        return 'Options du Widget';
    }
  };

  if (!isOpen || !activeConfig) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {getWidgetTitle()}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Configurez vos préférences pour ce widget
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {activeConfig.widgetId === 'weather' && renderWeatherSettings()}
            {activeConfig.widgetId === 'clock' && renderClockSettings()}
            {activeConfig.widgetId === 'focus_timer' && renderFocusTimerSettings()}
            {activeConfig.widgetId === 'quick_notes' && renderQuickNotesSettings()}
            {activeConfig.widgetId === 'tasks' && renderTodoListSettings()}
            {activeConfig.widgetId === 'audio_player' && renderAudioPlayerSettings()}
            {![
              'weather',
              'clock',
              'focus_timer',
              'quick_notes',
              'tasks',
              'audio_player',
            ].includes(activeConfig.widgetId) && (
              <div className="text-center py-8 text-xs text-zinc-500">
                Ce widget ne dispose pas encore d'options spécifiques configurables.
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de recherche de ville */}
      <CitySearchModal
        isOpen={isCitySearchOpen}
        onClose={() => setIsCitySearchOpen(false)}
        onSelectCity={handleCitySelected}
        title={
          citySearchTarget === 'weather'
            ? 'Choisir la ville météo'
            : citySearchTarget === 'clock_primary'
            ? 'Choisir le fuseau principal'
            : 'Ajouter / modifier une ville mondiale'
        }
        currentCityName={
          citySearchTarget === 'weather'
            ? settings.city
            : citySearchTarget === 'clock_primary'
            ? settings.primaryCityName
            : undefined
        }
      />
    </>
  );
};

export default WidgetSettingsModal;
