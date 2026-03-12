'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, isSameDay, isToday, addDays } from 'date-fns';
// motion/AnimatePresence removed — not currently used
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
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const days = useMemo(() => {
    if (viewMode === 'month') return getMonthDays(selectedDate);
    return getWeekDays(selectedDate);
  }, [selectedDate, viewMode]);

  // Mobile: today + next 4 days (5 total)
  const mobileDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => addDays(today, i));
  }, []);

  const filteredEvents = useMemo(() => {
    if (visibleUserIds.length === 0) return events;
    return events.filter((e) => {
      const eventUserIds = e.event_users?.map((eu) => eu.user_id) ?? [];
      return eventUserIds.some((uid) => visibleUserIds.includes(uid));
    });
  }, [events, visibleUserIds]);

  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const selectedDayEvents = useMemo(
    () => filteredEvents.filter((e) => e.date === selectedDayStr).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [filteredEvents, selectedDayStr]
  );

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDay(day);
  }, []);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Split days into rows of 7 for desktop
  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  // Label for selected day
  const getSelectedDayLabel = () => {
    if (isToday(selectedDay)) return 'Today';
    return format(selectedDay, 'EEEE, MMMM d');
  };

  // Helper: get event color
  const getEventColor = (event: CalendarEvent) =>
    event.color || users.find(u => event.event_users?.some(eu => eu.user_id === u.id))?.avatar_color || 'var(--color-accent-primary)';

  // Unified selected-day section (renders at all breakpoints below calendar)
  const selectedDaySection = (
    <div className="bg-bg-card flex-1 flex flex-col min-h-0">
      <div className="px-4 md:px-6 pt-5 pb-2">
        <h3 className="font-display text-lg lg:text-xl xl:text-2xl font-bold text-text-primary">
          {getSelectedDayLabel()}
        </h3>
      </div>
      <div
        className="flex-1 overflow-y-auto px-3 md:px-5 pb-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
          {selectedDayEvents.length === 0 && (
            <p className="text-text-muted font-body text-sm italic py-4 text-center col-span-full">No events</p>
          )}
          {selectedDayEvents.map((event) => (
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
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-bg-card">
      {/* ─── Mobile: Today + next 4 days ─── */}
      <div className="md:hidden flex flex-col h-full">
        {/* Day headers */}
        <div className="grid grid-cols-5 gap-px bg-border border-b border-border">
          {mobileDays.map((day) => (
            <div key={format(day, 'yyyy-MM-dd')} className="py-1.5 text-center font-body text-[10px] font-semibold text-text-secondary bg-bg-card">
              {format(day, 'EEE')}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-5 gap-px bg-border">
          {mobileDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayEvents = filteredEvents.filter((e) => e.date === dayStr);
            const today = isToday(day);
            const isSelected = isSameDay(day, selectedDay);

            return (
              <div
                key={dayStr}
                onClick={() => handleDayClick(day)}
                className={`
                  bg-bg-card p-1.5 min-h-[100px] cursor-pointer transition-colors duration-150
                  ${today && !isSelected ? 'ring-2 ring-inset ring-accent-primary/30' : ''}
                  ${isSelected ? 'ring-2 ring-inset ring-accent-primary/60 bg-accent-primary/5' : ''}
                `}
              >
                <div className="flex flex-col items-center">
                  <div className={`
                    inline-flex items-center justify-center w-8 h-8 rounded-full mb-1
                    font-body text-xs font-medium transition-colors
                    ${isSelected ? 'bg-accent-primary text-white' : ''}
                    ${today && !isSelected ? 'bg-accent-primary text-white' : ''}
                    ${!today && !isSelected ? 'text-text-secondary' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Colored event pills */}
                  <div className="flex flex-col gap-0.5 w-full mt-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="h-1.5 rounded-full w-full"
                        style={{ backgroundColor: getEventColor(event) }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[8px] text-text-muted text-center">+{dayEvents.length - 3}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected day section — mobile */}
        {selectedDaySection}
      </div>

      {/* ─── Desktop / Tablet: Full 7-day grid ─── */}
      <div className="hidden md:flex md:flex-col md:h-full">
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
        <div className="flex-1 flex flex-col bg-border gap-px">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-7 gap-px flex-1">
              {row.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayEvents = filteredEvents.filter((e) => e.date === dayStr);
                const today = isToday(day);
                const isSelected = isSameDay(day, selectedDay);

                return (
                  <div
                    key={dayStr}
                    onClick={() => handleDayClick(day)}
                    className={`
                      bg-bg-card p-2 wall:p-3 min-h-[80px] lg:min-h-[100px] wall:min-h-[120px] overflow-hidden cursor-pointer
                      transition-colors duration-150
                      ${today && !isSelected ? 'ring-2 ring-inset ring-accent-primary/30' : ''}
                      ${isSelected ? 'ring-2 ring-inset ring-accent-primary/60 bg-accent-primary/5' : ''}
                    `}
                  >
                    <div className="flex flex-col items-start">
                      <div className={`
                        inline-flex items-center justify-center w-7 h-7 wall:w-9 wall:h-9 rounded-full mb-1
                        font-body text-sm wall:text-base font-medium transition-colors
                        ${isSelected ? 'bg-accent-primary text-white' : ''}
                        ${today && !isSelected ? 'bg-accent-primary text-white' : ''}
                        ${!today && !isSelected ? 'text-text-secondary' : ''}
                      `}>
                        {format(day, 'd')}
                      </div>
                    </div>

                    {/* Desktop: event pills */}
                    <div className="space-y-1">
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
          ))}
        </div>

        {/* Selected day section — desktop/tablet */}
        {selectedDaySection}
      </div>
    </div>
  );
}
