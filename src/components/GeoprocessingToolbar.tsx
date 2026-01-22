import { useState } from "react";
import { Ruler, Move, X, MapPin, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GeoTool = "none" | "measure-distance" | "measure-area" | "point-info";

interface GeoprocessingToolbarProps {
  activeTool: GeoTool;
  onToolChange: (tool: GeoTool) => void;
  measurementResult?: {
    type: "distance" | "area";
    value: number;
    unit: string;
  } | null;
  className?: string;
}

export function GeoprocessingToolbar({
  activeTool,
  onToolChange,
  measurementResult,
  className,
}: GeoprocessingToolbarProps) {
  const tools = [
    {
      id: "measure-distance" as GeoTool,
      icon: Ruler,
      label: "Measure Distance",
      description: "Click two points to measure distance",
    },
    {
      id: "measure-area" as GeoTool,
      icon: Square,
      label: "Measure Area",
      description: "Draw a polygon to calculate area",
    },
    {
      id: "point-info" as GeoTool,
      icon: MapPin,
      label: "Point Info",
      description: "Click to get coordinates",
    },
  ];

  return (
    <div className={cn("surface-glass rounded-xl p-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Move className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Geoprocessing</span>
      </div>

      <div className="flex gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(activeTool === tool.id ? "none" : tool.id)}
            className="flex-1"
            title={tool.description}
          >
            <tool.icon className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline text-xs">{tool.label.split(" ")[1]}</span>
          </Button>
        ))}
      </div>

      {activeTool !== "none" && (
        <div className="mt-2 p-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            {tools.find((t) => t.id === activeTool)?.description}
          </p>
        </div>
      )}

      {measurementResult && (
        <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                {measurementResult.type}
              </span>
              <p className="text-lg font-bold text-primary">
                {measurementResult.value.toFixed(2)} {measurementResult.unit}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onToolChange("none")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
