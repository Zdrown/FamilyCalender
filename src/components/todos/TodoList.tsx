'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flag, Check, Trash2, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import { useTodos } from '@/lib/hooks/useTodos';
import { useUsers } from '@/lib/hooks/useUsers';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Todo } from '@/types';

const PRIORITY_CONFIG = {
  high: { color: '#E57373', label: 'High', sortValue: 0 },
  medium: { color: '#F0C75E', label: 'Medium', sortValue: 1 },
  low: { color: '#81C784', label: 'Low', sortValue: 2 },
} as const;

export function TodoList({ userId }: { userId?: string }) {
  const { data: todos = [], addTodo, updateTodo, toggleTodo, deleteTodo } = useTodos();
  const { data: users = [] } = useUsers();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [showDone, setShowDone] = useState(false);

  // Edit state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const filteredTodos = userId
    ? todos.filter((t) => t.todo_users?.some((tu) => tu.user_id === userId) || t.created_by === userId)
    : todos;

  const active = filteredTodos
    .filter((t) => !t.completed)
    .sort((a, b) => PRIORITY_CONFIG[a.priority].sortValue - PRIORITY_CONFIG[b.priority].sortValue);
  const done = filteredTodos.filter((t) => t.completed);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTodo.mutate({ title, priority, userIds: assignTo, created_by: userId || null });
    setTitle('');
    setPriority('medium');
    setAssignTo([]);
    setShowAdd(false);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
  };

  const handleSaveEdit = () => {
    if (!editingTodo || !editTitle.trim()) return;
    updateTodo.mutate({ id: editingTodo.id, title: editTitle, priority: editPriority });
    setEditingTodo(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text-primary">To-Do</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-primary text-white font-body font-semibold text-xs"
        >
          <Plus size={15} /> Add
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-bg-card rounded-2xl border border-border p-4 space-y-3">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
            <div className="flex items-center gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${priority === p ? 'ring-2 shadow-sm' : 'opacity-50'}`}
                  style={{ backgroundColor: `${PRIORITY_CONFIG[p].color}20`, color: PRIORITY_CONFIG[p].color, '--tw-ring-color': PRIORITY_CONFIG[p].color } as React.CSSProperties}
                >
                  <Flag size={12} /> {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setAssignTo((prev) => prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-body transition-all ${assignTo.includes(u.id) ? 'ring-2 bg-bg-secondary' : 'opacity-40'}`}
                  style={assignTo.includes(u.id) ? { '--tw-ring-color': u.avatar_color } as React.CSSProperties : {}}
                >
                  <UserAvatar name={u.name} color={u.avatar_color} size="xs" /> {u.name}
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

      {/* Edit form */}
      <AnimatePresence>
        {editingTodo && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-bg-card rounded-2xl border-2 border-accent-primary/30 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-xs font-bold text-accent-primary">Editing to-do</span>
              <button onClick={() => setEditingTodo(null)} className="text-text-muted"><X size={16} /></button>
            </div>
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30"
            />
            <div className="flex items-center gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setEditPriority(p)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${editPriority === p ? 'ring-2 shadow-sm' : 'opacity-50'}`}
                  style={{ backgroundColor: `${PRIORITY_CONFIG[p].color}20`, color: PRIORITY_CONFIG[p].color, '--tw-ring-color': PRIORITY_CONFIG[p].color } as React.CSSProperties}
                >
                  <Flag size={12} /> {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveEdit} className="px-4 py-2 rounded-xl bg-accent-primary text-white font-body font-semibold text-xs">Save</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingTodo(null)} className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary font-body text-xs">Cancel</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active items */}
      <div className="space-y-2">
        {active.map((todo) => (
          <TodoItem key={todo.id} todo={todo} users={users} onToggle={toggleTodo.mutate} onDelete={deleteTodo.mutate} onEdit={handleEdit} />
        ))}
        {active.length === 0 && <p className="text-text-muted font-body text-sm italic py-2">All done! 🎉</p>}
      </div>

      {/* Done section */}
      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-2 text-text-muted font-body text-xs font-semibold py-1">
            {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {done.length} completed
          </button>
          <AnimatePresence>
            {showDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden pt-2">
                {done.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} users={users} onToggle={toggleTodo.mutate} onDelete={deleteTodo.mutate} onEdit={handleEdit} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, users, onToggle, onDelete, onEdit }: { todo: Todo; users: import('@/types').User[]; onToggle: (v: { id: string; completed: boolean }) => void; onDelete: (id: string) => void; onEdit: (todo: Todo) => void }) {
  const assignedUsers = users.filter((u) => todo.todo_users?.some((tu) => tu.user_id === u.id));
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
        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-card border border-border transition-opacity select-none ${todo.completed ? 'opacity-50' : ''}`}
      >
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => onToggle({ id: todo.id, completed: !todo.completed })}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${todo.completed ? 'bg-success border-success text-white' : 'border-border'}`}
        >
          {todo.completed && <Check size={14} strokeWidth={3} />}
        </motion.button>

        <div className="flex-1 min-w-0">
          <p className={`font-body text-sm ${todo.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>{todo.title}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[todo.priority].color }} title={todo.priority} />
          {assignedUsers.map((u) => (
            <UserAvatar key={u.id} name={u.name} color={u.avatar_color} size="xs" />
          ))}
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(todo.id)} className="ml-1 text-text-muted hover:text-error transition-colors">
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
                onClick={() => { setShowActions(false); onEdit(todo); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold text-accent-primary hover:bg-accent-primary/10 transition-colors"
              >
                <Pencil size={14} /> Edit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { setShowActions(false); onDelete(todo.id); }}
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
