'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, ShoppingCart } from 'lucide-react';
import { useGrocery } from '@/lib/hooks/useGrocery';
import type { GroceryItem } from '@/types';

const CATEGORIES = [
  { key: 'produce' as const, label: '🥬 Produce', color: '#81C784' },
  { key: 'dairy' as const, label: '🥛 Dairy', color: '#64B5F6' },
  { key: 'meat' as const, label: '🥩 Meat', color: '#E57373' },
  { key: 'pantry' as const, label: '🫙 Pantry', color: '#FFB74D' },
  { key: 'frozen' as const, label: '🧊 Frozen', color: '#4DD0E1' },
  { key: 'other' as const, label: '📦 Other', color: '#B2BEC3' },
];

export function GroceryList() {
  const { data: items = [], addItem, toggleItem, deleteItem, clearChecked } = useGrocery();
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<GroceryItem['category']>('other');

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.key),
  })).filter((g) => g.items.length > 0);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const handleAdd = () => {
    if (!itemName.trim()) return;
    addItem.mutate({ item: itemName, quantity: quantity || null, category });
    setItemName('');
    setQuantity('');
    setCategory('other');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold text-text-primary">Grocery List</h2>
          <span className="px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary font-body text-xs font-bold">{unchecked.length}</span>
        </div>
        <div className="flex gap-2">
          {checked.length > 0 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => clearChecked.mutate()} className="px-3 py-2 rounded-xl bg-bg-secondary text-text-muted font-body text-xs font-semibold hover:text-error transition-colors">
              Clear done
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-primary text-white font-body font-semibold text-xs">
            <Plus size={15} /> Add
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex gap-2">
              <input autoFocus value={itemName} onChange={(e) => setItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Item name" className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30" />
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="w-20 px-3 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} onClick={() => setCategory(cat.key)} className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${category === cat.key ? 'text-white shadow-sm' : 'bg-bg-secondary text-text-secondary'}`} style={category === cat.key ? { backgroundColor: cat.color } : {}}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd} className="px-4 py-2 rounded-xl bg-accent-primary text-white font-body font-semibold text-xs">Add</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary font-body text-xs">Cancel</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items by category */}
      {grouped.map((group) => (
        <div key={group.key}>
          <p className="font-body text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{group.label}</p>
          <div className="space-y-1.5">
            {group.items.map((item) => (
              <GroceryRow key={item.id} item={item} onToggle={toggleItem.mutate} onDelete={deleteItem.mutate} />
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-8">
          <ShoppingCart size={40} className="mx-auto text-text-muted mb-2 opacity-30" />
          <p className="text-text-muted font-body text-sm">List is empty</p>
        </div>
      )}
    </div>
  );
}

function GroceryRow({ item, onToggle, onDelete }: { item: GroceryItem; onToggle: (v: { id: string; checked: boolean }) => void; onDelete: (id: string) => void }) {
  return (
    <motion.div layout className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-card border border-border transition-opacity ${item.checked ? 'opacity-40' : ''}`}>
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => onToggle({ id: item.id, checked: !item.checked })}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${item.checked ? 'bg-success border-success text-white' : 'border-border'}`}
      >
        {item.checked && <Check size={14} strokeWidth={3} />}
      </motion.button>
      <span className={`flex-1 font-body text-sm ${item.checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
        {item.item}
        {item.quantity && <span className="text-text-muted ml-1.5">× {item.quantity}</span>}
      </span>
      <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(item.id)} className="text-text-muted hover:text-error transition-colors">
        <Trash2 size={14} />
      </motion.button>
    </motion.div>
  );
}
