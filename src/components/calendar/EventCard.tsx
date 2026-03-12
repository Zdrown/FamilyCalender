'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil } from 'lucide-react';
import { formatTime } from '@/lib/utils/dates';
import type { CalendarEvent, User } from '@/types';

interface EventCardProps {
  event: CalendarEvent;
  users: User[];
  compact?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventCard({ event, users, compact, onClick, onEdit, onDelete }: EventCardProps) {
  const assignedUserIds = event.event_users?.map((eu) => eu.user_id) ?? [];
  const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));
  const eventColor = event.color || assignedUsers[0]?.avatar_color || 'var(--color-accent-primary)';

  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowActions(true);
      // haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!didLongPress.current && onClick) {
      onClick();
    }
  }, [onClick]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <div className="relative">
      <motion.div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full text-left rounded-xl transition-all cursor-pointer select-none
          ${compact ? 'px-3 py-2' : 'px-4 py-3'}
          bg-bg-card border border-border hover:shadow-md
          ${showActions ? 'ring-2 ring-accent-primary/40' : ''}
        `}
        style={{ borderLeftWidth: 4, borderLeftColor: eventColor }}
      >
        <div className="flex items-center gap-2">
          {/* User dots */}
          <div className="flex -space-x-1">
            {assignedUsers.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: user.avatar_color }}
              />
            ))}
          </div>

          {/* Time */}
          {event.start_time && (
            <span className="font-mono text-xs text-text-muted">
              {formatTime(event.start_time)}
            </span>
          )}
          {event.all_day && (
            <span className="text-xs text-text-muted font-body">All Day</span>
          )}
        </div>

        <p className={`font-body font-medium text-text-primary mt-1 ${compact ? 'text-sm' : 'text-base wall:text-xl'}`}>
          {event.title}
        </p>

        {!compact && event.end_time && event.start_time && (
          <p className="text-xs text-text-muted font-mono mt-0.5">
            {formatTime(event.start_time)} – {formatTime(event.end_time)}
          </p>
        )}
      </motion.div>

      {/* Long-press action bar */}
      <AnimatePresence>
        {showActions && (
          <>
            {/* Backdrop to dismiss */}
            <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-2 top-full mt-1 z-50 flex gap-1 bg-bg-card rounded-xl border border-border shadow-xl p-1.5"
            >
              {onEdit && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => { setShowActions(false); onEdit(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  <Pencil size={14} /> Edit
                </motion.button>
              )}
              {onDelete && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => { setShowActions(false); onDelete(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold text-error hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </motion.button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
