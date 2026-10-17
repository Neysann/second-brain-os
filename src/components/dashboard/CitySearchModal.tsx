'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Globe, Sparkles, Loader2, Check } from 'lucide-react';
import { CityResult, searchCities, POPULAR_CITIES } from '@/lib/geocoding';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: CityResult) => void;
  title?: string;
  currentCityName?: string;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  title = 'Choisir une Ville dans le Monde',
  currentCityName,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>(POPULAR_CITIES);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(POPULAR_CITIES);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(POPULAR_CITIES);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchCities(query);
        setResults(found);
      } catch (err) {
        console.error('Erreur recherche ville:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Recherche mondiale illimitée (Open-Meteo)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Champ de recherche */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tapez le nom d'une ville (ex: Marseille, Tokyo, Sydney)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 border border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden transition-all shadow-inner"
            />
            {isLoading ? (
              <Loader2 className="w-4 h-4 absolute right-3 text-purple-500 animate-spin" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Raccourcis villes populaires */}
          {!query && (
            <div className="mt-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Grandes métropoles
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-thin">
                {POPULAR_CITIES.slice(0, 8).map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      onSelectCity(city);
                      onClose();
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentCityName?.toLowerCase().includes(city.name.toLowerCase())
                        ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>{city.flag || '🌐'}</span>
                    <span className="font-medium">{city.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Liste des résultats */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin min-h-[220px]">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <MapPin className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Aucune ville trouvée pour « {query} »
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Essayez d'écrire le nom en français ou en anglais
              </p>
            </div>
          ) : (
            results.map((city) => {
              const isSelected = currentCityName
                ? currentCityName.toLowerCase().includes(city.name.toLowerCase())
                : false;

              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all group cursor-pointer ${
                    isSelected
                      ? 'bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{city.flag || '🌐'}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                        <span>{city.name}</span>
                        {city.admin1 && (
                          <span className="text-[10px] font-normal text-zinc-400 truncate">
                            ({city.admin1})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-2">
                        <span>{city.country}</span>
                        <span>•</span>
                        <span className="font-mono">{city.timezone}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CitySearchModal;
