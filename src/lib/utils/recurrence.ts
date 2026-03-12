import { addDays, addWeeks, addMonths, addYears, format, isBefore, isAfter, startOfDay } from 'date-fns';
import type { CalendarEvent } from '@/types';

type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

/**
 * Generate recurring event instances for a date range.
 * Returns new event objects with dates set to each occurrence.
 */
export function generateRecurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  if (event.recurrence === 'none' || !event.recurrence) return [];

  const instances: CalendarEvent[] = [];
  const eventDate = startOfDay(new Date(event.date));
  const recurrenceEnd = event.recurrence_end
    ? startOfDay(new Date(event.recurrence_end))
    : addMonths(rangeEnd, 1); // default: generate up to range end + buffer

  const advanceFn = getAdvanceFn(event.recurrence);
  let current = advanceFn(eventDate, 1); // start from first recurrence (original already exists)

  while (isBefore(current, rangeEnd) || format(current, 'yyyy-MM-dd') === format(rangeEnd, 'yyyy-MM-dd')) {
    if (isAfter(current, recurrenceEnd)) break;

    if (
      (isAfter(current, rangeStart) || format(current, 'yyyy-MM-dd') === format(rangeStart, 'yyyy-MM-dd'))
    ) {
      instances.push({
        ...event,
        id: `${event.id}_${format(current, 'yyyy-MM-dd')}`,
        date: format(current, 'yyyy-MM-dd'),
        recurrence_parent_id: event.id,
        recurrence: 'none', // instances don't recur themselves
      });
    }

    current = advanceFn(current, 1);
  }

  return instances;
}

function getAdvanceFn(recurrence: RecurrenceType): (date: Date, amount: number) => Date {
  switch (recurrence) {
    case 'daily': return addDays;
    case 'weekly': return addWeeks;
    case 'biweekly': return (d, n) => addWeeks(d, n * 2);
    case 'monthly': return addMonths;
    case 'yearly': return addYears;
  }
}

/**
 * Expand a list of events, adding generated recurrence instances within the range.
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];

  for (const event of events) {
    expanded.push(event);
    if (event.recurrence && event.recurrence !== 'none') {
      expanded.push(...generateRecurrences(event, rangeStart, rangeEnd));
    }
  }

  return expanded;
}
