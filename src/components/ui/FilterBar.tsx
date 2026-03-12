'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/appStore';
import type { User } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

interface FilterBarProps {
  users: User[];
}

export function FilterBar({ users }: FilterBarProps) {
  const { visibleUserIds, toggleUserVisibility, selectedDate, setSelectedDate, viewMode, setViewMode } = useAppStore();

  const navigateBack = () => {
    setSelectedDate(viewMode === 'month' ? subMonths(selectedDate, 1) : subWeeks(selectedDate, 1));
  };

  const navigateForward = () => {
    setSelectedDate(viewMode === 'month' ? addMonths(selectedDate, 1) : addWeeks(selectedDate, 1));
  };

  const goToToday = () => setSelectedDate(new Date());

  return (
    <div className="flex items-center gap-1.5 md:gap-3 px-2 md:px-4 wall:px-8 py-2 md:py-3 bg-bg-card border-b border-border overflow-visible">
      {/* Date navigation */}
      <div className="flex items-center gap-0.5 md:gap-2 shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={navigateBack} className="p-1.5 md:p-2 rounded-lg hover:bg-bg-secondary text-text-secondary min-w-[36px] md:min-w-[44px] min-h-[36px] md:min-h-[44px] flex items-center justify-center">
          <ChevronLeft size={18} />
        </motion.button>

        <h2 className="font-display text-sm md:text-lg wall:text-2xl font-semibold text-text-primary min-w-[100px] md:min-w-[180px] text-center whitespace-nowrap">
          {format(selectedDate, viewMode === 'month' ? 'MMM yyyy' : 'MMM d')}
        </h2>

        <motion.button whileTap={{ scale: 0.9 }} onClick={navigateForward} className="p-1.5 md:p-2 rounded-lg hover:bg-bg-secondary text-text-secondary min-w-[36px] md:min-w-[44px] min-h-[36px] md:min-h-[44px] flex items-center justify-center">
          <ChevronRight size={18} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goToToday}
          className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary text-[10px] md:text-sm font-body font-medium shrink-0 min-h-[28px] md:min-h-[36px]"
        >
          Today
        </motion.button>
      </div>

      <div className="flex-1 min-w-0" />

      {/* View mode toggle */}
      <div className="hidden md:flex items-center gap-1 bg-bg-secondary rounded-xl p-1">
        {(['week', 'month'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all capitalize
              ${viewMode === mode ? 'bg-bg-card shadow-sm text-text-primary' : 'text-text-muted'}`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* User filter dots */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {users.map((user) => {
          const active = visibleUserIds.length === 0 || visibleUserIds.includes(user.id);
          return (
            <motion.button
              key={user.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => toggleUserVisibility(user.id)}
              className={`w-6 h-6 md:w-8 md:h-8 wall:w-10 wall:h-10 rounded-full border-2 transition-all flex items-center justify-center text-[9px] md:text-xs font-bold text-white shrink-0 aspect-square
                ${active ? 'opacity-100 shadow-sm' : 'opacity-30'}
              `}
              style={{ backgroundColor: user.avatar_color, borderColor: active ? user.avatar_color : 'transparent' }}
              title={user.name}
            >
              {user.name.charAt(0)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
