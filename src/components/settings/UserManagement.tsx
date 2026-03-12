'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, X, Check, RefreshCw, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUsers } from '@/lib/hooks/useUsers';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { User } from '@/types';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const AVATAR_COLORS = [
  '#E57373', '#F06292', '#BA68C8', '#9575CD', '#7986CB',
  '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC', '#81C784',
  '#AED581', '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F',
];

interface UserFormData {
  name: string;
  phone_number: string;
  carrier: string;
  avatar_color: string;
  ical_url: string;
}

export function UserManagement() {
  const { data: users = [], addUser, updateUser, deleteUser } = useUsers();
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<UserFormData>({ name: '', phone_number: '', carrier: '', avatar_color: AVATAR_COLORS[0], ical_url: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const resetForm = () => { setForm({ name: '', phone_number: '', carrier: '', avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)], ical_url: '' }); };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addUser.mutate({
      name: form.name,
      phone_number: form.phone_number || null,
      carrier: form.carrier || null,
      avatar_color: form.avatar_color,
      sort_order: users.length,
    });
    resetForm();
    setShowAdd(false);
  };

  const handleEdit = (user: User) => {
    setEditing(user.id);
    setForm({ name: user.name, phone_number: user.phone_number || '', carrier: user.carrier || '', avatar_color: user.avatar_color, ical_url: user.ical_url || '' });
  };

  const handleSave = (id: string) => {
    updateUser.mutate({
      id,
      name: form.name,
      phone_number: form.phone_number || null,
      carrier: form.carrier || null,
      avatar_color: form.avatar_color,
      ical_url: form.ical_url || null,
    });
    setEditing(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteUser.mutate(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-text-primary">Family Members</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-primary text-white font-body font-semibold text-sm shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={18} /> Add Member
        </motion.button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-bg-card rounded-2xl border border-border p-5 space-y-4">
              <h3 className="font-display text-lg font-semibold text-text-primary">New Family Member</h3>
              <UserFormFields form={form} setForm={setForm} />
              <div className="flex gap-3 pt-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent-primary text-white font-body font-semibold text-sm">
                  <Check size={16} /> Add
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl bg-bg-secondary text-text-secondary font-body font-semibold text-sm">
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User list */}
      <div className="space-y-3">
        {users.map((user) => (
          <motion.div
            key={user.id}
            layout
            className="bg-bg-card rounded-2xl border border-border p-5"
          >
            {editing === user.id ? (
              <div className="space-y-4">
                <UserFormFields form={form} setForm={setForm} userId={user.id} />
                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleSave(user.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-primary text-white font-body font-semibold text-sm">
                    <Check size={16} /> Save
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary font-body text-sm font-semibold">
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 md:gap-4 flex-wrap md:flex-nowrap">
                <UserAvatar name={user.name} color={user.avatar_color} size="md" />
                <div className="flex-1 min-w-0 basis-0">
                  <p className="font-body font-semibold text-text-primary text-base">{user.name}</p>
                  {user.phone_number && (
                    <p className="font-body text-sm text-text-muted">{user.phone_number} {user.carrier && `· ${user.carrier}`}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleEdit(user)} className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
                    <Edit3 size={16} />
                  </motion.button>
                  {confirmDelete === user.id ? (
                    <div className="flex items-center gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(user.id)} className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                        <Check size={16} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDelete(null)} className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-muted">
                        <X size={16} />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDelete(user.id)} className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-muted hover:text-error transition-colors">
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Reload button */}
      <div className="pt-4 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-bg-secondary border border-border text-text-secondary hover:text-text-primary font-body font-semibold text-sm transition-colors w-full justify-center"
        >
          <RefreshCw size={16} /> Reload Page
        </motion.button>
      </div>
    </div>
  );
}

function UserFormFields({ form, setForm, userId }: { form: UserFormData; setForm: (f: UserFormData) => void; userId?: string }) {
  const supabase = createClient();
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const { data: family } = useQuery({
    queryKey: ['family-notifications', FAMILY_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('families')
        .select('notification_email, notification_app_password')
        .eq('id', FAMILY_ID)
        .single();
      if (error) throw error;
      return data as { notification_email: string | null; notification_app_password: string | null };
    },
  });

  const hasGmail = !!(family?.notification_email && family?.notification_app_password);
  const canTest = !!(form.phone_number && form.carrier && hasGmail && userId);

  const handleTestText = async () => {
    if (!canTest) return;
    setTestStatus('sending');
    setTestError('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ userId, name: form.name }],
          message: `👋 Hey ${form.name}, texts are working!`,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send');
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    } catch (err: unknown) {
      setTestStatus('error');
      setTestError(err instanceof Error ? err.message : 'Failed');
      setTimeout(() => setTestStatus('idle'), 4000);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          className="px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30"
        />
        <select
          value={form.carrier}
          onChange={(e) => setForm({ ...form, carrier: e.target.value })}
          className="px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/30"
        >
          <option value="">Carrier (optional)</option>
          <option value="att">AT&T</option>
          <option value="verizon">Verizon</option>
          <option value="tmobile">T-Mobile</option>
          <option value="sprint">Sprint</option>
          <option value="uscellular">US Cellular</option>
          <option value="boost">Boost Mobile</option>
          <option value="cricket">Cricket</option>
          <option value="metro">Metro PCS</option>
        </select>
     </div>

     {/* Send Test Text */}
     {userId && (
       <div className="space-y-2">
         <div className="flex items-center gap-2">
           <motion.button
             whileTap={{ scale: 0.95 }}
             onClick={handleTestText}
             disabled={!canTest || testStatus === 'sending'}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-secondary font-body text-xs font-semibold hover:text-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
           >
             {testStatus === 'sending' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
             Send Test Text
           </motion.button>
           <AnimatePresence>
             {testStatus === 'success' && (
               <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-success font-body text-xs">
                 <CheckCircle size={12} /> Sent!
               </motion.span>
             )}
             {testStatus === 'error' && (
               <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-error font-body text-xs">
                 <AlertCircle size={12} /> {testError}
               </motion.span>
             )}
           </AnimatePresence>
         </div>
         {!hasGmail && form.phone_number && form.carrier && (
           <p className="font-body text-xs text-text-muted italic">Set up Gmail in notification settings first</p>
         )}
       </div>
     )}

     <input
       type="url"
       placeholder="Google Calendar iCal URL (optional)"
       value={form.ical_url}
       onChange={(e) => setForm({ ...form, ical_url: e.target.value })}
       className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30"
     />
     {/* Color picker */}
      <div>
        <p className="font-body text-xs text-text-muted mb-2">Avatar color</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setForm({ ...form, avatar_color: color })}
              className="w-8 h-8 rounded-full transition-transform"
              style={{
                backgroundColor: color,
                transform: form.avatar_color === color ? 'scale(1.25)' : 'scale(1)',
                boxShadow: form.avatar_color === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
