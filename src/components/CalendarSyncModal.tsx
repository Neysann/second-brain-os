'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  UploadCloud,
  RefreshCw,
  Globe,
  Download,
  Check,
  AlertCircle,
  ExternalLink,
  Trash2,
  FileText,
  Clock,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { parseICal, exportToICal } from '@/lib/icalParser';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'google' | 'file' | 'feeds' | 'export';

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    events,
    tasks,
    importEvents,
    icalFeeds,
    addICalFeed,
    deleteICalFeed,
    syncICalFeed,
    syncAllICalFeeds,
    deleteAllEvents,
  } = useData();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('google');

  // Google / Webcal URL Feed state
  const [feedUrl, setFeedUrl] = useState('');
  const [feedName, setFeedName] = useState('');
  const [feedColor, setFeedColor] = useState('#06b6d4');
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [syncingFeedId, setSyncingFeedId] = useState<string | null>(null);

  // File import state
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status message
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // 1. Gestion de l'import de fichier .ics
  const handleFileProcess = async (file: File) => {
    if (!file.name.endsWith('.ics') && !file.name.endsWith('.ical')) {
      setFileError('Veuillez sélectionner un fichier valide avec l\'extension .ics ou .ical');
      return;
    }

    setIsFileLoading(true);
    setFileError(null);
    setFileSuccess(null);

    try {
      const text = await file.text();
      const isGoogle = text.includes('Google Inc') || text.includes('google.com');
      const parsed = parseICal(text, isGoogle ? 'google' : 'ical');

      if (parsed.length === 0) {
        setFileError('Aucun événement trouvé dans ce fichier calendrier.');
        return;
      }

      const count = await importEvents(parsed);
      setFileSuccess(`${count} événement(s) importé(s) avec succès depuis "${file.name}" !`);
    } catch (err: any) {
      setFileError(err?.message || 'Erreur lors de la lecture du fichier .ics');
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // 2. Gestion de l'ajout d'un flux Google / iCal
  const handleAddFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;

    setIsAddingFeed(true);
    setGlobalMessage(null);

    try {
      const name = feedName.trim() || (feedUrl.includes('google') ? 'Google Agenda' : 'Mon Calendrier iCal');
      const created = await addICalFeed(name, feedUrl.trim(), feedColor);

      // Effectuer la première synchro
      const res = await syncICalFeed(created.id);
      if (res.success) {
        setGlobalMessage({
          type: 'success',
          text: `Flux connecté et ${res.count} événement(s) synchronisé(s) !`,
        });
      } else {
        setGlobalMessage({
          type: 'error',
          text: `Flux ajouté, mais synchronisation directe restreinte par CORS : ${res.error}. Vous pouvez aussi importer directement votre fichier .ics.`,
        });
      }

      setFeedUrl('');
      setFeedName('');
      setActiveTab('feeds');
    } catch (err: any) {
      setGlobalMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de la configuration du flux',
      });
    } finally {
      setIsAddingFeed(false);
    }
  };

  // 3. Synchronisation manuelle d'un flux existant
  const handleManualSync = async (feedId: string) => {
    setSyncingFeedId(feedId);
    setGlobalMessage(null);
    try {
      const res = await syncICalFeed(feedId);
      if (res.success) {
        setGlobalMessage({
          type: 'success',
          text: `${res.count} événement(s) mis à jour depuis le flux.`,
        });
      } else {
        setGlobalMessage({
          type: 'error',
          text: res.error || 'Échec de synchronisation.',
        });
      }
    } finally {
      setSyncingFeedId(null);
    }
  };

  // 4. Exportation .ics
  const handleExport = () => {
    try {
      const icsData = exportToICal(events, tasks);
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syntropy-calendar-${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur lors de l'export iCal :", err);
    }
  };

  const inputClasses = `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
    theme === 'dark'
      ? 'border-zinc-700/80 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-500'
      : 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden
          ${
            theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-zinc-950/80'
              : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Synchronisation Calendrier</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Google Agenda, Apple Calendrier & Fichiers iCal (.ics)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Alert */}
        {globalMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-start gap-2 border ${
              globalMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}
          >
            {globalMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{globalMessage.text}</div>
            <button onClick={() => setGlobalMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-inherit px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'google'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Google Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'file'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Fichier .ics</span>
          </button>

          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 relative ${
              activeTab === 'feeds'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Flux connectés ({icalFeeds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: GOOGLE AGENDA */}
          {activeTab === 'google' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 space-y-2.5">
                <div className="font-semibold flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Comment récupérer la bonne adresse dans Google Agenda :
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <li>
                    Ouvrez <strong>Google Agenda</strong> sur votre ordinateur, cliquez sur la roue crantée <strong>⚙️ &gt; Paramètres</strong> (ou sur les 3 points <strong>⋮</strong> à côté de votre calendrier &gt; <em>Paramètres et partage</em>).
                  </li>
                  <li>
                    Dans la colonne de gauche, sous <strong>Paramètres de mes agendas</strong>, cliquez sur votre nom ou votre calendrier.
                  </li>
                  <li>
                    Faites défiler la page vers le bas jusqu'à la section <strong>Intégrer le calendrier</strong> (située sous « Autorisations d'accès »).
                  </li>
                  <li>
                    Copiez l'<strong>Adresse secrète au format iCal</strong>.
                  </li>
                </ol>

                <div className="pt-1.5 border-t border-blue-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <span className="font-bold">✅ À COPIER :</span>
                    <p className="font-mono text-[10px] mt-0.5 break-all">
                      .../calendar/ical/.../private-.../<strong>basic.ics</strong>
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                    <span className="font-bold">❌ À NE PAS COPIER :</span>
                    <p className="font-mono text-[10px] mt-0.5 break-all">
                      .../calendar/u/0?cid=... (Lien de partage web)
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddFeedSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Adresse secrète iCal Google Agenda *
                  </label>
                  <input
                    type="url"
                    required
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics"
                    className={inputClasses}
                  />
                </div>

                {/* Détection en direct d'un lien web au lieu d'un flux iCal */}
                {feedUrl.includes('calendar.google.com') &&
                  (feedUrl.includes('?cid=') ||
                    feedUrl.includes('&cid=') ||
                    feedUrl.includes('/calendar/u/') ||
                    feedUrl.includes('/embed?')) &&
                  !feedUrl.includes('/basic.ics') && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-2 animate-in fade-in duration-200">
                      <div className="font-semibold flex items-center gap-1.5 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Attention : Lien de partage web détecté</span>
                      </div>
                      <p className="leading-relaxed">
                        L'adresse saisie (avec <code>?cid=...</code>) est un lien pour afficher l'agenda dans un navigateur web, et non le flux de données d'événements.
                      </p>
                      <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-950/40 text-[11px] space-y-1">
                        <p className="font-semibold text-amber-700 dark:text-amber-300">
                          👉 Pour obtenir l'adresse qui fonctionne :
                        </p>
                        <p>1. Allez dans Google Agenda &gt; ⚙️ Paramètres &gt; cliquez sur votre agenda à gauche.</p>
                        <p>2. Descendez jusqu'à la section <strong>Intégrer le calendrier</strong> (et non « Autorisations d'accès »).</p>
                        <p>3. Cliquez sur copier à côté de <strong>Adresse secrète au format iCal</strong> (se termine par <code>/basic.ics</code>).</p>
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Nom du calendrier
                    </label>
                    <input
                      type="text"
                      value={feedName}
                      onChange={(e) => setFeedName(e.target.value)}
                      placeholder="Ex: Mon Google Agenda"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Couleur d'affichage
                    </label>
                    <select
                      value={feedColor}
                      onChange={(e) => setFeedColor(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="#06b6d4">Cyan Google (#06b6d4)</option>
                      <option value="#3b82f6">Bleu (#3b82f6)</option>
                      <option value="#6366f1">Indigo (#6366f1)</option>
                      <option value="#10b981">Émeraude (#10b981)</option>
                      <option value="#f59e0b">Ambre (#f59e0b)</option>
                      <option value="#8b5cf6">Violet (#8b5cf6)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-zinc-400">
                    💡 Vous pouvez aussi exporter le fichier .ics depuis Google Agenda et le déposer dans l'onglet Fichier.
                  </span>

                  <button
                    type="submit"
                    disabled={isAddingFeed || !feedUrl.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isAddingFeed ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        <span>Connecter Google Agenda</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: FICHIER .ICS */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 bg-zinc-50/50 dark:bg-zinc-950/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".ics,.ical"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-3.5 rounded-full bg-indigo-500/10 text-indigo-500">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Glissez et déposez votre fichier <span className="text-indigo-500">.ics</span> ici
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      ou cliquez pour parcourir les dossiers de votre appareil
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">
                    Compatible Apple Calendrier, Google Agenda (.zip/.ics), Outlook
                  </span>
                </div>
              </div>

              {isFileLoading && (
                <div className="flex items-center justify-center gap-2 p-3 text-sm text-indigo-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Traitement et importation des événements...</span>
                </div>
              )}

              {fileError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}

              {fileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fileSuccess}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FLUX CONNECTÉS */}
          {activeTab === 'feeds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Vos abonnements iCal / Webcal
                </span>
                {icalFeeds.length > 0 && (
                  <button
                    onClick={() => syncAllICalFeeds()}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tout actualiser</span>
                  </button>
                )}
              </div>

              {icalFeeds.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
                  <Globe className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Aucun flux de calendrier connecté pour le moment
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Connectez une adresse Google Agenda ou un lien Webcal (.ics) pour activer la synchronisation automatique.
                  </p>
                  <button
                    onClick={() => setActiveTab('google')}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors"
                  >
                    <span>Ajouter un premier calendrier</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {icalFeeds.map((feed) => {
                    const isSyncing = syncingFeedId === feed.id;
                    return (
                      <div
                        key={feed.id}
                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: feed.color || '#3b82f6' }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold truncate">{feed.name}</h4>
                            <p className="text-xs text-zinc-400 truncate max-w-sm">{feed.url}</p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                              <span>
                                {feed.eventsCount !== undefined ? `${feed.eventsCount} événements` : 'En attente'}
                              </span>
                              {feed.lastSyncedAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(feed.lastSyncedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                              {feed.error && (
                                <span className="text-amber-500 font-medium" title={feed.error}>
                                  ⚠️ {feed.error.includes('?cid=') ? 'Lien web invalide' : 'Erreur synchro'}
                                </span>
                              )}
                            </div>
                            {feed.url.includes('?cid=') ? (
                              <p className="mt-1.5 text-[11px] text-amber-500/90 leading-tight">
                                ⚠️ C&apos;est un lien de partage web. Veuillez le supprimer et ajouter l&apos;« Adresse secrète au format iCal » (se terminant par <code>/basic.ics</code>).
                              </p>
                            ) : feed.error ? (
                              <p className="mt-1.5 text-[11px] text-amber-500/90 leading-tight">
                                {feed.error}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleManualSync(feed.id)}
                            disabled={isSyncing}
                            title="Synchroniser maintenant"
                            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-500' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Supprimer le flux "${feed.name}" ?`)) {
                                deleteICalFeed(feed.id);
                              }
                            }}
                            title="Supprimer ce flux"
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPORTER */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 space-y-2">
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Exporter vers vos applications préférées
                </div>
                <p>
                  Téléchargez l'intégralité de vos événements Syntropy ainsi que vos tâches ayant une date d'échéance au format standard <strong>.ics (RFC 5545)</strong>.
                </p>
                <p>
                  Ce fichier peut être importé instantanément dans Apple Calendrier (macOS / iOS), Google Agenda, Outlook ou Thunderbird.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div>
                  <h4 className="text-sm font-semibold">Calendrier Syntropy OS</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {events.length} événement(s) • {tasks.filter((t) => !!t.dueDate).length} tâche(s) planifiée(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le fichier .ics</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-inherit bg-zinc-50/50 dark:bg-zinc-950/40">
          {events.length > 0 ? (
            <button
              type="button"
              onClick={async () => {
                if (
                  confirm(
                    `Êtes-vous sûr de vouloir supprimer TOUS les événements du calendrier (${events.length} au total) ? Cette action est irréversible.`
                  )
                ) {
                  await deleteAllEvents();
                  setGlobalMessage({
                    type: 'success',
                    text: 'Tous les événements ont été supprimés avec succès.',
                  });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Supprimer tous les événements du calendrier"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer tous les événements ({events.length})</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
            }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
