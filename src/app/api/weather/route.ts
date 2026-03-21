import { NextResponse } from 'next/server';

interface WeatherData {
  current: { temp: number; description: string; icon: string; humidity: number; wind: number };
  forecast: { date: string; high: number; low: number; icon: string; description: string }[];
}

const cache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// WMO Weather interpretation codes → icon key + description
function wmoToWeather(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: 'sun', description: 'Clear' };
  if (code <= 3) return { icon: 'cloud-sun', description: 'Partly Cloudy' };
  if (code <= 48) return { icon: 'cloud-fog', description: 'Foggy' };
  if (code <= 55) return { icon: 'cloud-drizzle', description: 'Drizzle' };
  if (code <= 57) return { icon: 'cloud-drizzle', description: 'Freezing Drizzle' };
  if (code <= 65) return { icon: 'cloud-rain', description: 'Rain' };
  if (code <= 67) return { icon: 'cloud-rain', description: 'Freezing Rain' };
  if (code <= 77) return { icon: 'snowflake', description: 'Snow' };
  if (code <= 82) return { icon: 'cloud-rain-wind', description: 'Rain Showers' };
  if (code <= 86) return { icon: 'snowflake', description: 'Snow Showers' };
  if (code <= 99) return { icon: 'cloud-lightning', description: 'Thunderstorm' };
  return { icon: 'cloud', description: 'Unknown' };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Default: Wakefield, MA (suburb of Boston)
  const lat = searchParams.get('lat') || '42.5039';
  const lng = searchParams.get('lng') || '-71.0723';

  // Round coords to 2 decimals for cache key stability
  const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)}`;

  // Return cached data if fresh
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Open-Meteo: free, no API key required
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=6`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo fetch failed');
    const data = await res.json();

    const currentWmo = wmoToWeather(data.current.weather_code);

    const weather: WeatherData = {
      current: {
        temp: Math.round(data.current.temperature_2m),
        description: currentWmo.description,
        icon: currentWmo.icon,
        humidity: data.current.relative_humidity_2m,
        wind: Math.round(data.current.wind_speed_10m),
      },
      forecast: data.daily.time.slice(1, 6).map((date: string, i: number) => {
        const wmo = wmoToWeather(data.daily.weather_code[i + 1]);
        return {
          date,
          high: Math.round(data.daily.temperature_2m_max[i + 1]),
          low: Math.round(data.daily.temperature_2m_min[i + 1]),
          icon: wmo.icon,
          description: wmo.description,
        };
      }),
    };

    cache.set(cacheKey, { data: weather, timestamp: Date.now() });
    return NextResponse.json(weather);
  } catch {
    // Fallback mock if API fails
    const mock: WeatherData = {
      current: { temp: 72, description: 'Partly Cloudy', icon: 'cloud-sun', humidity: 55, wind: 8 },
      forecast: Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
          date: d.toISOString().split('T')[0],
          high: 70 + Math.round(Math.random() * 10),
          low: 55 + Math.round(Math.random() * 8),
          icon: ['sun', 'cloud-sun', 'cloud', 'cloud-rain', 'cloud-lightning'][Math.floor(Math.random() * 5)],
          description: ['Sunny', 'Partly Cloudy', 'Mostly Clear', 'Light Rain', 'Thunderstorms'][Math.floor(Math.random() * 5)],
        };
      }),
    };
    return NextResponse.json(mock);
  }
}
