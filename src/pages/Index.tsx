import { useState } from "react";
import { FieldSidebar } from "@/components/FieldSidebar";
import { MapControls } from "@/components/MapControls";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { Compass, Signal } from "lucide-react";

const Index = () => {
  const [isDrawing, setIsDrawing] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <FieldSidebar />

      {/* Main Map Area */}
      <main className="relative flex-1 overflow-hidden">
        {/* Map Container */}
        <div className="absolute inset-0">
          <MapPlaceholder />
        </div>

        {/* Map Controls - Right Side */}
        <MapControls 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
          onToggleDrawing={() => setIsDrawing(!isDrawing)}
          isDrawing={isDrawing}
        />

        {/* Top Bar - Coordinates & Status */}
        <div className="absolute top-4 left-4 right-20 z-10 flex items-center justify-between">
          <div className="surface-glass rounded-xl px-4 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-foreground">
                39.7392° N, 104.9903° W
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Satellite Connected</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="surface-glass rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">
              Ready to map • {isDrawing ? "Drawing mode active" : "Click polygon tool to draw"}
            </span>
          </div>
        </div>

        {/* Scale Indicator */}
        <div className="absolute bottom-4 right-20 z-10">
          <div className="surface-glass rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-12 h-0.5 bg-foreground rounded-full" />
            <span className="text-xs text-muted-foreground">1 km</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
