import { useState } from "react";
import { 
  Layers, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Wheat,
  Leaf,
  Activity,
  Sparkles,
  PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FieldSidebarProps {
  className?: string;
}

export function FieldSidebar({ className }: FieldSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "relative h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-80 lg:w-96",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wheat className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient-primary">TerraPulse</h1>
              <p className="text-xs text-muted-foreground">GIS Dashboard</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("shrink-0", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-4">
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <Layers className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <MapPin className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <Activity className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="surface-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-foreground">Field Status</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Select a field to begin analysis. Draw polygons on the map to define your agricultural boundaries.
              </p>
            </div>

            {/* Drawing Tools Info */}
            <div className="surface-glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Drawing Tools</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Use the polygon tool to outline your fields. Area will be calculated automatically.
              </p>
              <Button variant="outline" className="w-full" disabled>
                <PenTool className="w-4 h-4" />
                Enable Drawing Mode
              </Button>
            </div>

            {/* AI Advisor Preview */}
            <div className="surface-glass rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Rural AI Advisor</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Select a field to receive AI-powered analysis on vegetation health and agricultural insights.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>Awaiting field selection...</span>
          </div>
        </div>
      )}
    </aside>
  );
}
