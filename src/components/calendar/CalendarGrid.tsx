'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, isSameDay, isToday, getDay } from 'date-fns';
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

  // Weekdays only (Mon-Fri) for mobile view
  const weekdays = useMemo(() => {
    return days.filter(d => { const dow = getDay(d); return dow >= 1 && dow <= 5; });
  }, [days]);

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

  // Today's events for the desktop "Today" section
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = useMemo(
    () => filteredEvents.filter((e) => e.date === todayStr).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [filteredEvents, todayStr]
  );

  const handleDayClick = useCallback((day: Date) => {
    if (isSameDay(day, expandedDate)) return;
    setExpandedDate(day);
  }, [expandedDate]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Split days into rows of 7 for desktop expanded panel insertion
  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  // Find which row contains the expanded date
  const expandedRowIndex = rows.findIndex(row => row.some(d => isSameDay(d, expandedDate)));

  // Get label for expanded day - always "Today" if it IS today
  const getExpandedDayLabel = () => {
    if (isToday(expandedDate)) return 'Today';
    return format(expandedDate, 'EEEE, MMMM d');
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─── Mobile: Scrollable weekday (Mon-Fri) view ─── */}
      <div className="md:hidden flex flex-col">
        {/* Weekday headers */}
        <div className="grid grid-cols-5 gap-px bg-border border-b border-border">
          {weekdayNames.map((day) => (
            <div key={day} className="py-1.5 text-center font-body text-[10px] font-semibold text-text-secondary bg-bg-card">
              {day}
            </div>
          ))}
        </div>

        {/* Weekday cells - taller for mobile */}
        <div className="grid grid-cols-5 gap-px bg-border">
          {weekdays.slice(0, 5).map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayEvents = filteredEvents.filter((e) => e.date === dayStr);
            const today = isToday(day);
            const isExpanded = isSameDay(day, expandedDate);

            return (
              <div
                key={dayStr}
                onClick={() => handleDayClick(day)}
                className={`
                  bg-bg-card p-1.5 min-h-[120px] cursor-pointer transition-colors duration-150
                  ${today && !isExpanded ? 'ring-2 ring-inset ring-accent-primary/30' : ''}
                  ${isExpanded ? 'ring-2 ring-inset ring-accent-primary/60 bg-accent-primary/5' : ''}
                `}
              >
                <div className="flex flex-col items-center">
                  <div className={`
                    inline-flex items-center justify-center w-8 h-8 rounded-full mb-1
                    font-body text-xs font-medium transition-colors
                    ${isExpanded ? 'bg-accent-primary text-white' : ''}
                    ${today && !isExpanded ? 'bg-accent-primary text-white' : ''}
                    ${!today && !isExpanded ? 'text-text-secondary' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Dots for events */}
                  <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                    {dayEvents.slice(0, 4).map((event) => {
                      const color = event.color || users.find(u => event.event_users?.some(eu => eu.user_id === u.id))?.avatar_color || 'var(--color-accent-primary)';
                      return <div key={event.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />;
                    })}
                    {dayEvents.length > 4 && <div className="w-2 h-2 rounded-full bg-text-muted" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile expanded day events */}
        <AnimatePresence mode="wait">
          <motion.div
            key={expandedDayStr}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-bg-card border-t border-border"
          >
            <div className="px-4 pt-3 pb-1">
              <h3 className="font-display text-sm font-semibold text-text-primary">
                {getExpandedDayLabel()}
              </h3>
            </div>
            <div className="px-3 pb-3 space-y-2">
              {expandedDayEvents.length === 0 && (
                <p className="text-text-muted font-body text-sm italic py-3 text-center">No events</p>
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
        </AnimatePresence>
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

        {/* Day cells with expandable rows */}
        <div className="flex-1 flex flex-col bg-border gap-px">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-col">
              {/* The 7-day row */}
              <div className="grid grid-cols-7 gap-px">
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
                        bg-bg-card p-2 wall:p-3 min-h-[100px] lg:min-h-[130px] wall:min-h-[120px] overflow-hidden cursor-pointer
                        transition-colors duration-150
                        ${today && !isExpanded ? 'ring-2 ring-inset ring-accent-primary/30' : ''}
                        ${isExpanded ? 'ring-2 ring-inset ring-accent-primary/60 bg-accent-primary/5' : ''}
                      `}
                    >
                      <div className="flex flex-col items-start">
                        <div className={`
                          inline-flex items-center justify-center w-7 h-7 wall:w-9 wall:h-9 rounded-full mb-1
                          font-body text-sm wall:text-base font-medium transition-colors
                          ${isExpanded ? 'bg-accent-primary text-white' : ''}
                          ${today && !isExpanded ? 'bg-accent-primary text-white' : ''}
                          ${!today && !isExpanded ? 'text-text-secondary' : ''}
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

              {/* Expanded event panel — appears below the row containing the selected day (week view only) */}
              {viewMode === 'week' && (
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
                      <div className="px-6 pt-3 pb-1">
                        <h3 className="font-display text-base wall:text-lg font-semibold text-text-primary">
                          {getExpandedDayLabel()}
                        </h3>
                      </div>
                      <div className="px-5 pb-4 grid grid-cols-2 lg:grid-cols-3 gap-2">
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
              )}
            </div>
          ))}
        </div>

        {/* Desktop week view: "Today" section below grid */}
        {viewMode === 'week' && (
          <div className="hidden lg:block border-t-2 border-accent-primary/30 bg-accent-primary/5">
            <div className="px-6 pt-4 pb-1">
              <h3 className="font-display text-lg font-semibold text-accent-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
                Today &mdash; {format(new Date(), 'EEEE, MMMM d')}
              </h3>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {todayEvents.length === 0 && (
                <p className="text-text-muted font-body text-sm italic py-4 text-center col-span-full">Nothing scheduled today</p>
              )}
              {todayEvents.map((event) => (
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
        )}

        {/* Desktop month view: selected-day events below grid */}
        {viewMode === 'month' && (
          <div className="hidden lg:block border-t-2 border-accent-primary/30 bg-bg-card">
            <div className="px-6 pt-4 pb-1">
              <h3 className="font-display text-lg font-semibold text-text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
                {getExpandedDayLabel()}
              </h3>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {expandedDayEvents.length === 0 && (
                <p className="text-text-muted font-body text-sm italic py-4 text-center col-span-full">No events</p>
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
          </div>
        )}
      </div>
    </div>
  );
}
