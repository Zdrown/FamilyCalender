'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil } from 'lucide-react';
import { formatTime } from '@/lib/utils/dates';
import type { CalendarEvent, User } from '@/types';

interface EventCardProps {
  event: CalendarEvent;
  users: User[];
  compact?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, users, compact, onClick, onDelete, onEdit }: EventCardProps) {
  const assignedUserIds = event.event_users?.map((eu) => eu.user_id) ?? [];
  const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));
  const eventColor = event.color || assignedUsers[0]?.avatar_color || 'var(--color-accent-primary)';

  const [showActions, setShowActions] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      // Calculate position for fixed menu
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const menuWidth = 180;
        let left = rect.right - menuWidth;
        if (left < 8) left = 8;
        if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
        setMenuPos({ top: rect.bottom + 4, left });
      }
      setShowActions(true);
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

  // Portal-based menu for long-press actions
  const actionsMenu = showActions && typeof document !== 'undefined' ? createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998]" onClick={() => setShowActions(false)} />
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[9999] flex gap-1 bg-bg-card rounded-xl border border-border shadow-2xl p-1.5"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        {onEdit && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => { setShowActions(false); onEdit(event); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold text-accent-primary hover:bg-accent-primary/10 transition-colors"
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
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <div className="relative group" ref={cardRef}>
      {/* Mobile compact: tiny pill */}
      {compact && (
        <motion.div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          whileTap={{ scale: 0.96 }}
          className="md:hidden flex items-center gap-1 rounded-full px-1.5 py-0.5 cursor-pointer select-none truncate"
          style={{ backgroundColor: `${eventColor}22`, borderLeft: `3px solid ${eventColor}` }}
        >
          <span className="font-body text-[9px] font-semibold text-text-primary truncate leading-tight">
            {event.title.slice(0, 6)}{event.title.length > 6 ? '…' : ''}
          </span>
        </motion.div>
      )}

      {/* Desktop / non-compact: full card */}
      <motion.div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full text-left rounded-lg md:rounded-xl transition-all cursor-pointer select-none
          ${compact ? 'hidden md:block px-3 py-2' : 'px-3 py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4'}
          bg-bg-card border border-border hover:shadow-md
        `}
        style={{ borderLeftWidth: 4, borderLeftColor: eventColor }}
      >
        <div className={`flex items-center gap-2 ${compact ? 'hidden md:flex' : ''}`}>
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

        <p className={`font-body font-medium text-text-primary mt-0.5 md:mt-1 truncate ${compact ? 'text-[11px] md:text-sm' : 'text-sm md:text-base wall:text-xl'}`}>
          {event.title}
        </p>

        {!compact && event.end_time && event.start_time && (
          <p className="text-xs text-text-muted font-mono mt-0.5">
            {formatTime(event.start_time)} – {formatTime(event.end_time)}
          </p>
        )}
      </motion.div>

      {actionsMenu}
    </div>
  );
}
