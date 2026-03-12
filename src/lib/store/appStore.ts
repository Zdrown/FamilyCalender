import { create } from 'zustand';
import type { User, ViewMode, Season } from '@/types';

interface AppState {
  // Current active tab
  activeTab: string; // 'family' | user_id | 'settings'
  setActiveTab: (tab: string) => void;

  // Calendar view mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Selected date for calendar
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // User filter — which users' events are visible
  visibleUserIds: string[];
  toggleUserVisibility: (userId: string) => void;
  setAllUsersVisible: (userIds: string[]) => void;

  // Season
  season: Season;
  setSeason: (season: Season) => void;

  // Wall display mode detection
  isWallDisplay: boolean;
  setIsWallDisplay: (v: boolean) => void;

  // Active user for context (who is interacting)
  activeUserId: string | null;
  setActiveUserId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'family',
  setActiveTab: (tab) => set({ activeTab: tab }),

  viewMode: 'week',
  setViewMode: (mode) => set({ viewMode: mode }),

  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  visibleUserIds: [],
  toggleUserVisibility: (userId) =>
    set((state) => ({
      visibleUserIds: state.visibleUserIds.includes(userId)
        ? state.visibleUserIds.filter((id) => id !== userId)
        : [...state.visibleUserIds, userId],
    })),
  setAllUsersVisible: (userIds) => set({ visibleUserIds: userIds }),

  season: 'spring',
  setSeason: (season) => set({ season }),

  isWallDisplay: false,
  setIsWallDisplay: (v) => set({ isWallDisplay: v }),

  activeUserId: null,
  setActiveUserId: (id) => set({ activeUserId: id }),
}));
