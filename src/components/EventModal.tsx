'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Tag, Trash2, AlignLeft, Check } from 'lucide-react';
import { CalendarEvent, ParaCategory } from '@/types';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  defaultDate?: string; // YYYY-MM-DD
}

const COLOR_PRESETS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Bleu', value: '#3b82f6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Émeraude', value: '#10b981' },
  { label: 'Ambre', value: '#f59e0b' },
  { label: 'Rose', value: '#ec4899' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Rouge', value: '#ef4444' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  defaultDate,
}) => {
  const { addEvent, updateEvent, deleteEvent } = useData();
  const { theme } = useTheme();

  const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState('#6366f1');
  const [category, setCategory] = useState<ParaCategory | 'event'>('event');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');
      setColor(eventToEdit.color || '#6366f1');
      setCategory(eventToEdit.category || 'event');
      setAllDay(eventToEdit.allDay ?? true);

      if (eventToEdit.startDate.includes('T')) {
        const [d, t] = eventToEdit.startDate.split('T');
        setStartDate(d);
        setStartTime(t.substring(0, 5));
      } else {
        setStartDate(eventToEdit.startDate);
        setStartTime('09:00');
      }

      if (eventToEdit.endDate) {
        if (eventToEdit.endDate.includes('T')) {
          const [d, t] = eventToEdit.endDate.split('T');
          setEndDate(d);
          setEndTime(t.substring(0, 5));
        } else {
          setEndDate(eventToEdit.endDate);
          setEndTime('10:00');
        }
      } else {
        setEndDate(eventToEdit.startDate.split('T')[0]);
        setEndTime('10:00');
      }
    } else {
      const initialDate = defaultDate || getTodayStr();
      setTitle('');
      setDescription('');
      setLocation('');
      setAllDay(true);
      setStartDate(initialDate);
      setStartTime('09:00');
      setEndDate(initialDate);
      setEndTime('10:00');
      setColor('#6366f1');
      setCategory('event');
    }
  }, [eventToEdit, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setIsSubmitting(true);

    try {
      const fullStartDate = allDay ? startDate : `${startDate}T${startTime}`;
      const finalEndDate = endDate || startDate;
      const fullEndDate = allDay ? finalEndDate : `${finalEndDate}T${endTime}`;

      if (eventToEdit) {
        await updateEvent({
          ...eventToEdit,
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startDate: fullStartDate,
          endDate: fullEndDate,
          allDay,
          color,
          category,
        });
      } else {
        await addEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startDate: fullStartDate,
          endDate: fullEndDate,
          allDay,
          color,
          category,
          source: 'manual',
        });
      }
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'événement :', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit) return;
    if (confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      await deleteEvent(eventToEdit.id);
      onClose();
    }
  };

  const inputClasses = `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
    theme === 'dark'
      ? 'border-zinc-700/80 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-500'
      : 'border-zinc-300 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 uppercase tracking-wider ${
    theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden
          ${
            theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-zinc-950/80'
              : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-base font-semibold">
              {eventToEdit ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Titre */}
          <div>
            <label className={labelClasses}>Titre de l'événement *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Rendez-vous client, Anniversaire, Séance sport..."
              className={inputClasses}
              autoFocus
            />
          </div>

          {/* Option Journée entière */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">Toute la journée</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Dates et Heures */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Date de début *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || e.target.value > endDate) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className={inputClasses}
                />
              </div>

              {!allDay ? (
                <div>
                  <label className={labelClasses}>Heure de début</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              ) : (
                <div>
                  <label className={labelClasses}>Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              )}
            </div>

            {!allDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Heure de fin</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lieu */}
          <div>
            <label className={labelClasses}>Lieu / Visioconférence</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Bureau, Zoom, Paris..."
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>

          {/* Palette de couleurs */}
          <div>
            <label className={labelClasses}>Couleur du marqueur</label>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = color === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setColor(preset.value)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-sm'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.value }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClasses}>Description / Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails, ordre du jour, contacts ou liens..."
              className={`${inputClasses} resize-none`}
            />
          </div>

          {/* Actions & Boutons */}
          <div className="flex items-center justify-between pt-4 border-t border-inherit">
            {eventToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                    : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Enregistrement...</span>
                ) : (
                  <span>{eventToEdit ? 'Enregistrer' : 'Créer l\'événement'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
