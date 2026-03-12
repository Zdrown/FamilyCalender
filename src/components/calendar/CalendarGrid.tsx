'use client';

import { useMemo } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { getWeekDays, getMonthDays } from '@/lib/utils/dates';
import { EventCard } from './EventCard';
import type { CalendarEvent, User } from '@/types';
import { useAppStore } from '@/lib/store/appStore';

interface CalendarGridProps {
  events: CalendarEvent[];
  users: User[];
  onEventClick?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventEdit?: (event: CalendarEvent) => void;
}

export function CalendarGrid({ events, users, onEventClick, onEventDelete, onEventEdit }: CalendarGridProps) {
  const { selectedDate, viewMode, visibleUserIds } = useAppStore();

  const days = useMemo(() => {
    if (viewMode === 'month') return getMonthDays(selectedDate);
    return getWeekDays(selectedDate);
  }, [selectedDate, viewMode]);

  const filteredEvents = useMemo(() => {
    if (visibleUserIds.length === 0) return events;
    return events.filter((e) => {
      const eventUserIds = e.event_users?.map((eu) => eu.user_id) ?? [];
      return eventUserIds.some((uid) => visibleUserIds.includes(uid));
    });
  }, [events, visibleUserIds]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-border border-b border-border">
        {dayNames.map((day) => (
          <div
            key={day}
            className="py-3 text-center font-body text-sm wall:text-base font-semibold text-text-secondary bg-bg-card"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className={`grid grid-cols-7 gap-px bg-border flex-1 ${viewMode === 'month' ? 'auto-rows-fr' : ''}`}>
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayEvents = filteredEvents.filter((e) => e.date === dayStr);
          const today = isToday(day);

          return (
            <div
              key={dayStr}
              className={`
                bg-bg-card p-2 wall:p-3 min-h-[80px] wall:min-h-[120px] overflow-hidden
                ${today ? 'ring-2 ring-inset ring-accent-primary/30' : ''}
              `}
            >
              <div className={`
                inline-flex items-center justify-center w-7 h-7 wall:w-9 wall:h-9 rounded-full mb-1
                font-body text-sm wall:text-base font-medium
                ${today ? 'bg-accent-primary text-white' : 'text-text-secondary'}
              `}>
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, viewMode === 'month' ? 3 : 8).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    users={users}
                    compact={viewMode === 'month'}
                    onClick={() => onEventClick?.(event)}
                    onDelete={onEventDelete ? () => onEventDelete(event.id) : undefined}
                    onEdit={onEventEdit}
                  />
                ))}
                {dayEvents.length > (viewMode === 'month' ? 3 : 8) && (
                  <p className="text-xs text-text-muted font-body pl-2">
                    +{dayEvents.length - (viewMode === 'month' ? 3 : 8)} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
