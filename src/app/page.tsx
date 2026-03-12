'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Settings, X, Palette } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

import { useUsers } from '@/lib/hooks/useUsers';
import { useEvents } from '@/lib/hooks/useEvents';
import { useAppStore } from '@/lib/store/appStore';
import { applySeason, getCurrentSeason } from '@/lib/utils/season';
import { expandRecurringEvents } from '@/lib/utils/recurrence';

import { WallTabBar, MobileTabBar } from '@/components/ui/TabBar';
import { FilterBar } from '@/components/ui/FilterBar';
import { AffirmationHero } from '@/components/ui/AffirmationHero';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { EventCard } from '@/components/calendar/EventCard';
import { EventForm } from '@/components/calendar/EventForm';
import { TodoList } from '@/components/todos/TodoList';
import { ChoreBoard } from '@/components/chores/ChoreBoard';
import { MustHaveChecklist } from '@/components/musthaves/MustHaveChecklist';
import { GroceryList } from '@/components/grocery/GroceryList';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { PhotoCarousel } from '@/components/photos/PhotoCarousel';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { UserManagement } from '@/components/settings/UserManagement';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Screensaver } from '@/components/ui/Screensaver';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { hapticSuccess } from '@/lib/utils/haptic';

export default function HomePage() {
  const { data: users = [], updateUser } = useUsers();
  const { selectedDate, viewMode, setIsWallDisplay, isWallDisplay, activeTab, setActiveTab } = useAppStore();

  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
    }
    return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
  }, [selectedDate, viewMode]);

  const { data: rawEvents = [], addEvent } = useEvents(dateRange.start, dateRange.end);
  const events = useMemo(() => expandRecurringEvents(rawEvents, dateRange.start, dateRange.end), [rawEvents, dateRange]);

  const [showEventForm, setShowEventForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsWallDisplay(window.innerWidth >= 2560);
    applySeason(getCurrentSeason());
    const handleResize = () => setIsWallDisplay(window.innerWidth >= 2560);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsWallDisplay]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = useMemo(
    () => events.filter((e) => e.date === todayStr).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
    [events, todayStr]
  );

  if (!isClient) return null;

  const handleCreateEvent = async (data: Parameters<typeof addEvent.mutate>[0]) => {
    await addEvent.mutateAsync(data);
    setShowEventForm(false);
  };

  // Determine current user for user tabs
  const activeUser = users.find((u) => u.id === activeTab);
  const isUserTab = !!activeUser;
  const isFamilyTab = activeTab === 'family';
  const isTodosTab = activeTab === 'todos';
  const isGroceryTab = activeTab === 'grocery';
  const isPhotosTab = activeTab === 'photos';
  const isMeTab = activeTab === 'me';

  // ─── Settings Panel (shared) ───
  const settingsPanel = (
    <AnimatePresence>
      {showSettings && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-8">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-text-primary">Settings</h2>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-muted"><X size={20} /></motion.button>
            </div>
            <UserManagement />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };
  const pageTransition = { duration: 0.2, ease: 'easeOut' as const };

  // ─── Wall Display ───
  if (isWallDisplay) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-bg-primary">
        <OfflineIndicator />
        <Screensaver />
        <WallTabBar users={users} onAddUser={() => setShowSettings(true)} onSettings={() => setShowSettings(true)} />
        {isFamilyTab && <FilterBar users={users} />}

        <div className="flex-1 flex overflow-hidden">
          {/* Main area */}
          <div className="flex-[7] flex flex-col border-r border-border overflow-hidden">
            {isFamilyTab && (
              <>
                <div className="px-8 py-6 bg-gradient-to-br from-bg-primary to-bg-secondary border-b border-border">
                  <AffirmationHero />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CalendarGrid events={events} users={users} />
                </div>
              </>
            )}
            {isUserTab && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6" style={activeUser.accent_color ? { '--color-accent-primary': activeUser.accent_color } as React.CSSProperties : {}}>
                {activeUser.hero_image_url && (
                  <div className="h-48 rounded-2xl overflow-hidden">
                    <img src={activeUser.hero_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <AffirmationHero userId={activeUser.id} />
                <div className="grid grid-cols-2 gap-6">
                  <TodoList userId={activeUser.id} />
                  <ChoreBoard userId={activeUser.id} />
                </div>
                <MustHaveChecklist userId={activeUser.id} />
                <PhotoCarousel scope={activeUser.id} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex-[3] flex flex-col overflow-y-auto bg-bg-card">
            <div className="p-5">
              <WeatherWidget />
            </div>
            <div className="p-5 border-t border-border">
              <h3 className="font-display text-lg font-semibold text-text-primary mb-3">
                Today — {format(new Date(), 'EEEE, MMM d')}
              </h3>
              <div className="space-y-2">
                {todayEvents.length === 0 && <p className="text-text-muted font-body text-sm italic">No events today</p>}
                {todayEvents.map((event) => <EventCard key={event.id} event={event} users={users} compact />)}
              </div>
            </div>
            <div className="p-5 border-t border-border">
              <ChoreBoard />
            </div>
            <div className="p-5 border-t border-border">
              <GroceryList />
            </div>
            <div className="p-5">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowEventForm(true)} className="w-full py-4 rounded-2xl bg-accent-primary text-white font-body font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[56px]">
                <Plus size={22} /> New Event
              </motion.button>
            </div>
          </aside>
        </div>

        <AnimatePresence>
          {showEventForm && <EventForm users={users} onSubmit={handleCreateEvent} onClose={() => setShowEventForm(false)} />}
        </AnimatePresence>
        {settingsPanel}
      </div>
    );
  }

  // ─── Mobile / Desktop ───
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary pb-20">
      <OfflineIndicator />
      <Screensaver />
      <header className="flex items-center justify-between px-5 py-4 bg-bg-card border-b border-border">
        <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">MyFamily</h1>
        <div className="flex items-center gap-2">
          <WeatherWidget compact />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-muted">
            <Settings size={18} />
          </motion.button>
        </div>
      </header>

      {/* Mobile content based on active tab */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
        {/* Calendar tab */}
        {isFamilyTab && (
          <motion.div key="family" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
          <>
            <FilterBar users={users} />
            <CalendarGrid events={events} users={users} />
            <div className="px-5 py-4">
              <h3 className="font-display text-lg font-semibold text-text-primary mb-3">Today</h3>
              <div className="space-y-2">
                {todayEvents.length === 0 && <p className="text-text-muted font-body text-sm italic">Nothing scheduled today</p>}
                {todayEvents.map((event) => <EventCard key={event.id} event={event} users={users} />)}
              </div>
            </div>
          </>
          </motion.div>
        )}

        {/* Todos tab */}
        {isTodosTab && (
          <motion.div key="todos" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="p-5 space-y-6">
            <TodoList />
            <ChoreBoard />
          </motion.div>
        )}

        {/* Grocery tab */}
        {isGroceryTab && (
          <motion.div key="grocery" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="p-5">
            <GroceryList />
          </motion.div>
        )}

        {/* Photos tab */}
        {isPhotosTab && (
          <motion.div key="photos" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="p-5 space-y-4">
            <PhotoCarousel scope="family" />
            <PhotoUpload scope="family" />
          </motion.div>
        )}

        {/* Me tab — user picker then personal view */}
        {isMeTab && (
          <motion.div key="me" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
            <MeTab users={users} onUpdateUser={updateUser} />
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* FAB for calendar */}
      {isFamilyTab && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowEventForm(true)} className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-accent-primary text-white shadow-xl flex items-center justify-center z-40">
          <Plus size={28} />
        </motion.button>
      )}

      <MobileTabBar />

      <AnimatePresence>
        {showEventForm && <EventForm users={users} onSubmit={handleCreateEvent} onClose={() => setShowEventForm(false)} />}
      </AnimatePresence>
      {settingsPanel}
    </div>
  );
}

