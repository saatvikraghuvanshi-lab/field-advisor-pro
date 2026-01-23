import { useState, useCallback } from "react";

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  conditions: string;
  icon: string;
  location: string;
}

// Mock weather data generator (in production, integrate with a weather API)
export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Generate realistic mock weather data based on location
      const baseTemp = 65 + Math.sin(lat * 0.1) * 15;
      const conditions = [
        { name: "Sunny", icon: "☀️" },
        { name: "Partly Cloudy", icon: "⛅" },
        { name: "Cloudy", icon: "☁️" },
        { name: "Light Rain", icon: "🌧️" },
        { name: "Clear", icon: "🌤️" },
      ];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      const mockWeather: WeatherData = {
        temperature: Math.round(baseTemp + (Math.random() - 0.5) * 20),
        humidity: Math.round(40 + Math.random() * 40),
        precipitation: Math.round(Math.random() * 15 * 10) / 10,
        wind_speed: Math.round(5 + Math.random() * 15),
        conditions: condition.name,
        icon: condition.icon,
        location: `${lat.toFixed(2)}°N, ${Math.abs(lng).toFixed(2)}°W`,
      };
      
      setWeather(mockWeather);
      return mockWeather;
    } catch (error) {
      console.error("Weather fetch error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, loading, fetchWeather };
}
