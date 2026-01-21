import { 
  Plus, 
  Minus, 
  Locate, 
  Layers, 
  PenTool,
  Square,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  className?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  onToggleDrawing?: () => void;
  isDrawing?: boolean;
}

export function MapControls({ 
  className,
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleDrawing,
  isDrawing = false
}: MapControlsProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Zoom Controls */}
      <div className="surface-glass rounded-xl p-1.5 flex flex-col gap-1">
        <Button 
          variant="map" 
          size="icon-lg"
          onClick={onZoomIn}
          className="rounded-lg"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button 
          variant="map" 
          size="icon-lg"
          onClick={onZoomOut}
          className="rounded-lg"
        >
          <Minus className="w-5 h-5" />
        </Button>
      </div>

      {/* Location */}
      <div className="surface-glass rounded-xl p-1.5">
        <Button 
          variant="map" 
          size="icon-lg"
          onClick={onLocate}
          className="rounded-lg"
        >
          <Locate className="w-5 h-5" />
        </Button>
      </div>

      {/* Layer Toggle */}
      <div className="surface-glass rounded-xl p-1.5">
        <Button 
          variant="map" 
          size="icon-lg"
          className="rounded-lg"
        >
          <Layers className="w-5 h-5" />
        </Button>
      </div>

      {/* Drawing Tools */}
      <div className="surface-glass rounded-xl p-1.5 flex flex-col gap-1">
        <Button 
          variant={isDrawing ? "default" : "map"}
          size="icon-lg"
          onClick={onToggleDrawing}
          className={cn("rounded-lg", isDrawing && "glow-primary")}
        >
          <PenTool className="w-5 h-5" />
        </Button>
        <Button 
          variant="map" 
          size="icon-lg"
          className="rounded-lg"
          disabled
        >
          <Square className="w-5 h-5" />
        </Button>
        <Button 
          variant="map" 
          size="icon-lg"
          className="rounded-lg text-destructive hover:text-destructive"
          disabled
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
