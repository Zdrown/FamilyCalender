'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronUp, ChevronDown, Users, Calendar } from 'lucide-react';
import type { CalendarEvent, User } from '@/types';
import { format } from 'date-fns';

interface EventFormData {
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  recurrence: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  userIds: string[];
  isFamily: boolean;
  sendSms: boolean;
}

interface EventFormProps {
  users: User[];
  onSubmit: (data: EventFormData) => void;
  onClose: () => void;
  initialDate?: Date;
  editEvent?: CalendarEvent;
}

// ─── Custom Time Picker ───
function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  // Parse 24h time string to 12h components
  const parse12h = (time: string) => {
    if (!time) return { hour: 12, minute: 0, period: 'AM' as const };
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' as const : 'AM' as const;
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hour, minute: m, period };
  };

  const { hour, minute, period } = parse12h(value);

  const to24h = (h: number, m: number, p: 'AM' | 'PM') => {
    let h24 = h;
    if (p === 'AM' && h === 12) h24 = 0;
    else if (p === 'PM' && h !== 12) h24 = h + 12;
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const setHour = (h: number) => onChange(to24h(h, minute, period));
  const setMinute = (m: number) => onChange(to24h(hour, m, period));
  const togglePeriod = () => onChange(to24h(hour, minute, period === 'AM' ? 'PM' : 'AM'));

  const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-body text-text-muted">{label}</label>
      <div className="bg-bg-secondary rounded-xl border border-border p-3 space-y-3">
        {/* AM/PM toggle */}
        <div className="flex justify-center gap-1">
          <button
            type="button"
            onClick={() => period !== 'AM' && togglePeriod()}
            className={`px-5 py-2 rounded-lg font-body text-sm font-bold transition-all ${period === 'AM' ? 'bg-accent-primary text-white shadow-sm' : 'bg-bg-primary text-text-muted'}`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => period !== 'PM' && togglePeriod()}
            className={`px-5 py-2 rounded-lg font-body text-sm font-bold transition-all ${period === 'PM' ? 'bg-accent-primary text-white shadow-sm' : 'bg-bg-primary text-text-muted'}`}
          >
            PM
          </button>
        </div>

        {/* Hour selection */}
        <div>
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-1.5">Hour</p>
          <div className="grid grid-cols-6 gap-1">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHour(h)}
                className={`py-2 rounded-lg font-mono text-sm font-semibold transition-all ${hour === h ? 'bg-accent-primary text-white shadow-sm' : 'bg-bg-primary text-text-secondary hover:bg-bg-card'}`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Minute selection */}
        <div>
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-1.5">Minute</p>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinute(m)}
                className={`py-2 rounded-lg font-mono text-sm font-semibold transition-all ${minute === m ? 'bg-accent-primary text-white shadow-sm' : 'bg-bg-primary text-text-secondary hover:bg-bg-card'}`}
              >
                {String(m).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Current selection display */}
        <div className="text-center py-1">
          <span className="font-mono text-lg font-bold text-text-primary">
            {hour}:{String(minute).padStart(2, '0')} {period}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EventForm({ users, onSubmit, onClose, initialDate, editEvent }: EventFormProps) {
  const isEdit = !!editEvent;
  const [title, setTitle] = useState(editEvent?.title || '');
  const [date, setDate] = useState(editEvent?.date || format(initialDate || new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(editEvent?.start_time || '09:00');
  const [endTime, setEndTime] = useState(editEvent?.end_time || '10:00');
  const [allDay, setAllDay] = useState(editEvent?.all_day ?? false);
  type Recurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  const [recurrence, setRecurrence] = useState<Recurrence>(editEvent?.recurrence || 'none');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    editEvent?.event_users?.map((eu) => eu.user_id) || []
  );
  const [isFamily, setIsFamily] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDisplay = (time: string) => {
    if (!time) return 'Set time';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      date,
      start_time: allDay ? null : startTime || null,
      end_time: allDay ? null : endTime || null,
      all_day: allDay,
      recurrence,
      userIds: isFamily ? users.map((u) => u.id) : selectedUserIds,
      isFamily,
      sendSms,
    });
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 flex items-end md:items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-card w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5 md:p-6 shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-text-primary">
            {isEdit ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-secondary text-text-muted">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <input
            type="text"
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-body text-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            autoFocus
          />

          {/* Date (MM/DD/YYYY) */}
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-body flex items-center justify-between pointer-events-none">
              <span>{date ? format(new Date(date + 'T00:00:00'), 'MM/dd/yyyy') : 'Select date'}</span>
              <Calendar size={18} className="text-text-muted" />
            </div>
          </div>

          {/* All day toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-5 h-5 rounded accent-accent-primary"
            />
            <span className="font-body text-text-secondary">All day</span>
          </label>

          {/* Time fields - custom AM/PM picker */}
          {!allDay && (
            <div className="space-y-3">
              {/* Start time */}
              <div>
                <button
                  type="button"
                  onClick={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-body"
                >
                  <span className="text-xs text-text-muted">Start</span>
                  <span className="font-mono font-semibold">{formatDisplay(startTime)}</span>
                  {showStartPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showStartPicker && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                    <TimePicker value={startTime} onChange={setStartTime} label="" />
                  </motion.div>
                )}
              </div>

              {/* End time */}
              <div>
                <button
                  type="button"
                  onClick={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-body"
                >
                  <span className="text-xs text-text-muted">End</span>
                  <span className="font-mono font-semibold">{formatDisplay(endTime)}</span>
                  {showEndPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showEndPicker && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                    <TimePicker value={endTime} onChange={setEndTime} label="" />
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Recurrence */}
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-body focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
          >
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {/* Family tag */}
          <div>
            <label className="block text-xs font-body text-text-muted mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFamily(!isFamily)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-sm font-medium transition-all min-h-[44px]
                  ${isFamily
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                    : 'bg-bg-secondary text-text-secondary'}
                `}
              >
                <Users size={14} /> Family
              </motion.button>
            </div>
          </div>

          {/* Assign to users */}
          {!isFamily && (
            <div>
              <label className="block text-xs font-body text-text-muted mb-2">Assign to</label>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <motion.button
                    key={user.id}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleUser(user.id)}
                    className={`
                      px-4 py-2 rounded-full font-body text-sm font-medium transition-all min-h-[44px]
                      ${selectedUserIds.includes(user.id)
                        ? 'text-white shadow-sm'
                        : 'bg-bg-secondary text-text-secondary'}
                    `}
                    style={selectedUserIds.includes(user.id) ? { backgroundColor: user.avatar_color } : {}}
                  >
                    {user.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* SMS Notification Toggle */}
          {(isFamily || selectedUserIds.length > 0) && (
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-3 cursor-pointer px-4 py-3 rounded-xl bg-bg-secondary border border-border">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span className="font-body text-sm text-text-primary font-medium">Send text notification</span>
                </div>
                <div
                  onClick={() => setSendSms(!sendSms)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${sendSms ? 'bg-accent-primary' : 'bg-border'}`}
                >
                  <motion.div
                    animate={{ x: sendSms ? 20 : 2 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </div>
              </label>

              {/* Missing phone/carrier warnings */}
              {sendSms && (() => {
                const taggedUsers = isFamily ? users : users.filter(u => selectedUserIds.includes(u.id));
                const missingInfo = taggedUsers.filter(u => !u.phone_number || !u.carrier);
                if (missingInfo.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {missingInfo.map(u => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-body font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        title="Set up phone & carrier in Settings"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                        {u.name} — {!u.phone_number ? 'No phone' : 'No carrier'}
                      </span>
                    ))}
                    <span className="text-[10px] text-text-muted font-body">(Set up in Settings)</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 rounded-2xl bg-accent-primary text-white font-body font-semibold text-lg shadow-lg hover:shadow-xl transition-all min-h-[56px]"
          >
            {isEdit ? 'Save Changes' : 'Create Event'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
