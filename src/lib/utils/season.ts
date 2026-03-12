import type { Season } from '@/types';

export function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

export function applySeason(season: string) {
  const resolved = season === 'auto' ? getCurrentSeason() : season;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-season', resolved);
  }
  return resolved;
}
