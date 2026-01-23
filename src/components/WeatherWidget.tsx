import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";
import { WeatherData } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

interface WeatherWidgetProps {
  weather: WeatherData | null;
  loading: boolean;
  className?: string;
}

export function WeatherWidget({ weather, loading, className }: WeatherWidgetProps) {
  if (loading) {
    return (
      <div className={cn("surface-glass rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-foreground">Weather</span>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={cn("surface-glass rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Weather</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Weather data will load when location is available.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("surface-glass rounded-xl p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Current Weather</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-4xl">{weather.icon}</div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">{weather.temperature}</span>
            <span className="text-lg text-muted-foreground">°F</span>
          </div>
          <p className="text-sm text-muted-foreground">{weather.conditions}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className="text-sm font-medium text-foreground">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-xs text-muted-foreground">Wind</p>
            <p className="text-sm font-medium text-foreground">{weather.wind_speed} mph</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-orange-400" />
          <div>
            <p className="text-xs text-muted-foreground">Precip</p>
            <p className="text-sm font-medium text-foreground">{weather.precipitation} mm</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">{weather.location}</p>
    </div>
  );
}
