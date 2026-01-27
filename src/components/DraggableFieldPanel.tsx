import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Layers, 
  MapPin, 
  GripVertical,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

interface DraggableFieldPanelProps {
  fields?: Field[];
  selectedField?: Field | null;
  onFieldSelect?: (field: Field) => void;
  onEditField?: () => void;
  className?: string;
}

export function DraggableFieldPanel({
  fields = [],
  selectedField,
  onFieldSelect,
  onEditField,
  className,
}: DraggableFieldPanelProps) {
  const [position, setPosition] = useState({ x: 16, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getNdviStatus = (score: number | null) => {
    if (score === null) return { label: "No data", color: "text-muted-foreground" };
    if (score >= 0.6) return { label: "Healthy", color: "text-success" };
    if (score >= 0.3) return { label: "Moderate", color: "text-warning" };
    return { label: "Poor", color: "text-destructive" };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setPosition({
        x: Math.max(0, dragRef.current.startPosX + deltaX),
        y: Math.max(0, dragRef.current.startPosY + deltaY),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const displayFields = showAllFields ? fields : fields.slice(0, 3);
  const hasMoreFields = fields.length > 3;

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute z-[1000] surface-glass rounded-xl shadow-lg transition-shadow",
        isDragging && "shadow-xl cursor-grabbing",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: isCollapsed ? "auto" : "280px",
      }}
    >
      {/* Header - Draggable Area */}
      <div
        className="flex items-center gap-2 p-3 border-b border-border cursor-grab select-none"
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground flex-1">
          Your Fields
        </span>
        <span className="text-xs text-muted-foreground">({fields.length})</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-2 max-h-[300px] overflow-hidden">
          {fields.length > 0 ? (
            <>
              {displayFields.map((field) => {
                const ndviStatus = getNdviStatus(field.ndvi_score);
                return (
                  <button
                    key={field.id}
                    onClick={() => onFieldSelect?.(field)}
                    className={cn(
                      "w-full surface-glass rounded-lg p-3 text-left transition-all",
                      "hover:border-primary/50",
                      selectedField?.id === field.id && "border-primary bg-primary/10"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: field.color || "#fbbf24" }}
                        />
                        <span className="font-medium text-foreground text-xs truncate">
                          {field.name}
                        </span>
                      </div>
                      <span className={cn("text-xs font-medium", ndviStatus.color)}>
                        {ndviStatus.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground pl-4">
                      <span>{field.area_acres} ac</span>
                      {field.ndvi_score !== null && (
                        <span>NDVI: {field.ndvi_score}</span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Show more/less toggle */}
              {hasMoreFields && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => setShowAllFields(!showAllFields)}
                >
                  {showAllFields ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show {fields.length - 3} more
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Draw polygons to add fields
              </p>
            </div>
          )}

          {/* Selected Field Quick Actions */}
          {selectedField && (
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    {selectedField.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onEditField}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
