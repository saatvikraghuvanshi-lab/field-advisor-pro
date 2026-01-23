import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "desktop" | "mobile";

interface ViewModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewModeToggle({ mode, onModeChange, className }: ViewModeToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-muted/50", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2 gap-1.5",
          mode === "desktop" && "bg-background shadow-sm"
        )}
        onClick={() => onModeChange("desktop")}
      >
        <Monitor className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">Desktop</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2 gap-1.5",
          mode === "mobile" && "bg-background shadow-sm"
        )}
        onClick={() => onModeChange("mobile")}
      >
        <Smartphone className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">Mobile</span>
      </Button>
    </div>
  );
}
