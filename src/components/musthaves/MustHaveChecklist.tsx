'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2 } from 'lucide-react';
import { useMustHaves } from '@/lib/hooks/useMustHaves';
import { format, startOfWeek, startOfMonth } from 'date-fns';

const CADENCE_TABS = [
  { key: 'daily' as const, label: 'Daily' },
  { key: 'weekly' as const, label: 'Weekly' },
  { key: 'monthly' as const, label: 'Monthly' },
];

export function MustHaveChecklist({ userId }: { userId: string }) {
  const { items, completions, addMustHave, toggleCompletion, deleteMustHave } = useMustHaves(userId);
  const [activeCadence, setActiveCadence] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const getCompletionDate = (cadence: string) =>
    cadence === 'daily' ? today : cadence === 'weekly' ? weekStart : monthStart;

  const filtered = items.filter((i) => i.cadence === activeCadence);
  const completedCount = filtered.filter((i) =>
    completions.some((c) => c.must_have_id === i.id && c.completed_date === getCompletionDate(i.cadence))
  ).length;
  const total = filtered.length;
  const progress = total > 0 ? completedCount / total : 0;

  const handleAdd = () => {
    if (!title.trim()) return;
    addMustHave.mutate({ user_id: userId, title, cadence: activeCadence, sort_order: filtered.length });
    setTitle('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text-primary">Must-Haves</h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-tertiary text-white font-body font-semibold text-xs">
          <Plus size={15} /> Add
        </motion.button>
      </div>

      {/* Cadence tabs */}
      <div className="flex gap-1 bg-bg-secondary rounded-xl p-1">
        {CADENCE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCadence(key)}
            className={`flex-1 py-2 rounded-lg font-body text-xs font-semibold transition-all ${activeCadence === key ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Progress ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" className="stroke-border" />
            <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-accent-primary" style={{ strokeDasharray: `${progress * 150.8} 150.8`, transition: 'stroke-dasharray 0.4s ease' }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-body text-xs font-bold text-text-primary">
            {completedCount}/{total}
          </span>
        </div>
        <p className="font-body text-sm text-text-secondary">
          {progress === 1 ? 'All done! ✨' : `${total - completedCount} remaining`}
        </p>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex gap-2">
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder={`New ${activeCadence} must-have`} className="flex-1 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-tertiary/30" />
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd} className="px-4 py-2.5 rounded-xl bg-accent-tertiary text-white font-body font-semibold text-xs">Add</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {filtered.map((item) => {
          const isCompleted = completions.some((c) => c.must_have_id === item.id && c.completed_date === getCompletionDate(item.cadence));
          return (
            <motion.div key={item.id} layout className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-card border border-border transition-opacity ${isCompleted ? 'opacity-50' : ''}`}>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => toggleCompletion.mutate({ mustHaveId: item.id, cadence: item.cadence, isCompleted })}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isCompleted ? 'bg-accent-tertiary border-accent-tertiary text-white' : 'border-accent-tertiary'}`}
              >
                {isCompleted && <Check size={13} strokeWidth={3} />}
              </motion.button>
              <span className={`flex-1 font-body text-sm ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>{item.title}</span>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteMustHave.mutate(item.id)} className="text-text-muted hover:text-error transition-colors">
                <Trash2 size={14} />
              </motion.button>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <p className="text-text-muted font-body text-sm italic py-2">No {activeCadence} must-haves yet</p>}
      </div>
    </div>
  );
}
