'use client';

import { useQuery } from '@tanstack/react-query';
import { Droplets, Wind } from 'lucide-react';

interface WeatherData {
  current: { temp: number; description: string; icon: string; humidity: number; wind: number };
  forecast: { date: string; high: number; low: number; icon: string; description: string }[];
}

export function WeatherWidget({ compact }: { compact?: boolean }) {
  const { data: weather } = useQuery<WeatherData>({
    queryKey: ['weather'],
    queryFn: async () => {
      const res = await fetch('/api/weather');
      if (!res.ok) throw new Error('Weather fetch failed');
      return res.json();
    },
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });

  if (!weather) {
    return (
      <div className="bg-bg-card rounded-2xl border border-border p-4 animate-pulse">
        <div className="h-12 bg-bg-secondary rounded-xl" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-bg-card rounded-2xl border border-border">
        <span className="text-3xl">{weather.current.icon}</span>
        <div>
          <p className="font-display text-2xl font-bold text-text-primary leading-none">{weather.current.temp}°</p>
          <p className="font-body text-xs text-text-muted">{weather.current.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-2xl border border-border p-5 space-y-4">
      {/* Current */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-4xl font-bold text-text-primary leading-none">{weather.current.temp}°</p>
          <p className="font-body text-sm text-text-secondary mt-1">{weather.current.description}</p>
        </div>
        <span className="text-5xl">{weather.current.icon}</span>
      </div>

      <div className="flex gap-4 text-text-muted">
        <span className="flex items-center gap-1 font-body text-xs"><Droplets size={13} /> {weather.current.humidity}%</span>
        <span className="flex items-center gap-1 font-body text-xs"><Wind size={13} /> {weather.current.wind} mph</span>
      </div>

      {/* Forecast */}
      <div className="flex gap-2 pt-2 border-t border-border">
        {weather.forecast.map((day) => {
          const d = new Date(day.date + 'T12:00:00');
          const dayName = d.toLocaleDateString('en', { weekday: 'short' });
          return (
            <div key={day.date} className="flex-1 text-center">
              <p className="font-body text-[10px] text-text-muted font-semibold uppercase">{dayName}</p>
              <p className="text-xl my-0.5">{day.icon}</p>
              <p className="font-body text-xs text-text-primary font-semibold">{day.high}°</p>
              <p className="font-body text-[10px] text-text-muted">{day.low}°</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
