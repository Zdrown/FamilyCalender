'use client';

import { useEffect, useRef } from 'react';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAutoRefresh() {
  const baselineVersion = useRef<string | null>(null);

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();

        if (baselineVersion.current && baselineVersion.current !== version) {
          window.location.reload();
        }
        baselineVersion.current = version;
      } catch {
        // Network error — skip this check
      }
    };

    checkForUpdate(); // set baseline
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}
