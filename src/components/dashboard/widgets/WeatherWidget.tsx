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
  Thermometer,
  Compass,
} from 'lucide-react';
import { WidgetSize } from '@/types/dashboard';

interface WeatherData {
  temp: number;
  condition: string;
  minTemp: number;
  maxTemp: number;
  city: string;
  code: number;
}

interface WeatherWidgetProps {
  size?: WidgetSize;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ size = 'small' }) => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 18,
    condition: 'Ensoleillé',
    minTemp: 10,
    maxTemp: 19,
    city: 'Paris, France',
    code: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis'
        );
        if (res.ok) {
          const data = await res.json();
          const currentTemp = Math.round(data.current?.temperature_2m ?? 18);
          const max = Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp + 2);
          const min = Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp - 5);
          const code = data.current?.weather_code ?? 1;

          let condText = 'Ciel dégagé';
          if (code >= 1 && code <= 3) condText = 'Nuages épars';
          else if (code >= 45 && code <= 48) condText = 'Brouillard';
          else if (code >= 51 && code <= 67) condText = 'Pluie légère';
          else if (code >= 71 && code <= 77) condText = 'Neige';
          else if (code >= 80 && code <= 82) condText = 'Averses';
          else if (code >= 95) condText = 'Orage';

          setWeather({
            temp: currentTemp,
            condition: condText,
            minTemp: min,
            maxTemp: max,
            city: 'Paris, France',
            code,
          });
        }
      } catch (err) {
        console.warn('Erreur météo Open-Meteo, utilisation des valeurs par défaut', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderWeatherIcon = (code = weather.code, className = 'w-9 h-9') => {
    if (code === 0) return <Sun className={`${className} text-amber-400 drop-shadow-md animate-spin-slow`} />;
    if (code >= 1 && code <= 3) return <CloudSun className={`${className} text-amber-300 drop-shadow-md`} />;
    if ((code >= 51 && code <= 67) || code >= 80) return <CloudRain className={`${className} text-blue-400 drop-shadow-md`} />;
    if (code >= 71 && code <= 77) return <Snowflake className={`${className} text-sky-300 drop-shadow-md`} />;
    return <Cloud className={`${className} text-zinc-300 drop-shadow-md`} />;
  };

  // Heures simulées prévision OneUI
  const hourlyForecast = [
    { hour: 'Maintenant', temp: weather.temp, iconCode: weather.code },
    { hour: '+1h', temp: weather.temp + 1, iconCode: 0 },
    { hour: '+2h', temp: weather.temp, iconCode: 2 },
    { hour: '+3h', temp: weather.temp - 1, iconCode: 2 },
  ];

  // Si taille Medium ou Large : Mode Prévisions OneUI Samsung
  if (size === 'medium' || size === 'large') {
    return (
      <div className="flex flex-col h-full justify-between p-3.5 select-none animate-in fade-in duration-200">
        {/* En-tête OneUI */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <CloudSun className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">Météo Détaillée & Prévisions</span>
          </div>
          <span className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800">
            <MapPin className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
            {weather.city}
          </span>
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
                  (Ressenti {weather.temp - 1}°)
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

          {/* Bloc Droit : Prévisions 4 Heures (Samsung OneUI Hourly) */}
          <div className="p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col justify-between shadow-2xs">
            <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Prévisions prochaines heures
            </div>
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
          </div>
        </div>

        {/* Pied OneUI : Conditions Environnementales */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-sky-500 dark:text-sky-400" />
            <span>Vent : 14 km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-500 dark:text-blue-400" />
            <span>Humidité : 58%</span>
          </div>
          <div className="flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Indice UV : 3 (Modéré)</span>
          </div>
        </div>
      </div>
    );
  }

  // Si taille Small (Carré classique)
  return (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* En-tête */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <CloudSun className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          Météo
        </span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
          Paris
        </span>
      </div>

      {/* Centre : Icône et Température */}
      <div className="flex items-center justify-center gap-3 my-auto">
        <div className="relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          {renderWeatherIcon()}
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">
            {weather.temp}°
          </span>
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
