import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeSlider } from "./TimeSlider";
import { GeoprocessingToolbar, GeoTool } from "./GeoprocessingToolbar";
import { DataLayerUpload, CustomLayer } from "./DataLayerUpload";
import { AlertsPanel, Alert, AlertNotification } from "./AlertsPanel";
import { ExportPanel } from "./ExportPanel";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

interface MapToolsPanelProps {
  fields: Field[];
  currentYear: number;
  onYearChange: (year: number) => void;
  activeTool: GeoTool;
  onToolChange: (tool: GeoTool) => void;
  measurementResult?: { type: "distance" | "area"; value: number; unit: string } | null;
  customLayers: CustomLayer[];
  onCustomLayersChange: (layers: CustomLayer[]) => void;
  alerts: Alert[];
  notifications: AlertNotification[];
  onAlertsChange: (alerts: Alert[]) => void;
  onNotificationDismiss: (id: string) => void;
  className?: string;
}

export function MapToolsPanel({
  fields,
  currentYear,
  onYearChange,
  activeTool,
  onToolChange,
  measurementResult,
  customLayers,
  onCustomLayersChange,
  alerts,
  notifications,
  onAlertsChange,
  onNotificationDismiss,
  className,
}: MapToolsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

  // Auto-play time slider
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const currentIndex = years.indexOf(currentYear);
      if (currentIndex < years.length - 1) {
        onYearChange(years[currentIndex + 1]);
      } else {
        setIsPlaying(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, currentYear, years, onYearChange]);

  const handlePlayToggle = useCallback(() => {
    if (!isPlaying && currentYear === years[years.length - 1]) {
      onYearChange(years[0]);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentYear, years, onYearChange]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="self-end surface-glass"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Wrench className="w-4 h-4 mr-2" />
        Tools
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </Button>

      {/* Tools Content */}
      {isExpanded && (
        <div className="space-y-3 animate-fade-in">
          {/* Time-Series Slider */}
          <TimeSlider
            years={years}
            currentYear={currentYear}
            onYearChange={onYearChange}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
          />

          {/* Geoprocessing Toolbar */}
          <GeoprocessingToolbar
            activeTool={activeTool}
            onToolChange={onToolChange}
            measurementResult={measurementResult}
          />

          {/* Custom Data Layers */}
          <DataLayerUpload
            layers={customLayers}
            onLayersChange={onCustomLayersChange}
          />

          {/* Alerts Panel */}
          <AlertsPanel
            alerts={alerts}
            notifications={notifications}
            onAlertsChange={onAlertsChange}
            onNotificationDismiss={onNotificationDismiss}
          />

          {/* Export Panel */}
          <ExportPanel fields={fields} />
        </div>
      )}
    </div>
  );
}
