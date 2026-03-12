'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/appStore';
import { UserAvatar } from './UserAvatar';
import type { User } from '@/types';
import { Settings, Plus, Calendar, CheckSquare, ShoppingCart, Image, UserIcon } from 'lucide-react';

interface TabBarProps {
  users: User[];
  onAddUser: () => void;
  onSettings: () => void;
}

export function WallTabBar({ users, onAddUser, onSettings }: TabBarProps) {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="flex items-center gap-2 px-8 py-4 bg-bg-card border-b border-border">
      {/* Family tab */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab('family')}
        className={`
          px-6 py-3 rounded-xl font-display text-lg font-semibold transition-all min-w-[56px] min-h-[56px]
          ${activeTab === 'family'
            ? 'bg-accent-primary text-white shadow-md'
            : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'}
        `}
      >
        Family
      </motion.button>

      {/* User tabs */}
      {users.map((user) => (
        <motion.button
          key={user.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab(user.id)}
          className={`
            flex items-center gap-3 px-5 py-3 rounded-xl font-body text-base font-medium transition-all min-h-[56px]
            ${activeTab === user.id
              ? 'bg-bg-secondary shadow-md ring-2'
              : 'hover:bg-bg-secondary/60'}
          `}
          style={activeTab === user.id ? { '--tw-ring-color': user.avatar_color } as React.CSSProperties : {}}
        >
          <UserAvatar name={user.name} color={user.avatar_color} size="sm" />
          <span className="hidden xl:inline">{user.name}</span>
        </motion.button>
      ))}

      {/* Add user */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAddUser}
        className="w-14 h-14 rounded-xl bg-bg-secondary text-text-muted hover:text-text-secondary hover:bg-bg-secondary/80 flex items-center justify-center transition-all"
      >
        <Plus size={24} />
      </motion.button>

      <div className="flex-1" />

      {/* Settings */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onSettings}
        className="w-14 h-14 rounded-xl text-text-muted hover:text-text-secondary hover:bg-bg-secondary flex items-center justify-center transition-all"
      >
        <Settings size={24} />
      </motion.button>
    </nav>
  );
}

export function MobileTabBar() {
  const { activeTab, setActiveTab } = useAppStore();

  const tabs = [
    { id: 'family', label: 'Calendar', icon: Calendar },
    { id: 'todos', label: 'Tasks', icon: CheckSquare },
    { id: 'grocery', label: 'Grocery', icon: ShoppingCart },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'me', label: 'Me', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex items-stretch bg-bg-card border-t border-border z-50 safe-area-pb">
      {tabs.map(({ id, label, icon: Icon }) => (
        <motion.button
          key={id}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab(id)}
          className={`
            flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors
            ${activeTab === id ? 'text-accent-primary' : 'text-text-muted'}
          `}
        >
          <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.5} />
          <span className="text-[10px] font-body font-medium">{label}</span>
        </motion.button>
      ))}
    </nav>
  );
}
