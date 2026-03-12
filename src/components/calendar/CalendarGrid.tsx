'use client';

import { useState, useMemo } from 'react';
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
  const [selectedMobileDate, setSelectedMobileDate] = useState<Date>(new Date());

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

  const selectedDayStr = format(selectedMobileDate, 'yyyy-MM-dd');
  const selectedDayEvents = useMemo(
    () => filteredEvents.filter((e) => e.date === selectedDayStr).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [filteredEvents, selectedDayStr]
  );

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

      {/* Day cells */}
      <div className={`grid grid-cols-7 gap-px bg-border flex-1 ${viewMode === 'month' ? 'auto-rows-fr' : ''}`}>
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayEvents = filteredEvents.filter((e) => e.date === dayStr);
          const today = isToday(day);
          const isSelected = isSameDay(day, selectedMobileDate);

          return (
            <div
              key={dayStr}
              onClick={() => setSelectedMobileDate(day)}
              className={`
                bg-bg-card p-0.5 md:p-2 wall:p-3 min-h-[56px] md:min-h-[80px] wall:min-h-[120px] overflow-hidden cursor-pointer md:cursor-default
                ${today && !isSelected ? 'ring-2 ring-inset ring-accent-primary/30' : ''}
              `}
            >
              <div className="flex flex-col items-center md:items-start">
                <div className={`
                  inline-flex items-center justify-center w-7 h-7 md:w-7 md:h-7 wall:w-9 wall:h-9 rounded-full mb-0 md:mb-1
                  font-body text-[11px] md:text-sm wall:text-base font-medium transition-colors
                  ${isSelected ? 'bg-accent-primary text-white md:bg-transparent md:text-text-secondary' : ''}
                  ${today && !isSelected ? 'bg-accent-primary text-white' : ''}
                  ${!today && !isSelected ? 'text-text-secondary' : ''}
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

      {/* Mobile day detail (iOS-style) */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDayStr}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-bg-card border-t border-border"
          >
            <div className="px-5 pt-4 pb-2">
              <h3 className="font-display text-base font-semibold text-text-primary">
                {format(selectedMobileDate, 'EEEE, MMMM d')}
              </h3>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {selectedDayEvents.length === 0 && (
                <p className="text-text-muted font-body text-sm italic py-3 text-center">No events</p>
              )}
              {selectedDayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  users={users}
                  onDelete={onEventDelete ? () => onEventDelete(event.id) : undefined}
                  onEdit={onEventEdit}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
