'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Droplets, Wind, Sun, Cloud, CloudSun, CloudRain,
  CloudDrizzle, CloudSnow, CloudLightning, CloudFog,
  CloudRainWind, Snowflake,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WeatherData {
  current: { temp: number; description: string; icon: string; humidity: number; wind: number };
  forecast: { date: string; high: number; low: number; icon: string; description: string }[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  'sun': Sun,
  'cloud': Cloud,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  'cloud-drizzle': CloudDrizzle,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  'cloud-fog': CloudFog,
  'cloud-rain-wind': CloudRainWind,
  'snowflake': Snowflake,
};

const ICON_COLORS: Record<string, string> = {
  'sun': '#FBBF24',
  'cloud': '#94A3B8',
  'cloud-sun': '#F59E0B',
  'cloud-rain': '#60A5FA',
  'cloud-drizzle': '#93C5FD',
  'cloud-snow': '#CBD5E1',
  'cloud-lightning': '#A78BFA',
  'cloud-fog': '#9CA3AF',
  'cloud-rain-wind': '#3B82F6',
  'snowflake': '#BAE6FD',
};

function WeatherIcon({ icon, size, className }: { icon: string; size: number; className?: string }) {
  const Icon = ICON_MAP[icon] || Cloud;
  const color = ICON_COLORS[icon] || '#94A3B8';
  return <Icon size={size} color={color} className={className} />;
}

function useUserLocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setTried(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setTried(true); },
      () => setTried(true),
      { timeout: 5000, maximumAge: 600000 }
    );
  }, []);

  return { coords, tried };
}

const WEATHER_GRADIENT = 'from-sky-500 via-blue-500 to-indigo-500';

export function WeatherWidget({ compact }: { compact?: boolean }) {
  const { coords, tried } = useUserLocation();

  const { data: weather, isLoading } = useQuery<WeatherData>({
    queryKey: ['weather', coords?.lat ?? 'default', coords?.lng ?? 'default'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (coords) {
        params.set('lat', coords.lat.toFixed(4));
        params.set('lng', coords.lng.toFixed(4));
      }
      const res = await fetch(`/api/weather?${params.toString()}`);
      if (!res.ok) throw new Error('Weather fetch failed');
      return res.json();
    },
    enabled: tried,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });

  if (isLoading || !weather) {
    return (
      <div className="rounded-2xl overflow-hidden animate-pulse">
        <div className={`bg-gradient-to-br from-sky-400 to-blue-500 ${compact ? 'h-12' : 'h-56'} rounded-2xl`} />
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r ${WEATHER_GRADIENT} shadow-lg`}>
        <WeatherIcon icon={weather.current.icon} size={28} />
        <div>
          <p className="font-display text-2xl font-bold leading-none text-white drop-shadow-sm">{weather.current.temp}°</p>
          <p className="font-body text-xs text-white opacity-80">{weather.current.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl">
      {/* Current weather hero */}
      <div className={`bg-gradient-to-br ${WEATHER_GRADIENT} p-6 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)',
        }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-6xl font-black leading-none text-white drop-shadow-lg">
                {weather.current.temp}°
              </p>
              <p className="font-body text-lg font-medium mt-2 text-white drop-shadow-sm">
                {weather.current.description}
              </p>
            </div>
            <WeatherIcon icon={weather.current.icon} size={72} className="drop-shadow-xl" />
          </div>

          <div className="flex gap-5 mt-4 text-white opacity-90">
            <span className="flex items-center gap-1.5 font-body text-sm">
              <Droplets size={16} className="drop-shadow-sm" /> {weather.current.humidity}%
            </span>
            <span className="flex items-center gap-1.5 font-body text-sm">
              <Wind size={16} className="drop-shadow-sm" /> {weather.current.wind} mph
            </span>
          </div>
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="bg-bg-card p-4">
        <p className="font-display text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Forecast</p>
        <div className="flex gap-2">
          {weather.forecast.map((day) => {
            const d = new Date(day.date + 'T12:00:00');
            const dayName = d.toLocaleDateString('en', { weekday: 'short' });

            return (
              <div
                key={day.date}
                className="flex-1 text-center rounded-xl p-2.5 bg-bg-secondary border border-border/50 transition-transform hover:scale-105"
              >
                <p className="font-body text-[10px] text-text-muted font-bold uppercase tracking-wide">{dayName}</p>
                <div className="flex justify-center my-1">
                  <WeatherIcon icon={day.icon} size={24} />
                </div>
                <p className="font-display text-sm font-bold text-text-primary">{day.high}°</p>
                <p className="font-body text-[10px] text-text-muted">{day.low}°</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
