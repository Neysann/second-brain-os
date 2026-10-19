/**
 * Utilitaires pour le parsing, l'export et la synchronisation iCalendar (.ics / RFC 5545)
 * Compatible Google Agenda, Apple Calendrier (iCloud), Outlook et fichiers .ics standards.
 */

import { CalendarEvent, Task } from '@/types';

/**
 * Nettoie et déplie les lignes RFC 5545 (Line Unfolding)
 */
function unfoldICalLines(raw: string): string[] {
  // Remplace les retours à la ligne suivis d'un espace ou d'une tabulation par une continuation directe
  const unfolded = raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  return unfolded.split(/\r\n|\n|\r/);
}

/**
 * Dé-échappe les caractères réservés iCalendar (\,, \n, \;, \\)
 */
function unescapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Échappe les caractères pour le format .ics
 */
function escapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Convertit une chaîne de date iCal (ex: 20261015, 20261015T140000Z) en format ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm)
 */
function parseICalDate(dateStr: string): { formatted: string; allDay: boolean } {
  const clean = dateStr.trim();

  // Format jour complet : YYYYMMDD (ex: 20261015)
  if (/^\d{8}$/.test(clean)) {
    const year = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    const day = clean.substring(6, 8);
    return { formatted: `${year}-${month}-${day}`, allDay: true };
  }

  // Format horodaté : YYYYMMDDTHHMMSS ou YYYYMMDDTHHMMSSZ
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (match) {
    const [, y, m, d, hh, mm, ss, isUtc] = match;
    if (isUtc) {
      // Date UTC -> conversion en Date locale pour conserver l'heure exacte de l'utilisateur
      const utcDate = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss));
      const year = utcDate.getFullYear();
      const month = String(utcDate.getMonth() + 1).padStart(2, '0');
      const day = String(utcDate.getDate()).padStart(2, '0');
      const hours = String(utcDate.getHours()).padStart(2, '0');
      const minutes = String(utcDate.getMinutes()).padStart(2, '0');
      return { formatted: `${year}-${month}-${day}T${hours}:${minutes}`, allDay: false };
    } else {
      // Date en fuseau local ou flottant
      return { formatted: `${y}-${m}-${d}T${hh}:${mm}`, allDay: false };
    }
  }

  // Fallback si déjà au format YYYY-MM-DD
  if (clean.includes('-')) {
    return { formatted: clean.substring(0, 16), allDay: !clean.includes('T') };
  }

  const today = new Date().toISOString().split('T')[0];
  return { formatted: today, allDay: true };
}

/**
 * Parse un fichier ou flux iCalendar (.ics) en liste d'événements Syntropy
 */
export function parseICal(
  icsContent: string,
  source: 'ical' | 'google' = 'ical'
): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] {
  if (!icsContent || !icsContent.includes('BEGIN:VCALENDAR')) {
    throw new Error("Le contenu fourni n'est pas un calendrier iCalendar (.ics) valide.");
  }

  const lines = unfoldICalLines(icsContent);
  const parsedEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  let inEvent = false;
  let currentEvent: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        source,
        category: 'event',
        color: source === 'google' ? '#06b6d4' : '#8b5cf6',
      };
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.title && currentEvent.startDate) {
        parsedEvents.push({
          title: currentEvent.title,
          description: currentEvent.description || '',
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate || currentEvent.startDate,
          allDay: currentEvent.allDay ?? true,
          location: currentEvent.location || '',
          color: currentEvent.color || (source === 'google' ? '#06b6d4' : '#8b5cf6'),
          category: 'event',
          source,
          externalId: currentEvent.externalId,
        });
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (!inEvent) continue;

    // Séparateur nom de propriété / valeur
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const propPart = line.substring(0, colonIndex);
    const valuePart = line.substring(colonIndex + 1);

    const propName = propPart.split(';')[0].toUpperCase();

    switch (propName) {
      case 'SUMMARY':
        currentEvent.title = unescapeICalText(valuePart) || 'Événement sans titre';
        break;

      case 'DESCRIPTION':
        currentEvent.description = unescapeICalText(valuePart);
        break;

      case 'LOCATION':
        currentEvent.location = unescapeICalText(valuePart);
        break;

      case 'UID':
        currentEvent.externalId = valuePart.trim();
        break;

      case 'DTSTART': {
        const { formatted, allDay } = parseICalDate(valuePart);
        currentEvent.startDate = formatted;
        currentEvent.allDay = allDay;
        break;
      }

      case 'DTEND': {
        const { formatted } = parseICalDate(valuePart);
        currentEvent.endDate = formatted;
        break;
      }

      case 'CATEGORIES': {
        const cat = unescapeICalText(valuePart).toLowerCase();
        if (cat.includes('project')) currentEvent.category = 'project';
        else if (cat.includes('area')) currentEvent.category = 'area';
        else if (cat.includes('resource')) currentEvent.category = 'resource';
        break;
      }

      default:
        break;
    }
  }

  return parsedEvents;
}

/**
 * Récupère le flux iCal depuis une URL (avec gestion CORS et proxy de secours pour Google Agenda / iCloud)
 */
