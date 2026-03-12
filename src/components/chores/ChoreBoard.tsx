'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, RotateCcw, Trash2 } from 'lucide-react';
import { useChores } from '@/lib/hooks/useChores';
import { useUsers } from '@/lib/hooks/useUsers';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { User } from '@/types';

const RECURRENCE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
} as const;

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function ChoreBoard({ userId }: { userId?: string }) {
  const { data: chores = [], completions, addChore, completeChore, uncompleteChore, deleteChore } = useChores();
  const { data: users = [] } = useUsers();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [assignTo, setAssignTo] = useState<string[]>([]);

  const filtered = userId
    ? chores.filter((c) => c.chore_users?.some((cu) => cu.user_id === userId))
    : chores;

  // Check if today's day matches the chore schedule
  const todayDow = new Date().getDay();
  const todaysChores = filtered.filter((c) => {
    if (c.recurrence === 'daily') return true;
    if (c.days_of_week && c.days_of_week.includes(todayDow)) return true;
    if (c.recurrence === 'weekly' || c.recurrence === 'biweekly') return !c.days_of_week || c.days_of_week.length === 0;
    return true;
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    addChore.mutate({ title, recurrence, days_of_week: daysOfWeek.length > 0 ? daysOfWeek : null, userIds: assignTo });
    setTitle(''); setRecurrence('daily'); setDaysOfWeek([]); setAssignTo([]); setShowAdd(false);
  };

  const isCompleted = (choreId: string, uId?: string) =>
    completions.some((c) => c.chore_id === choreId && (uId ? c.user_id === uId : true));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text-primary">Chores</h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-secondary text-white font-body font-semibold text-xs">
          <Plus size={15} /> Add
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-bg-card rounded-2xl border border-border p-4 space-y-3">
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Chore name" className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-secondary/30" />
            <div className="flex flex-wrap gap-2">
              {(Object.entries(RECURRENCE_LABELS) as [keyof typeof RECURRENCE_LABELS, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setRecurrence(key)} className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${recurrence === key ? 'bg-accent-secondary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                  {label}
                </button>
              ))}
            </div>
            {(recurrence === 'weekly' || recurrence === 'biweekly') && (
              <div className="flex gap-1.5">
                {DAYS_SHORT.map((d, i) => (
                  <button key={i} onClick={() => setDaysOfWeek((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])} className={`w-9 h-9 rounded-lg font-body text-xs font-semibold transition-all ${daysOfWeek.includes(i) ? 'bg-accent-secondary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <button key={u.id} onClick={() => setAssignTo((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body transition-all ${assignTo.includes(u.id) ? 'ring-2 bg-bg-secondary' : 'opacity-40'}`} style={assignTo.includes(u.id) ? { '--tw-ring-color': u.avatar_color } as React.CSSProperties : {}}>
                  <UserAvatar name={u.name} color={u.avatar_color} size="xs" /> {u.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd} className="px-4 py-2 rounded-xl bg-accent-secondary text-white font-body font-semibold text-xs">Add</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary font-body text-xs">Cancel</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {todaysChores.map((chore) => {
          const assignedUsers = users.filter((u) => chore.chore_users?.some((cu) => cu.user_id === u.id));
          const done = userId ? isCompleted(chore.id, userId) : assignedUsers.length > 0 ? assignedUsers.every((u) => isCompleted(chore.id, u.id)) : isCompleted(chore.id);

          return (
            <motion.div key={chore.id} layout className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-card border border-border transition-opacity ${done ? 'opacity-50' : ''}`}>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => {
                  if (userId) {
                    done ? uncompleteChore.mutate({ choreId: chore.id, userId }) : completeChore.mutate({ choreId: chore.id, userId });
                  }
                }}
                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-success border-success text-white' : 'border-accent-secondary'}`}
              >
                {done && <Check size={14} strokeWidth={3} />}
              </motion.button>
              <div className="flex-1 min-w-0">
                <p className={`font-body text-sm font-medium ${done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{chore.title}</p>
                <p className="font-body text-[11px] text-text-muted flex items-center gap-1">
                  <RotateCcw size={10} /> {RECURRENCE_LABELS[chore.recurrence]}
                  {chore.days_of_week && chore.days_of_week.length > 0 && ` · ${chore.days_of_week.map((d) => DAYS_SHORT[d]).join(', ')}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {assignedUsers.map((u) => (
                  <div key={u.id} className="relative">
                    <UserAvatar name={u.name} color={u.avatar_color} size="xs" />
                    {isCompleted(chore.id, u.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full flex items-center justify-center"><Check size={7} className="text-white" strokeWidth={3} /></div>}
                  </div>
                ))}
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteChore.mutate(chore.id)} className="ml-1 text-text-muted hover:text-error transition-colors">
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
        {todaysChores.length === 0 && <p className="text-text-muted font-body text-sm italic py-2">No chores today</p>}
      </div>
    </div>
  );
}
