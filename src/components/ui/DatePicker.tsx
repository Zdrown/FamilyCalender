'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';

interface DatePickerProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  onClose: () => void;
}

export function DatePicker({ value, onChange, onClose }: DatePickerProps) {
  const selected = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected));
  const [direction, setDirection] = useState(0);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const goNext = () => {
    setDirection(1);
    setViewMonth((m) => addMonths(m, 1));
  };
  const goPrev = () => {
    setDirection(-1);
    setViewMonth((m) => subMonths(m, 1));
  };

  const pick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    onClose();
  };

  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
      className="absolute left-0 right-0 top-full mt-2 z-50 bg-bg-card rounded-2xl border border-border shadow-xl p-4 select-none"
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrev}
          className="p-2 rounded-xl hover:bg-bg-secondary text-text-muted transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={viewMonth.toISOString()}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.2 }}
            className="font-display text-lg font-semibold text-text-primary"
          >
            {format(viewMonth, 'MMMM yyyy')}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={goNext}
          className="p-2 rounded-xl hover:bg-bg-secondary text-text-muted transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] font-body font-semibold uppercase tracking-widest text-text-muted py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewMonth.toISOString()}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-0.5"
        >
          {days.map((day) => {
            const inMonth = isSameMonth(day, viewMonth);
            const isSelected = isSameDay(day, selected);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => pick(day)}
                className={`
                  relative aspect-square flex items-center justify-center rounded-xl font-body text-sm font-medium transition-all
                  ${!inMonth ? 'text-text-muted/40' : 'text-text-primary'}
                  ${isSelected
                    ? 'bg-accent-primary text-white shadow-md shadow-accent-primary/25'
                    : 'hover:bg-bg-secondary'
                  }
                `}
              >
                {format(day, 'd')}
                {today && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-primary" />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => {
            onChange(format(new Date(), 'yyyy-MM-dd'));
            onClose();
          }}
          className="flex-1 py-2 rounded-xl text-xs font-body font-semibold text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 rounded-xl text-xs font-body font-semibold text-text-muted bg-bg-secondary hover:bg-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
