/**
 * Service de géocodage et de recherche de villes mondiales
 * Utilise l'API gratuite Open-Meteo Geocoding (aucune clé d'API requise, illimité)
 */

export interface CityResult {
  id: string | number;
  name: string;
  country: string;
  countryCode?: string;
  admin1?: string; // Région / État
  latitude: number;
  longitude: number;
  timezone: string;
  flag?: string;
}

export const POPULAR_CITIES: CityResult[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
    flag: '🇫🇷',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japon',
    countryCode: 'JP',
    latitude: 35.6895,
    longitude: 139.6917,
    timezone: 'Asia/Tokyo',
    flag: '🇯🇵',
  },
  {
    id: 'new_york',
    name: 'New York',
    country: 'États-Unis',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
    flag: '🇺🇸',
  },
  {
    id: 'london',
    name: 'Londres',
    country: 'Royaume-Uni',
    countryCode: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    flag: '🇬🇧',
  },
  {
    id: 'dubai',
    name: 'Dubaï',
    country: 'Émirats arabes unis',
    countryCode: 'AE',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
    flag: '🇦🇪',
  },
  {
    id: 'san_francisco',
    name: 'San Francisco',
    country: 'États-Unis',
    countryCode: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    flag: '🇺🇸',
  },
  {
    id: 'singapore',
    name: 'Singapour',
    country: 'Singapour',
    countryCode: 'SG',
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: 'Asia/Singapore',
    flag: '🇸🇬',
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australie',
    countryCode: 'AU',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
    flag: '🇦🇺',
  },
  {
    id: 'montreal',
    name: 'Montréal',
    country: 'Canada',
    countryCode: 'CA',
    latitude: 45.5017,
    longitude: -73.5673,
    timezone: 'America/Toronto',
    flag: '🇨🇦',
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Allemagne',
    countryCode: 'DE',
    latitude: 52.52,
    longitude: 13.405,
    timezone: 'Europe/Berlin',
    flag: '🇩🇪',
  },
  {
    id: 'madrid',
    name: 'Madrid',
    country: 'Espagne',
    countryCode: 'ES',
    latitude: 40.4168,
    longitude: -3.7038,
    timezone: 'Europe/Madrid',
    flag: '🇪🇸',
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italie',
    countryCode: 'IT',
    latitude: 41.9028,
    longitude: 12.4964,
    timezone: 'Europe/Rome',
    flag: '🇮🇹',
  },
];

/**
 * Convertit un code pays ISO (ex: FR, US) en émoji drapeau
 */
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Recherche dynamique de villes mondiales via Open-Meteo
 */
export async function searchCities(query: string): Promise<CityResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return POPULAR_CITIES;

  // Filtrer d'abord parmi les métropoles populaires en local pour un affichage instantané
  const localMatches = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(cleanQuery.toLowerCase())
  );

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cleanQuery
      )}&count=8&language=fr&format=json`
    );

    if (!res.ok) return localMatches;

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return localMatches;
    }

    const apiResults: CityResult[] = data.results.map((r: any) => ({
      id: r.id || `${r.latitude}_${r.longitude}`,
      name: r.name,
      country: r.country || '',
      countryCode: r.country_code,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || 'UTC',
      flag: getCountryFlag(r.country_code),
    }));

    // Fusionner en évitant les doublons
    const combined = [...apiResults];
    for (const loc of localMatches) {
      if (!combined.some((c) => c.name.toLowerCase() === loc.name.toLowerCase())) {
        combined.push(loc);
      }
    }

    return combined;
  } catch (err) {
    console.warn('Erreur API géocodage Open-Meteo, utilisation des villes locales:', err);
    return localMatches;
  }
}
