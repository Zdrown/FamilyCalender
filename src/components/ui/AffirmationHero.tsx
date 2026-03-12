'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { useAffirmations } from '@/lib/hooks/useAffirmations';

export function AffirmationHero({ userId }: { userId?: string | null }) {
  const { todaysAffirmation, data: all = [], addAffirmation, togglePin, deleteAffirmation } = useAffirmations(userId);
  const [showManage, setShowManage] = useState(false);
  const [newText, setNewText] = useState('');

  const handleAdd = () => {
    if (!newText.trim()) return;
    addAffirmation.mutate({ text: newText, user_id: userId || null });
    setNewText('');
  };

  return (
    <div className="space-y-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="cursor-pointer lg:py-4 xl:py-6 lg:min-h-[100px] xl:min-h-[120px] flex items-center justify-center"
        onClick={() => setShowManage(!showManage)}
      >
        <p className="font-accent text-xl md:text-2xl wall:text-4xl italic text-text-primary/80 leading-relaxed text-center">
          &ldquo;{todaysAffirmation?.text || 'Together we are stronger than we could ever be apart.'}&rdquo;
        </p>
      </motion.div>

      <AnimatePresence>
        {showManage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-bg-card rounded-xl border border-border p-4 mt-3 space-y-3">
              <div className="flex gap-2">
                <input value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Add an affirmation..." className="flex-1 px-3 py-2 rounded-lg bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none" />
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd} className="px-3 py-2 rounded-lg bg-accent-primary text-white"><Plus size={16} /></motion.button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {all.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary text-sm font-body">
                    <span className="flex-1 text-text-primary truncate">{a.text}</span>
                    <button onClick={() => togglePin.mutate({ id: a.id, pinned: !a.pinned })} className={`${a.pinned ? 'text-accent-primary' : 'text-text-muted'} hover:text-accent-primary transition-colors`}>
                      {a.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button onClick={() => deleteAffirmation.mutate(a.id)} className="text-text-muted hover:text-error transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