// ─── Me Tab ───
function MeTab({ users, onUpdateUser }: { users: import('@/types').User[]; onUpdateUser: ReturnType<typeof useUsers>['updateUser'] }) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState(false);
  const [accentColor, setAccentColor] = useState('');
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const ACCENT_COLORS = ['#E57373', '#F06292', '#BA68C8', '#7986CB', '#64B5F6', '#4FC3F7', '#4DB6AC', '#81C784', '#AED581', '#FFD54F', '#FFB74D', '#FF8A65'];

  if (!selectedUserId) {
    return (
      <div className="p-5 space-y-4">
        <h2 className="font-display text-xl font-bold text-text-primary">Who are you?</h2>
        <div className="grid grid-cols-2 gap-3">
          {users.map((u) => (
            <motion.button key={u.id} whileTap={{ scale: 0.97 }} onClick={() => setSelectedUserId(u.id)} className="flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-border hover:shadow-md transition-all">
              <UserAvatar name={u.name} color={u.avatar_color} size="lg" />
              <span className="font-body text-base font-semibold text-text-primary">{u.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6" style={selectedUser?.accent_color ? { '--color-accent-primary': selectedUser.accent_color } as React.CSSProperties : {}}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar name={selectedUser!.name} color={selectedUser!.avatar_color} size="lg" />
          <div>
            <h2 className="font-display text-xl font-bold text-text-primary">{selectedUser!.name}</h2>
            <button onClick={() => setSelectedUserId(null)} className="font-body text-xs text-accent-primary">Switch user</button>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingColor(!editingColor); setAccentColor(selectedUser?.accent_color || ''); }} className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-muted">
          <Palette size={18} />
        </motion.button>
      </div>

      {/* Accent color picker */}
      <AnimatePresence>
        {editingColor && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-bg-card rounded-xl border border-border p-4 space-y-3">
              <p className="font-body text-xs text-text-muted">Accent color</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button key={c} onClick={() => { setAccentColor(c); onUpdateUser.mutate({ id: selectedUserId, accent_color: c }); }} className="w-8 h-8 rounded-full transition-transform" style={{ backgroundColor: c, transform: accentColor === c ? 'scale(1.25)' : 'scale(1)', boxShadow: accentColor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none' }} />
                ))}
                <button onClick={() => { setAccentColor(''); onUpdateUser.mutate({ id: selectedUserId, accent_color: null }); }} className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center text-text-muted text-xs">✕</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AffirmationHero userId={selectedUserId} />
      <MustHaveChecklist userId={selectedUserId} />
      <TodoList userId={selectedUserId} />
      <ChoreBoard userId={selectedUserId} />
      <PhotoCarousel scope={selectedUserId} />
      <PhotoUpload userId={selectedUserId} scope={selectedUserId} />
    </div>
  );
}