export async function fetchICalFromUrl(rawUrl: string): Promise<string> {
  let url = rawUrl.trim();

  // Remplacement du protocole webcal:// par https://
  if (url.startsWith('webcal://')) {
    url = url.replace('webcal://', 'https://');
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error("L'URL doit commencer par https:// ou webcal://");
  }

  // Détection explicite des liens de partage web Google (qui ne sont pas des flux iCal)
  if (url.includes('calendar.google.com')) {
    if (url.includes('?cid=') || url.includes('&cid=') || url.includes('/calendar/u/') || url.includes('/embed?')) {
      if (!url.includes('/basic.ics')) {
        throw new Error(
          "Cette adresse est un lien de partage web Google Agenda (avec ?cid=...) et non un flux de données iCal. Dans Google Agenda, allez dans Paramètres > Intégrer le calendrier > copiez l'« Adresse secrète au format iCal » (qui se termine obligatoirement par /basic.ics)."
        );
      }
    }
  }

  // 0. Priorité native Electron : téléchargement direct via le processus principal Node.js (sans CORS, sans proxy)
  if (typeof window !== 'undefined' && (window as any).electronAPI?.fetchUrl) {
    try {
      const res = await (window as any).electronAPI.fetchUrl({
        url,
        headers: { Accept: 'text/calendar, text/plain, */*' },
      });
      if (res?.success && typeof res.data === 'string') {
        if (res.data.includes('BEGIN:VCALENDAR')) {
          return res.data;
        }
        if (res.data.includes('<html') || res.data.includes('<!DOCTYPE')) {
          throw new Error(
            "L'adresse renseignée a renvoyé une page HTML. Dans Google Agenda, assurez-vous de copier l'« Adresse secrète au format iCal » (qui se termine par /basic.ics) dans Paramètres > Intégrer le calendrier."
          );
        }
      } else if (res?.status === 404) {
        throw new Error(
          "Calendrier introuvable (Erreur 404). Si votre calendrier est privé, assurez-vous d'utiliser l'« Adresse secrète au format iCal » de Google Agenda (et non l'adresse publique)."
        );
      } else if (res?.error) {
        console.warn('[Syntropy Desktop] Échec du fetch natif:', res.error);
      }
    } catch (nativeErr: any) {
      if (nativeErr.message && !nativeErr.message.includes('fetch-url')) {
        throw nativeErr;
      }
    }
  }

  let receivedHtml = false;

  // 1. Tentative directe (navigateur)
  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'text/calendar, text/plain, */*' } });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('BEGIN:VCALENDAR')) {
        return text;
      }
      if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        receivedHtml = true;
      }
    }
  } catch {
    // Si la requête directe est bloquée par CORS (standard pour Google Agenda et Apple), bascule sur les proxies
  }

  // 2. Proxies de secours fiables pour contourner les restrictions CORS en mode web statique
  const rawProxies = [
    `https://corsproxy.org/?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of rawProxies) {
    try {
      const proxyRes = await fetch(proxyUrl, { headers: { Accept: 'text/calendar, text/plain, */*' } });
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        if (text.includes('BEGIN:VCALENDAR')) {
          return text;
        }
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          receivedHtml = true;
        }
      }
    } catch {}
  }

  // 3. Tentative JSON endpoint AllOrigins
  try {
    const jsonRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (jsonRes.ok) {
      const data = await jsonRes.json();
      if (data?.contents && typeof data.contents === 'string') {
        if (data.contents.includes('BEGIN:VCALENDAR')) {
          return data.contents;
        }
        if (data.contents.includes('<html') || data.contents.includes('<!DOCTYPE')) {
          receivedHtml = true;
        }
      }
    }
  } catch {}

  if (receivedHtml) {
    throw new Error(
      "L'adresse renseignée renvoie une page web HTML au lieu d'un fichier de calendrier iCal (.ics). Assurez-vous d'avoir copié une adresse se terminant par /basic.ics, ou glissez votre fichier .ics directement dans l'onglet Fichier .ics."
    );
  }

  throw new Error(
    "Impossible de récupérer le flux iCal en ligne (restrictions du fournisseur ou URL invalide). Astuce : vous pouvez aussi exporter votre fichier .ics depuis Google Agenda > Paramètres > Exporter et le glisser-déposer ici."
  );
}

/**
 * Exporte les événements et tâches Syntropy au format standard .ics pour Apple Calendrier / Google Agenda
 */
export function exportToICal(events: CalendarEvent[], tasks: Task[] = []): string {
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Syntropy//Syntropy Second Brain OS//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Syntropy OS',
    'X-WR-TIMEZONE:Europe/Paris',
  ];

  // 1. Ajout des événements
  events.forEach((ev) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.externalId || ev.id + '@syntropy.app'}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`SUMMARY:${escapeICalText(ev.title)}`);

    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeICalText(ev.description)}`);
    }

    if (ev.location) {
      lines.push(`LOCATION:${escapeICalText(ev.location)}`);
    }

    if (ev.allDay) {
      const startClean = ev.startDate.split('T')[0].replace(/-/g, '');
      lines.push(`DTSTART;VALUE=DATE:${startClean}`);
      if (ev.endDate) {
        const endClean = ev.endDate.split('T')[0].replace(/-/g, '');
        lines.push(`DTEND;VALUE=DATE:${endClean}`);
      }
    } else {
      const formatDT = (dt: string) => {
        const clean = dt.replace(/[-:]/g, '');
        return clean.length === 13 ? clean + '00' : clean;
      };
      lines.push(`DTSTART:${formatDT(ev.startDate)}`);
      if (ev.endDate) {
        lines.push(`DTEND:${formatDT(ev.endDate)}`);
      }
    }

    lines.push('END:VEVENT');
  });

  // 2. Ajout des tâches avec échéance
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:task-${t.id}@syntropy.app`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`SUMMARY:[Tâche] ${escapeICalText(t.title)}`);
    if (t.description) {
      lines.push(`DESCRIPTION:${escapeICalText(t.description)}`);
    }
    const cleanDate = t.dueDate.replace(/-/g, '');
    lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
    lines.push(`STATUS:${t.status === 'done' ? 'COMPLETED' : 'NEEDS-ACTION'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
