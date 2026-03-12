'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { User } from '@/types';
import { format } from 'date-fns';

interface EventFormProps {
  users: User[];
  onSubmit: (data: {
    title: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    all_day: boolean;
    recurrence: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    userIds: string[];
  }) => void;
  onClose: () => void;
  initialDate?: Date;
}

export function EventForm({ users, onSubmit, onClose, initialDate }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(initialDate || new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  type Recurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

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
      userIds: selectedUserIds,
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
        className="bg-bg-card w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-text-primary">New Event</h2>
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

          {/* Date */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-body focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
          />

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

          {/* Time fields */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-body text-text-muted mb-1">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-body text-text-muted mb-1">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
                />
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

          {/* Assign to users */}
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

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 rounded-2xl bg-accent-primary text-white font-body font-semibold text-lg shadow-lg hover:shadow-xl transition-all min-h-[56px]"
          >
            Create Event
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
