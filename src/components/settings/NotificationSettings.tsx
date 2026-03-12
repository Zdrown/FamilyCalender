'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronDown, ChevronUp, Send, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUsers } from '@/lib/hooks/useUsers';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function NotificationSettings() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: users = [] } = useUsers();

  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const { data: family, isLoading } = useQuery({
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

  useEffect(() => {
    if (family) {
      setEmail(family.notification_email || '');
      setAppPassword(family.notification_app_password || '');
    }
  }, [family]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('families')
        .update({
          notification_email: email || null,
          notification_app_password: appPassword || null,
        })
        .eq('id', FAMILY_ID);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-notifications'] });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: (err: Error) => {
      setSaveStatus('error');
      setSaveError(err.message);
      setTimeout(() => setSaveStatus('idle'), 4000);
    },
  });

  const handleTest = async () => {
    const testUser = users.find(u => u.phone_number && u.carrier);
    if (!testUser) return;

    setTestStatus('sending');
    setTestError('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ userId: testUser.id, name: testUser.name }],
          message: `👋 Hey ${testUser.name}, texts are working!`,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send');
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    } catch (err: unknown) {
      setTestStatus('error');
      setTestError(err instanceof Error ? err.message : 'Failed to send test');
      setTimeout(() => setTestStatus('idle'), 4000);
    }
  };

  const testUser = users.find(u => u.phone_number && u.carrier);
  const hasCredentials = email.trim() && appPassword.trim();

  return (
    <div className="space-y-6 pt-6 border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📱</span>
        <h2 className="font-display text-2xl font-bold text-text-primary">Text Notifications</h2>
      </div>

      <p className="font-body text-sm text-text-secondary leading-relaxed">
        Send reminders and nudges via text message. Uses a Gmail account to send texts — set it up once and everyone can receive notifications.
      </p>

      <div className="bg-bg-card rounded-2xl border border-border p-5 space-y-4">
        {/* Gmail Address */}
        <div className="space-y-1.5">
          <label className="font-body text-xs font-semibold text-text-muted uppercase tracking-wide">Gmail Address</label>
          <input
            type="email"
            placeholder="family@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30 transition-shadow"
          />
        </div>

        {/* App Password */}
        <div className="space-y-1.5">
          <label className="font-body text-xs font-semibold text-text-muted uppercase tracking-wide">App Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="xxxx xxxx xxxx xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30 font-mono transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Help accordion */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2 font-body text-xs text-accent-primary font-semibold hover:underline transition-colors"
        >
          {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          How to get an app password
        </button>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-bg-secondary rounded-xl p-4 space-y-2.5">
                {[
                  { step: '1', text: 'Go to myaccount.google.com' },
                  { step: '2', text: 'Security → 2-Step Verification → On' },
                  { step: '3', text: 'Search "App Passwords"' },
                  { step: '4', text: 'Create one for "Mail"' },
                  { step: '5', text: 'Paste the 16-character code above' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-primary/15 text-accent-primary font-body text-xs font-bold flex items-center justify-center">{step}</span>
                    <span className="font-body text-sm text-text-secondary">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white font-body font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleTest}
            disabled={!testUser || !hasCredentials || testStatus === 'sending'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-secondary font-body font-semibold text-sm hover:text-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {testStatus === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Test Notification
          </motion.button>
        </div>

        {/* Status messages */}
        <AnimatePresence>
          {saveStatus === 'success' && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-success font-body text-sm">
              <CheckCircle size={16} /> Settings saved
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-error font-body text-sm">
              <AlertCircle size={16} /> {saveError}
            </motion.div>
          )}
          {testStatus === 'success' && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-success font-body text-sm">
              <CheckCircle size={16} /> Test sent to {testUser?.name}!
            </motion.div>
          )}
          {testStatus === 'error' && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-error font-body text-sm">
              <AlertCircle size={16} /> {testError}
            </motion.div>
          )}
        </AnimatePresence>

        {!testUser && hasCredentials && (
          <p className="font-body text-xs text-text-muted italic">
            No family members have phone + carrier set up yet. Add that info above to test.
          </p>
        )}
      </div>
    </div>
  );
}
