'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw, Check } from 'lucide-react';

const LOCATION_STORAGE_KEY = 'weather-user-location';

export function WeatherSettings() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [savedLocation, setSavedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        setSavedLocation(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSavedLocation(loc);
        try { localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc)); } catch {}
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
      },
      () => {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      },
      { timeout: 10000, maximumAge: 0 }
    );
  };

  const handleResetToDefault = () => {
    try { localStorage.removeItem(LOCATION_STORAGE_KEY); } catch {}
    setSavedLocation(null);
    setStatus('idle');
  };

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <h3 className="font-display text-lg font-bold text-text-primary mb-1">Weather Location</h3>
      <p className="font-body text-sm text-text-muted mb-4">
        {savedLocation
          ? `Using your location (${savedLocation.lat.toFixed(2)}, ${savedLocation.lng.toFixed(2)})`
          : 'Using default: Wakefield, MA (Boston area)'}
      </p>

      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleRequestLocation}
          disabled={status === 'requesting'}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-primary text-white font-body font-semibold text-sm shadow-md hover:shadow-lg transition-all min-h-[48px] disabled:opacity-60"
        >
          {status === 'requesting' ? (
            <><RefreshCw size={16} className="animate-spin" /> Getting location…</>
          ) : status === 'success' ? (
            <><Check size={16} /> Location updated!</>
          ) : status === 'error' ? (
            <>Location blocked — check browser settings</>
          ) : (
            <><MapPin size={16} /> Use My Location</>
          )}
        </motion.button>

        {savedLocation && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleResetToDefault}
            className="px-4 py-3 rounded-xl bg-bg-secondary text-text-muted font-body font-medium text-sm border border-border hover:bg-bg-primary transition-all min-h-[48px]"
          >
            Reset
          </motion.button>
        )}
      </div>
    </div>
  );
}
