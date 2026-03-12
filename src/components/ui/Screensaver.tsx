'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getScreensaverConfig, type ScreensaverConfig } from '@/components/settings/ScreensaverSettings';

const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function Screensaver() {
  const [config, setConfig] = useState<ScreensaverConfig | null>(null);
  const [active, setActive] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Load config
  useEffect(() => {
    setConfig(getScreensaverConfig());
    const handler = (e: Event) => setConfig((e as CustomEvent).detail);
    window.addEventListener('screensaver-config-changed', handler);
    return () => window.removeEventListener('screensaver-config-changed', handler);
  }, []);

  const timeoutSeconds = config?.sleepTimeout ?? 300;
  const slideshowEnabled = config?.slideshowEnabled ?? true;
  const slideshowInterval = (config?.slideshowInterval ?? 8) * 1000;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(false);
    if (timeoutSeconds > 0) {
      timerRef.current = setTimeout(() => setActive(true), timeoutSeconds * 1000);
    }
  }, [timeoutSeconds]);

  // Fetch photos
  useEffect(() => {
    if (!slideshowEnabled) return;
    const supabase = createClient();
    supabase
      .from('photos')
      .select('url')
      .eq('family_id', FAMILY_ID)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) setPhotos(data.map((p) => p.url));
      });
  }, [slideshowEnabled]);

  // Idle detection
  useEffect(() => {
    if (timeoutSeconds === 0) return; // Never sleep
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer, timeoutSeconds]);

  // Photo rotation
  useEffect(() => {
    if (active && slideshowEnabled && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx((i) => (i + 1) % photos.length);
      }, slideshowInterval);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [active, photos.length, slideshowEnabled, slideshowInterval]);

  if (!active || !slideshowEnabled || photos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      onClick={resetTimer}
      onTouchStart={resetTimer}
      className="fixed inset-0 z-[9999] bg-black cursor-none"
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIdx}
          src={photos[currentIdx]}
          alt=""
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </AnimatePresence>
      {/* Clock overlay */}
      <div className="absolute bottom-8 right-8 text-white/70 font-display text-5xl font-light drop-shadow-lg">
        <Clock />
      </div>
    </motion.div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
