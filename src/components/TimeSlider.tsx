import { useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TimeSliderProps {
  years?: number[];
  currentYear: number;
  onYearChange: (year: number) => void;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  className?: string;
}

export function TimeSlider({
  years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  currentYear,
  onYearChange,
  isPlaying = false,
  onPlayToggle,
  className,
}: TimeSliderProps) {
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  const handleSliderChange = useCallback((value: number[]) => {
    onYearChange(value[0]);
  }, [onYearChange]);

  const handlePrevious = useCallback(() => {
    const currentIndex = years.indexOf(currentYear);
    if (currentIndex > 0) {
      onYearChange(years[currentIndex - 1]);
    }
  }, [currentYear, years, onYearChange]);

  const handleNext = useCallback(() => {
    const currentIndex = years.indexOf(currentYear);
    if (currentIndex < years.length - 1) {
      onYearChange(years[currentIndex + 1]);
    }
  }, [currentYear, years, onYearChange]);

  return (
    <div className={cn("surface-glass rounded-xl p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Time-Series Analysis</span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrevious}
            disabled={currentYear === minYear}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onPlayToggle}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
            disabled={currentYear === maxYear}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Year Display */}
        <div className="w-16 text-center">
          <span className="text-lg font-bold text-primary">{currentYear}</span>
        </div>

        {/* Slider */}
        <div className="flex-1">
          <Slider
            value={[currentYear]}
            min={minYear}
            max={maxYear}
            step={1}
            onValueChange={handleSliderChange}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{minYear}</span>
            <span className="text-xs text-muted-foreground">{maxYear}</span>
          </div>
        </div>
      </div>

      {/* Year Markers */}
      <div className="flex justify-between mt-2 px-24">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              year === currentYear
                ? "bg-primary scale-150"
                : "bg-muted-foreground/50 hover:bg-primary/50"
            )}
            title={year.toString()}
          />
        ))}
      </div>
    </div>
  );
}
