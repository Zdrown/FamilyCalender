'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Image, Moon } from 'lucide-react';

const SLIDESHOW_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '5 sec', value: 5 },
  { label: '8 sec', value: 8 },
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
];

const SLEEP_TIMEOUTS = [
  { label: 'Never', value: 0 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
  { label: '30 min', value: 1800 },
  { label: '1 hour', value: 3600 },
];

const STORAGE_KEY = 'screensaver-settings';

export interface ScreensaverConfig {
  slideshowEnabled: boolean;
  slideshowInterval: number; // seconds between photos (0 = off)
  sleepTimeout: number; // seconds of idle before screensaver (0 = never)
}

const DEFAULT_CONFIG: ScreensaverConfig = {
  slideshowEnabled: true,
  slideshowInterval: 8,
  sleepTimeout: 300,
};

export function getScreensaverConfig(): ScreensaverConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: ScreensaverConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Dispatch event so Screensaver component can react
  window.dispatchEvent(new CustomEvent('screensaver-config-changed', { detail: config }));
}

export function ScreensaverSettings() {
  const [config, setConfig] = useState<ScreensaverConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfig(getScreensaverConfig());
  }, []);

  const update = (partial: Partial<ScreensaverConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    saveConfig(next);
  };

  return (
    <div className="space-y-5 mt-6">
      <h3 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
        <Monitor size={18} className="text-accent-primary" />
        Display & Screensaver
      </h3>

      {/* Slideshow toggle */}
      <div className="bg-bg-secondary rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image size={16} className="text-text-muted" />
            <span className="font-body text-sm font-medium text-text-primary">Photo Slideshow</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => update({ slideshowEnabled: !config.slideshowEnabled })}
            className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${
              config.slideshowEnabled ? 'bg-accent-primary' : 'bg-border'
            }`}
          >
            <motion.div
              animate={{ x: config.slideshowEnabled ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1"
            />
          </motion.button>
        </div>

        {config.slideshowEnabled && (
          <div className="space-y-2">
            <p className="font-body text-xs text-text-muted">Photo interval</p>
            <div className="flex flex-wrap gap-2">
              {SLIDESHOW_INTERVALS.filter(i => i.value > 0).map((opt) => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => update({ slideshowInterval: opt.value })}
                  className={`px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-colors min-h-[36px] ${
                    config.slideshowInterval === opt.value
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-card text-text-secondary border border-border'
                  }`}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sleep / Screensaver timeout */}
      <div className="bg-bg-secondary rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Moon size={16} className="text-text-muted" />
          <span className="font-body text-sm font-medium text-text-primary">Screensaver Timeout</span>
        </div>
        <p className="font-body text-xs text-text-muted">Time of inactivity before screensaver starts</p>
        <div className="flex flex-wrap gap-2">
          {SLEEP_TIMEOUTS.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => update({ sleepTimeout: opt.value })}
              className={`px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-colors min-h-[36px] ${
                config.sleepTimeout === opt.value
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-card text-text-secondary border border-border'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
