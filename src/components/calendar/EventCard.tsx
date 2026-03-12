'use client';

import { motion } from 'framer-motion';
import { formatTime } from '@/lib/utils/dates';
import type { CalendarEvent, User } from '@/types';

interface EventCardProps {
  event: CalendarEvent;
  users: User[];
  compact?: boolean;
  onClick?: () => void;
}

export function EventCard({ event, users, compact, onClick }: EventCardProps) {
  const assignedUserIds = event.event_users?.map((eu) => eu.user_id) ?? [];
  const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));
  const eventColor = event.color || assignedUsers[0]?.avatar_color || 'var(--color-accent-primary)';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full text-left rounded-xl transition-all cursor-pointer
        ${compact ? 'px-3 py-2' : 'px-4 py-3'}
        bg-bg-card border border-border hover:shadow-md
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
    </motion.button>
  );
}
