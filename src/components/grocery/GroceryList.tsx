'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, ShoppingCart, Pencil, X } from 'lucide-react';
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
  const { data: items = [], addItem, toggleItem, updateItem, deleteItem, clearChecked } = useGrocery();
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<GroceryItem['category']>('other');
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editCategory, setEditCategory] = useState<GroceryItem['category']>('other');

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

  const handleEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setEditName(item.item);
    setEditQty(item.quantity || '');
    setEditCategory(item.category);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editName.trim()) return;
    updateItem.mutate({ id: editingItem.id, item: editName, quantity: editQty || null, category: editCategory });
    setEditingItem(null);
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
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => clearChecked.mutate()} className="px-3 py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 rounded-xl bg-bg-secondary text-text-muted font-body text-xs lg:text-sm font-semibold hover:text-error transition-colors min-h-[44px] lg:min-h-[48px]">
              Clear done
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3.5 py-2 lg:px-5 lg:py-2.5 xl:px-6 xl:py-3 rounded-xl bg-accent-primary text-white font-body font-semibold text-xs lg:text-sm min-h-[44px] lg:min-h-[48px]">
            <Plus size={15} className="lg:w-[18px] lg:h-[18px]" /> Add
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

      {/* Edit inline form */}
      <AnimatePresence>
        {editingItem && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-bg-card rounded-2xl border-2 border-accent-primary/30 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-xs font-bold text-accent-primary">Editing item</span>
              <button onClick={() => setEditingItem(null)} className="text-text-muted"><X size={16} /></button>
            </div>
            <div className="flex gap-2">
              <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} placeholder="Item name" className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30" />
              <input value={editQty} onChange={(e) => setEditQty(e.target.value)} placeholder="Qty" className="w-20 px-3 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} onClick={() => setEditCategory(cat.key)} className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${editCategory === cat.key ? 'text-white shadow-sm' : 'bg-bg-secondary text-text-secondary'}`} style={editCategory === cat.key ? { backgroundColor: cat.color } : {}}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveEdit} className="px-4 py-2 rounded-xl bg-accent-primary text-white font-body font-semibold text-xs">Save</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary font-body text-xs">Cancel</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items by category — scrollable */}
      <div className="overflow-y-auto max-h-[50vh] lg:max-h-[40vh] space-y-4 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {grouped.map((group) => (
          <div key={group.key}>
            <p className="font-body text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <GroceryRow key={item.id} item={item} onToggle={toggleItem.mutate} onDelete={deleteItem.mutate} onEdit={handleEdit} />
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
    </div>
  );
}

function GroceryRow({ item, onToggle, onDelete, onEdit }: { item: GroceryItem; onToggle: (v: { id: string; checked: boolean }) => void; onDelete: (id: string) => void; onEdit: (item: GroceryItem) => void }) {
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
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <div className="relative">
      <motion.div
        layout
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`flex items-center gap-3 px-4 py-3 md:py-2.5 lg:py-3 rounded-2xl md:rounded-xl bg-bg-card border border-border transition-opacity select-none min-h-[48px] ${item.checked ? 'opacity-40' : ''}`}
      >
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => onToggle({ id: item.id, checked: !item.checked })}
          className={`w-7 h-7 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${item.checked ? 'bg-success border-success text-white' : 'border-border'}`}
        >
          {item.checked && <Check size={14} strokeWidth={3} />}
        </motion.button>
        <span className={`flex-1 font-body text-sm ${item.checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {item.item}
          {item.quantity && <span className="text-text-muted ml-1.5">× {item.quantity}</span>}
        </span>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(item.id)} className="text-text-muted hover:text-error transition-colors p-1.5 -m-1.5 lg:p-2 lg:-m-2">
          <Trash2 size={14} className="lg:w-[16px] lg:h-[16px]" />
        </motion.button>
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
                onClick={() => { setShowActions(false); onEdit(item); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold text-accent-primary hover:bg-accent-primary/10 transition-colors"
              >
                <Pencil size={14} /> Edit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { setShowActions(false); onDelete(item.id); }}
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
