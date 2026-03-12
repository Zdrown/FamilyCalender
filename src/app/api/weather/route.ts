import { NextResponse } from 'next/server';

interface WeatherData {
  current: { temp: number; description: string; icon: string; humidity: number; wind: number };
  forecast: { date: string; high: number; low: number; icon: string; description: string }[];
}

let cache: { data: WeatherData; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '40.7128';
  const lng = searchParams.get('lng') || '-74.0060';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  // If no API key, return mock data
  if (!apiKey) {
    const mock: WeatherData = {
      current: { temp: 72, description: 'Partly Cloudy', icon: '⛅', humidity: 55, wind: 8 },
      forecast: Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
          date: d.toISOString().split('T')[0],
          high: 70 + Math.round(Math.random() * 10),
          low: 55 + Math.round(Math.random() * 8),
          icon: ['☀️', '⛅', '🌤️', '🌧️', '⛈️'][Math.floor(Math.random() * 5)],
          description: ['Sunny', 'Partly Cloudy', 'Mostly Clear', 'Light Rain', 'Thunderstorms'][Math.floor(Math.random() * 5)],
        };
      }),
    };
    cache = { data: mock, timestamp: Date.now() };
    return NextResponse.json(mock);
  }

  try {
    // Current weather
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${apiKey}`);
    const currentData = await currentRes.json();

    // 5-day forecast
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=imperial&appid=${apiKey}`);
    const forecastData = await forecastRes.json();

    const iconMap: Record<string, string> = {
      '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
      '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '🌨️', '50': '🌫️',
    };

    const getIcon = (code: string) => iconMap[code.slice(0, 2)] || '🌤️';

    // Group forecast by day
    const dailyMap = new Map<string, { temps: number[]; icon: string; desc: string }>();
    for (const item of forecastData.list || []) {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap.has(date)) dailyMap.set(date, { temps: [], icon: getIcon(item.weather[0].icon), desc: item.weather[0].main });
      dailyMap.get(date)!.temps.push(item.main.temp);
    }

    const weather: WeatherData = {
      current: {
        temp: Math.round(currentData.main.temp),
        description: currentData.weather[0].main,
        icon: getIcon(currentData.weather[0].icon),
        humidity: currentData.main.humidity,
        wind: Math.round(currentData.wind.speed),
      },
      forecast: Array.from(dailyMap.entries()).slice(0, 5).map(([date, d]) => ({
        date,
        high: Math.round(Math.max(...d.temps)),
        low: Math.round(Math.min(...d.temps)),
        icon: d.icon,
        description: d.desc,
      })),
    };

    cache = { data: weather, timestamp: Date.now() };
    return NextResponse.json(weather);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
