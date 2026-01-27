import { useState } from "react";
import { Cloud, Droplets, Wind, Thermometer, X } from "lucide-react";
import { WeatherData } from "@/hooks/useWeather";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeatherToggleProps {
  weather: WeatherData | null;
  loading: boolean;
  className?: string;
}

export function WeatherToggle({ weather, loading, className }: WeatherToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      {/* Weather Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-2",
          isOpen && "bg-primary/20 text-primary"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Cloud className="w-4 h-4" />
        {weather && (
          <span className="hidden sm:inline text-xs">
            {weather.temperature}°F
          </span>
        )}
      </Button>

      {/* Weather Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 surface-glass rounded-xl p-4 shadow-lg z-[2000]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Weather</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          ) : !weather ? (
            <p className="text-sm text-muted-foreground">
              Weather data will load when location is available.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="text-3xl">{weather.icon}</div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {weather.temperature}
                    </span>
                    <span className="text-sm text-muted-foreground">°F</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{weather.conditions}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                    <p className="text-xs font-medium text-foreground">{weather.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Wind</p>
                    <p className="text-xs font-medium text-foreground">{weather.wind_speed} mph</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3 h-3 text-orange-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Precip</p>
                    <p className="text-xs font-medium text-foreground">{weather.precipitation} mm</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">{weather.location}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
