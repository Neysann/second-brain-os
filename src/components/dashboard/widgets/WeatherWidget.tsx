'use client';

import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Sun,
  CloudRain,
  Cloud,
  Snowflake,
  Wind,
  MapPin,
  Droplets,
  Settings,
} from 'lucide-react';
import { WidgetSize, WeatherWidgetSettings } from '@/types/dashboard';

interface HourlyForecastItem {
  hour: string;
  temp: number;
  iconCode: number;
}

interface WeatherData {
  temp: number;
  condition: string;
  minTemp: number;
  maxTemp: number;
  city: string;
  code: number;
  windSpeed?: number;
  humidity?: number;
  hourly?: HourlyForecastItem[];
}

interface WeatherWidgetProps {
  size?: WidgetSize;
  settings?: WeatherWidgetSettings;
  onOpenSettings?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  size = 'small',
  settings,
  onOpenSettings,
}) => {
  const city = settings?.city || 'Paris, France';
  const latitude = settings?.latitude ?? 48.8566;
  const longitude = settings?.longitude ?? 2.3522;
  const timezone = settings?.timezone || 'Europe/Paris';
  const tempUnit = settings?.temperatureUnit || 'celsius';
  const windUnit = settings?.windSpeedUnit || 'kmh';
  const showWind = settings?.showWind ?? true;
  const showHumidity = settings?.showHumidity ?? true;
  const showHourly = settings?.showHourlyForecast ?? true;

  const [weather, setWeather] = useState<WeatherData>({
    temp: tempUnit === 'fahrenheit' ? 65 : 18,
    condition: 'Ensoleillé',
    minTemp: tempUnit === 'fahrenheit' ? 50 : 10,
    maxTemp: tempUnit === 'fahrenheit' ? 68 : 19,
    city: city,
    code: 1,
    windSpeed: 14,
    humidity: 58,
    hourly: [
      { hour: 'Maintenant', temp: tempUnit === 'fahrenheit' ? 65 : 18, iconCode: 1 },
      { hour: '+1h', temp: tempUnit === 'fahrenheit' ? 66 : 19, iconCode: 0 },
      { hour: '+2h', temp: tempUnit === 'fahrenheit' ? 65 : 18, iconCode: 2 },
      { hour: '+3h', temp: tempUnit === 'fahrenheit' ? 63 : 17, iconCode: 2 },
    ],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        const tempUnitParam = tempUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
        const windUnitParam = windUnit === 'mph' ? '&wind_speed_unit=mph' : '';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(
          timezone
        )}${tempUnitParam}${windUnitParam}`;

        const res = await fetch(url);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          const currentTemp = Math.round(data.current?.temperature_2m ?? 18);
          const max = Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp + 2);
          const min = Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp - 5);
          const code = data.current?.weather_code ?? 1;
          const currentWind = Math.round(data.current?.wind_speed_10m ?? 12);
          const currentHumidity = Math.round(data.current?.relative_humidity_2m ?? 60);

          let condText = 'Ciel dégagé';
          if (code >= 1 && code <= 3) condText = 'Nuages épars';
          else if (code >= 45 && code <= 48) condText = 'Brouillard';
          else if (code >= 51 && code <= 67) condText = 'Pluie légère';
          else if (code >= 71 && code <= 77) condText = 'Neige';
          else if (code >= 80 && code <= 82) condText = 'Averses';
          else if (code >= 95) condText = 'Orage';

          // Calcul des 4 prochaines heures
          let computedHourly: HourlyForecastItem[] = [];
          if (data.hourly?.time && data.hourly?.temperature_2m) {
            const nowIso = new Date().toISOString().slice(0, 13);
            let startIndex = (data.hourly.time as string[]).findIndex((t) => t.startsWith(nowIso));
            if (startIndex === -1) startIndex = 0;

            computedHourly = [0, 1, 2, 3].map((offset, i) => {
              const idx = startIndex + offset;
              const tStr = data.hourly.time[idx];
              let label = 'Maintenant';
              if (i > 0 && tStr) {
                const hourPart = tStr.split('T')[1]?.slice(0, 5) || `+${i}h`;
                label = hourPart;
              }
              return {
                hour: label,
                temp: Math.round(data.hourly.temperature_2m[idx] ?? currentTemp),
                iconCode: data.hourly.weather_code?.[idx] ?? code,
              };
            });
          }

          setWeather({
            temp: currentTemp,
            condition: condText,
            minTemp: min,
            maxTemp: max,
            city: city,
            code,
            windSpeed: currentWind,
            humidity: currentHumidity,
            hourly: computedHourly.length > 0 ? computedHourly : undefined,
          });
        }
      } catch (err) {
        console.warn('Erreur météo Open-Meteo, utilisation des valeurs par défaut', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [latitude, longitude, timezone, tempUnit, windUnit, city]);

  const renderWeatherIcon = (code = weather.code, className = 'w-9 h-9') => {
    if (code === 0) return <Sun className={`${className} text-amber-400 drop-shadow-md animate-spin-slow`} />;
    if (code >= 1 && code <= 3) return <CloudSun className={`${className} text-amber-300 drop-shadow-md`} />;
    if ((code >= 51 && code <= 67) || code >= 80) return <CloudRain className={`${className} text-blue-400 drop-shadow-md`} />;
    if (code >= 71 && code <= 77) return <Snowflake className={`${className} text-sky-300 drop-shadow-md`} />;
    return <Cloud className={`${className} text-zinc-300 drop-shadow-md`} />;
  };

  const unitLabel = tempUnit === 'fahrenheit' ? '°F' : '°C';
  const windUnitLabel = windUnit === 'mph' ? 'mph' : 'km/h';

  const hourlyForecast = weather.hourly || [
    { hour: 'Maintenant', temp: weather.temp, iconCode: weather.code },
    { hour: '+1h', temp: weather.temp + 1, iconCode: 0 },
    { hour: '+2h', temp: weather.temp, iconCode: 2 },
    { hour: '+3h', temp: weather.temp - 1, iconCode: 2 },
  ];

  // Si taille Medium ou Large : Mode Prévisions OneUI Samsung
  if (size === 'medium' || size === 'large') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none animate-in fade-in duration-200 group/widget">
        {/* En-tête OneUI */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <CloudSun className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">Météo Détaillée & Prévisions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer group-hover/widget:border-purple-500/40"
              title="Changer de ville ou personnaliser"
            >
              <MapPin className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
              <span className="truncate max-w-[130px]">{weather.city}</span>
            </button>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1 rounded-lg text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-70 group-hover/widget:opacity-100 cursor-pointer"
                title="Options météo"
              >
                <Settings className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Corps central : Deux blocs OneUI */}
        <div className="grid grid-cols-2 gap-3 my-auto items-center">
          {/* Bloc Gauche : Actuel */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-zinc-800/80 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex-shrink-0">
              {renderWeatherIcon(weather.code, 'w-10 h-10')}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-zinc-900 dark:text-white tracking-tight">
                  {weather.temp}°
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                  ({unitLabel})
                </span>
              </div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                {weather.condition}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono mt-0.5">
                <span className="text-emerald-500 dark:text-emerald-400">↑ {weather.maxTemp}°</span>
                <span className="text-sky-500 dark:text-sky-400">↓ {weather.minTemp}°</span>
              </div>
            </div>
          </div>

          {/* Bloc Droit : Prévisions 4 Heures */}
          <div className="p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col justify-between shadow-2xs">
            <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>{showHourly ? 'Prévisions prochaines heures' : 'Conditions'}</span>
              {isLoading && <span className="text-[8px] text-purple-500 animate-pulse">Sync...</span>}
            </div>
            {showHourly ? (
              <div className="grid grid-cols-4 gap-1 text-center">
                {hourlyForecast.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 flex flex-col items-center gap-1 shadow-2xs"
                  >
                    <span className="text-[8px] text-zinc-500 dark:text-zinc-400 truncate w-full font-mono">
                      {slot.hour}
                    </span>
                    {renderWeatherIcon(slot.iconCode, 'w-4 h-4')}
                    <span className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200">
                      {slot.temp}°
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full gap-1.5 py-1">
                <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-sky-500" /> Vent
                  </span>
                  <span className="font-mono font-bold">{weather.windSpeed} {windUnitLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" /> Humidité
                  </span>
                  <span className="font-mono font-bold">{weather.humidity}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied OneUI : Conditions Environnementales */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
          {showWind && (
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span>Vent : {weather.windSpeed} {windUnitLabel}</span>
            </div>
          )}
          {showHumidity && (
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              <span>Humidité : {weather.humidity}%</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Indice UV : 3</span>
          </div>
        </div>
      </div>
    );
  }

  // Si taille Small (Carré classique)
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none group/widget">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <CloudSun className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Météo</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer truncate max-w-[90px]"
            title={`Changer de ville (${weather.city})`}
          >
            <MapPin className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{weather.city.split(',')[0]}</span>
          </button>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-0.5 rounded text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              title="Personnaliser la météo"
            >
              <Settings className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Centre : Icône et Température */}
      <div className="flex items-center justify-center gap-3 my-auto">
        <div className="relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          {renderWeatherIcon()}
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">
              {weather.temp}°
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">{unitLabel}</span>
          </div>
          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[90px]">
            {weather.condition}
          </span>
        </div>
      </div>

      {/* Bas : Localisation et Min/Max */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800/60">
        <span className="truncate max-w-[90px]">{weather.city}</span>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-emerald-500 dark:text-emerald-400">↑ {weather.maxTemp}°</span>
          <span className="text-sky-500 dark:text-sky-400">↓ {weather.minTemp}°</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
