'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [expandedDate, setExpandedDate] = useState<Date>(new Date());

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

  const expandedDayStr = format(expandedDate, 'yyyy-MM-dd');
  const expandedDayEvents = useMemo(
    () => filteredEvents.filter((e) => e.date === expandedDayStr).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [filteredEvents, expandedDayStr]
  );

  const handleDayClick = useCallback((day: Date) => {
    if (isSameDay(day, expandedDate)) {
      // Already expanded — on mobile we keep it, on desktop toggle could close but let's keep consistent: clicking same day is no-op
      return;
    }
    setExpandedDate(day);
  }, [expandedDate]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Split days into rows of 7 for desktop expanded panel insertion
  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  // Find which row contains the expanded date
  const expandedRowIndex = rows.findIndex(row => row.some(d => isSameDay(d, expandedDate)));

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-border border-b border-border">
       {dayNames.map((day) => (
         <div
           key={day}
           className="py-1 md:py-3 text-center font-body text-[9px] md:text-sm wall:text-base font-semibold text-text-secondary bg-bg-card"
         >
           <span className="md:hidden">{day.charAt(0)}</span>
           <span className="hidden md:inline">{day}</span>
         </div>
       ))}
     </div>

      {/* Day cells with expandable rows */}
      <div className="flex-1 flex flex-col bg-border gap-px">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-col">
            {/* The 7-day row */}
            <div className={`grid grid-cols-7 gap-px ${viewMode === 'month' ? '' : ''}`}>
              {row.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayEvents = filteredEvents.filter((e) => e.date === dayStr);
                const today = isToday(day);
                const isExpanded = isSameDay(day, expandedDate);

                return (
                  <div
                    key={dayStr}
                    onClick={() => handleDayClick(day)}
                    className={`
                      bg-bg-card p-0.5 md:p-2 wall:p-3 min-h-[56px] md:min-h-[80px] wall:min-h-[120px] overflow-hidden cursor-pointer
                      transition-colors duration-150
                      ${today && !isExpanded ? 'ring-2 ring-inset ring-accent-primary/30' : ''}
                      ${isExpanded ? 'ring-2 ring-inset ring-accent-primary/60 bg-accent-primary/5' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center md:items-start">
                      <div className={`
                        inline-flex items-center justify-center w-7 h-7 md:w-7 md:h-7 wall:w-9 wall:h-9 rounded-full mb-0 md:mb-1
                        font-body text-[11px] md:text-sm wall:text-base font-medium transition-colors
                        ${isExpanded ? 'bg-accent-primary text-white' : ''}
                        ${today && !isExpanded ? 'bg-accent-primary text-white' : ''}
                        ${!today && !isExpanded ? 'text-text-secondary' : ''}
                      `}>
                        {format(day, 'd')}
                      </div>

                      {/* Mobile: dots for events */}
                      <div className="flex gap-0.5 md:hidden mt-0.5">
                        {dayEvents.slice(0, 3).map((event) => {
                          const color = event.color || users.find(u => event.event_users?.some(eu => eu.user_id === u.id))?.avatar_color || 'var(--color-accent-primary)';
                          return <div key={event.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />;
                        })}
                        {dayEvents.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />}
                      </div>
                    </div>

                    {/* Desktop: event pills */}
                    <div className="hidden md:block space-y-1">
                      {dayEvents.slice(0, viewMode === 'month' ? 3 : 8).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          users={users}
                          compact
                          onClick={() => onEventClick?.(event)}
                          onDelete={onEventDelete ? () => onEventDelete(event.id) : undefined}
                          onEdit={onEventEdit}
                        />
                      ))}
                      {dayEvents.length > (viewMode === 'month' ? 3 : 8) && (
                        <p className="text-xs text-text-muted font-body pl-2">
                          +{dayEvents.length - (viewMode === 'month' ? 3 : 8)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expanded event panel — appears below the row containing the selected day */}
            <AnimatePresence mode="wait">
              {expandedRowIndex === rowIndex && (
                <motion.div
                  key={expandedDayStr}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden bg-bg-card border-t border-border"
                >
                  <div className="px-4 md:px-6 pt-3 pb-1">
                    <h3 className="font-display text-sm md:text-base wall:text-lg font-semibold text-text-primary">
                      {format(expandedDate, 'EEEE, MMMM d')}
                    </h3>
                  </div>
                  <div className="px-3 md:px-5 pb-3 md:pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {expandedDayEvents.length === 0 && (
                      <p className="text-text-muted font-body text-sm italic py-3 text-center col-span-full">No events</p>
                    )}
                    {expandedDayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        users={users}
                        onClick={() => onEventClick?.(event)}
                        onDelete={onEventDelete ? () => onEventDelete(event.id) : undefined}
                        onEdit={onEventEdit}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
