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
    <div className="bg-bg-card border-b border-border overflow-hidden">
      {/* ─── Mobile: two rows ─── */}
      <div className="md:hidden">
        {/* Row 1: Date navigation */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1">
            <motion.button whileTap={{ scale: 0.9 }} onClick={navigateBack} className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary min-w-[40px] min-h-[40px] flex items-center justify-center">
              <ChevronLeft size={20} />
            </motion.button>

            <h2 className="font-display text-base font-semibold text-text-primary min-w-[110px] text-center whitespace-nowrap">
              {format(selectedDate, viewMode === 'month' ? 'MMM yyyy' : 'MMM d')}
            </h2>

            <motion.button whileTap={{ scale: 0.9 }} onClick={navigateForward} className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary min-w-[40px] min-h-[40px] flex items-center justify-center">
              <ChevronRight size={20} />
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-accent-primary/10 text-accent-primary text-xs font-body font-semibold min-h-[34px]"
          >
            Today
          </motion.button>
        </div>

        {/* Row 2: User filter dots */}
        <div className="flex items-center justify-center gap-2 px-3 pb-2.5 pt-1">
          {users.map((user) => {
            const active = visibleUserIds.length === 0 || visibleUserIds.includes(user.id);
            return (
              <motion.button
                key={user.id}
                whileTap={{ scale: 0.85 }}
                onClick={() => toggleUserVisibility(user.id)}
                className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-[10px] font-bold text-white aspect-square
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

      {/* ─── Desktop / Tablet: single row ─── */}
      <div className="hidden md:flex items-center gap-3 px-4 wall:px-8 py-3">
        {/* Date navigation */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button whileTap={{ scale: 0.9 }} onClick={navigateBack} className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ChevronLeft size={18} />
          </motion.button>

          <h2 className="font-display text-lg wall:text-2xl font-semibold text-text-primary min-w-[180px] text-center whitespace-nowrap">
            {format(selectedDate, viewMode === 'month' ? 'MMM yyyy' : 'MMM d')}
          </h2>

          <motion.button whileTap={{ scale: 0.9 }} onClick={navigateForward} className="p-2 rounded-lg hover:bg-bg-secondary text-text-secondary min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ChevronRight size={18} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-accent-primary/10 text-accent-primary text-sm font-body font-semibold min-h-[36px]"
          >
            Today
          </motion.button>
        </div>

        <div className="flex-1 min-w-0" />

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-bg-secondary rounded-xl p-1">
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
        <div className="flex items-center gap-2 shrink-0">
          {users.map((user) => {
            const active = visibleUserIds.length === 0 || visibleUserIds.includes(user.id);
            return (
              <motion.button
                key={user.id}
                whileTap={{ scale: 0.85 }}
                onClick={() => toggleUserVisibility(user.id)}
                className={`w-8 h-8 wall:w-10 wall:h-10 rounded-full border-2 transition-all flex items-center justify-center text-xs font-bold text-white shrink-0 aspect-square
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
    </div>
  );
}
