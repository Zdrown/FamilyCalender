'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Droplets, Wind } from 'lucide-react';

interface WeatherData {
  current: { temp: number; description: string; icon: string; humidity: number; wind: number };
  forecast: { date: string; high: number; low: number; icon: string; description: string }[];
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

// Weather condition → gradient backgrounds
function getWeatherGradient(description: string, isNight = false): string {
  const d = description.toLowerCase();
  if (isNight) return 'from-indigo-900 via-slate-800 to-purple-900';
  if (d.includes('thunder')) return 'from-slate-800 via-purple-900 to-slate-700';
  if (d.includes('snow')) return 'from-blue-100 via-slate-200 to-blue-200';
  if (d.includes('rain') || d.includes('drizzle')) return 'from-slate-500 via-blue-600 to-slate-600';
  if (d.includes('fog')) return 'from-gray-300 via-slate-400 to-gray-400';
  if (d.includes('cloud') || d.includes('partly')) return 'from-sky-400 via-blue-300 to-slate-300';
  return 'from-amber-400 via-orange-300 to-sky-400'; // clear/sunny
}

function getWeatherTextColor(description: string): string {
  const d = description.toLowerCase();
  if (d.includes('snow')) return 'text-slate-800';
  if (d.includes('fog')) return 'text-slate-700';
  return 'text-white';
}

function getDayGradient(description: string): string {
  const d = description.toLowerCase();
  if (d.includes('thunder')) return 'from-purple-600/20 to-slate-600/20';
  if (d.includes('snow')) return 'from-blue-200/30 to-slate-200/30';
  if (d.includes('rain') || d.includes('drizzle')) return 'from-blue-500/20 to-slate-500/20';
  if (d.includes('fog')) return 'from-gray-300/20 to-slate-300/20';
  if (d.includes('cloud') || d.includes('partly')) return 'from-sky-300/20 to-slate-200/20';
  return 'from-amber-300/20 to-orange-200/20';
}

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
    enabled: tried, // wait until geolocation attempt is done
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

  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 20;
  const gradient = getWeatherGradient(weather.current.description, isNight);
  const textColor = getWeatherTextColor(weather.current.description);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg`}>
        <span className="text-3xl drop-shadow-md">{weather.current.icon}</span>
        <div>
          <p className={`font-display text-2xl font-bold leading-none ${textColor} drop-shadow-sm`}>{weather.current.temp}°</p>
          <p className={`font-body text-xs ${textColor} opacity-80`}>{weather.current.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl">
      {/* Current weather — full color hero */}
      <div className={`bg-gradient-to-br ${gradient} p-6 relative overflow-hidden`}>
        {/* Atmospheric overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)',
        }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className={`font-display text-6xl font-black leading-none ${textColor} drop-shadow-lg`}>
                {weather.current.temp}°
              </p>
              <p className={`font-body text-lg font-medium mt-2 ${textColor} drop-shadow-sm`}>
                {weather.current.description}
              </p>
            </div>
            <span className="text-7xl drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
              {weather.current.icon}
            </span>
          </div>

          <div className={`flex gap-5 mt-4 ${textColor} opacity-90`}>
            <span className="flex items-center gap-1.5 font-body text-sm">
              <Droplets size={16} className="drop-shadow-sm" /> {weather.current.humidity}%
            </span>
            <span className="flex items-center gap-1.5 font-body text-sm">
              <Wind size={16} className="drop-shadow-sm" /> {weather.current.wind} mph
            </span>
          </div>
        </div>
      </div>

      {/* 5-day forecast — colorful cards */}
      <div className="bg-bg-card p-4">
        <p className="font-display text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Week Ahead</p>
        <div className="flex gap-2">
          {weather.forecast.map((day) => {
            const d = new Date(day.date + 'T12:00:00');
            const dayName = d.toLocaleDateString('en', { weekday: 'short' });
            const dayGradient = getDayGradient(day.description);

            return (
              <div
                key={day.date}
                className={`flex-1 text-center rounded-xl p-2.5 bg-gradient-to-b ${dayGradient} border border-border/50 transition-transform hover:scale-105`}
              >
                <p className="font-body text-[10px] text-text-muted font-bold uppercase tracking-wide">{dayName}</p>
                <p className="text-2xl my-1 drop-shadow-sm">{day.icon}</p>
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
