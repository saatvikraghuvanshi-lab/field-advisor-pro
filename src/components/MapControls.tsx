import { ZoomIn, ZoomOut, Navigation, Layers, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onLayerChange: (layer: string) => void;
  currentLayer: string;
  onNavigateToField?: () => void;
  hasSelectedField?: boolean;
  className?: string;
}

const LAYERS = [
  { id: "satellite", label: "Satellite Imagery" },
  { id: "terrain", label: "Terrain" },
  { id: "streets", label: "Streets" },
];

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onLayerChange,
  currentLayer,
  onNavigateToField,
  hasSelectedField,
  className,
}: MapControlsProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Zoom Controls */}
      <Button
        variant="outline"
        size="icon"
        className="surface-glass h-9 w-9"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="surface-glass h-9 w-9"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <div className="w-full h-px bg-border my-1" />
      
      {/* Location */}
      <Button
        variant="outline"
        size="icon"
        className="surface-glass h-9 w-9"
        onClick={onLocate}
        title="My Location"
      >
        <Navigation className="w-4 h-4 text-primary" />
      </Button>
      
      {/* Navigate to Field */}
      {hasSelectedField && onNavigateToField && (
        <Button
          variant="outline"
          size="icon"
          className="surface-glass h-9 w-9"
          onClick={onNavigateToField}
          title="Navigate to Field"
        >
          <Route className="w-4 h-4 text-success" />
        </Button>
      )}
      
      <div className="w-full h-px bg-border my-1" />
      
      {/* Layers Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="surface-glass h-9 w-9"
            title="Map Layers"
          >
            <Layers className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          side="left" 
          align="start"
          className="w-48 bg-popover border border-border shadow-lg z-[2000]"
        >
          <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LAYERS.map((layer) => (
            <DropdownMenuItem
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={cn(
                "cursor-pointer",
                currentLayer === layer.id && "bg-primary/20 text-primary"
              )}
            >
              {layer.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
