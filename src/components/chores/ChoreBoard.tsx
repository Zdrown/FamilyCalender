'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, RotateCcw, Trash2, Pencil, X } from 'lucide-react';
import { useChores } from '@/lib/hooks/useChores';
import { useUsers } from '@/lib/hooks/useUsers';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { User, Chore } from '@/types';

const RECURRENCE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
} as const;

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function ChoreBoard({ userId }: { userId?: string }) {
  const { data: chores = [], completions, addChore, completeChore, uncompleteChore, updateChore, deleteChore } = useChores();
  const { data: users = [] } = useUsers();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [assignTo, setAssignTo] = useState<string[]>([]);

  // Edit state
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('daily');
  const [editDaysOfWeek, setEditDaysOfWeek] = useState<number[]>([]);
  const [editAssignTo, setEditAssignTo] = useState<string[]>([]);

  const filtered = userId
    ? chores.filter((c) => c.chore_users?.some((cu) => cu.user_id === userId))
    : chores;

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

  const handleEdit = (chore: Chore) => {
    setEditingChore(chore);
    setEditTitle(chore.title);
    setEditRecurrence(chore.recurrence);
    setEditDaysOfWeek(chore.days_of_week || []);
    setEditAssignTo(chore.chore_users?.map((cu) => cu.user_id) || []);
  };

  const handleSaveEdit = () => {
    if (!editingChore || !editTitle.trim()) return;
    updateChore.mutate({
      id: editingChore.id,
      title: editTitle,
      recurrence: editRecurrence,
      days_of_week: editDaysOfWeek.length > 0 ? editDaysOfWeek : null,
      userIds: editAssignTo,
    });
    setEditingChore(null);
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

      {/* Edit form */}
      <AnimatePresence>
        {editingChore && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-bg-card rounded-2xl border-2 border-accent-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-xs font-bold text-accent-secondary">Editing chore</span>
              <button onClick={() => setEditingChore(null)} className="text-text-muted"><X size={16} /></button>
            </div>
            <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} placeholder="Chore name" className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-secondary/30" />
            <div className="flex flex-wrap gap-2">
              {(Object.entries(RECURRENCE_LABELS) as [keyof typeof RECURRENCE_LABELS, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setEditRecurrence(key)} className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${editRecurrence === key ? 'bg-accent-secondary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                  {label}
                </button>
              ))}
            </div>
            {(editRecurrence === 'weekly' || editRecurrence === 'biweekly') && (
              <div className="flex gap-1.5">
                {DAYS_SHORT.map((d, i) => (
                  <button key={i} onClick={() => setEditDaysOfWeek((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])} className={`w-9 h-9 rounded-lg font-body text-xs font-semibold transition-all ${editDaysOfWeek.includes(i) ? 'bg-accent-secondary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <button key={u.id} onClick={() => setEditAssignTo((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body transition-all ${editAssignTo.includes(u.id) ? 'ring-2 bg-bg-secondary' : 'opacity-40'}`} style={editAssignTo.includes(u.id) ? { '--tw-ring-color': u.avatar_color } as React.CSSProperties : {}}>
                  <UserAvatar name={u.name} color={u.avatar_color} size="xs" /> {u.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveEdit} className="px-4 py-2 rounded-xl bg-accent-secondary text-white font-body font-semibold text-xs">Save</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingChore(null)} className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary font-body text-xs">Cancel</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {todaysChores.map((chore) => {
          const assignedUsers = users.filter((u) => chore.chore_users?.some((cu) => cu.user_id === u.id));
          const done = userId ? isCompleted(chore.id, userId) : assignedUsers.length > 0 ? assignedUsers.every((u) => isCompleted(chore.id, u.id)) : isCompleted(chore.id);

          return (
            <ChoreRow
              key={chore.id}
              chore={chore}
              done={done}
              userId={userId}
              users={users}
              assignedUsers={assignedUsers}
              isCompleted={isCompleted}
              onComplete={completeChore.mutate}
              onUncomplete={uncompleteChore.mutate}
              onEdit={handleEdit}
              onDelete={deleteChore.mutate}
            />
          );
        })}
        {todaysChores.length === 0 && <p className="text-text-muted font-body text-sm italic py-2">No chores today</p>}
      </div>
    </div>
  );
}

function ChoreRow({ chore, done, userId, users, assignedUsers, isCompleted: isCompletedFn, onComplete, onUncomplete, onEdit, onDelete }: {
  chore: Chore;
  done: boolean;
  userId?: string;
  users: User[];
  assignedUsers: User[];
  isCompleted: (choreId: string, userId?: string) => boolean;
  onComplete: (v: { choreId: string; userId: string }) => void;
  onUncomplete: (v: { choreId: string; userId: string }) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowActions(true);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  return (
    <div className="relative">
      <motion.div
        layout
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-card border border-border transition-opacity select-none ${done ? 'opacity-50' : ''}`}
      >
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => {
            if (userId) {
              done ? onUncomplete({ choreId: chore.id, userId }) : onComplete({ choreId: chore.id, userId });
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
              {isCompletedFn(chore.id, u.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full flex items-center justify-center"><Check size={7} className="text-white" strokeWidth={3} /></div>}
            </div>
          ))}
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(chore.id)} className="ml-1 text-text-muted hover:text-error transition-colors">
            <Trash2 size={14} />
          </motion.button>
        </div>
      </motion.div>

      {/* Long-press actions */}
      <AnimatePresence>
        {showActions && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-2 top-full mt-1 z-50 flex gap-1 bg-bg-card rounded-xl border border-border shadow-xl p-1.5"
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { setShowActions(false); onEdit(chore); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold text-accent-primary hover:bg-accent-primary/10 transition-colors"
              >
                <Pencil size={14} /> Edit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { setShowActions(false); onDelete(chore.id); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


