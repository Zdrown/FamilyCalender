'use client';

import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';

export function AutoRefresh() {
  useAutoRefresh();
  return null;
}
