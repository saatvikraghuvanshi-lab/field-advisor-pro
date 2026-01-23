import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Layers, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Wheat,
  Leaf,
  Activity,
  Sparkles,
  Settings,
  LogOut,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

interface FieldSidebarProps {
  className?: string;
  fields?: Field[];
  selectedField?: Field | null;
  onFieldSelect?: (field: Field) => void;
  onEditField?: () => void;
}

export function FieldSidebar({ 
  className, 
  fields = [], 
  selectedField,
  onFieldSelect,
  onEditField,
}: FieldSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const getNdviStatus = (score: number | null) => {
    if (score === null) return { label: "No data", color: "text-muted-foreground" };
    if (score >= 0.6) return { label: "Healthy", color: "text-success" };
    if (score >= 0.3) return { label: "Moderate", color: "text-warning" };
    return { label: "Poor", color: "text-destructive" };
  };

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
            {/* Fields List */}
            {fields.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Your Fields</span>
                  <span className="text-xs text-muted-foreground">({fields.length})</span>
                </div>
                
                {fields.map((field) => {
                  const ndviStatus = getNdviStatus(field.ndvi_score);
                  return (
                    <button
                      key={field.id}
                      onClick={() => onFieldSelect?.(field)}
                      className={cn(
                        "w-full surface-glass rounded-xl p-4 text-left transition-all",
                        "hover:border-primary/50 hover:glow-primary-sm",
                        selectedField?.id === field.id && "border-primary glow-primary-sm"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: field.color || "#fbbf24" }}
                          />
                          <span className="font-medium text-foreground text-sm">{field.name}</span>
                        </div>
                        <span className={cn("text-xs font-medium", ndviStatus.color)}>
                          {ndviStatus.label}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{field.area_acres} acres</span>
                        {field.ndvi_score !== null && (
                          <span>NDVI: {field.ndvi_score}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
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

                {/* Drawing Instructions */}
                <div className="surface-glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">How to Draw</span>
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Click the polygon tool (top-right)</li>
                    <li>Click points to outline your field</li>
                    <li>Double-click to complete</li>
                    <li>Area calculated automatically</li>
                  </ol>
                </div>
              </>
            )}

            {/* Selected Field Analysis */}
            {selectedField && (
              <div className="surface-glass rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Field Analysis</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onEditField}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Field Name</span>
                    <p className="text-sm font-medium text-foreground">{selectedField.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Total Area</span>
                    <p className="text-sm font-medium text-foreground">{selectedField.area_acres} acres</p>
                  </div>
                  {selectedField.ndvi_score !== null && (
                    <div>
                      <span className="text-xs text-muted-foreground">Vegetation Index (NDVI)</span>
                      <p className={cn("text-sm font-medium", getNdviStatus(selectedField.ndvi_score).color)}>
                        {selectedField.ndvi_score} - {getNdviStatus(selectedField.ndvi_score).label}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Advisor Preview */}
            <div className="surface-glass rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Rural AI Advisor</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedField 
                  ? "AI analysis ready for this field. Insights coming soon!"
                  : "Select a field to receive AI-powered analysis on vegetation health and agricultural insights."
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <Activity className="w-3 h-3 shrink-0" />
              <span className="truncate">{user?.email || "Not signed in"}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 shrink-0"
              onClick={handleSignOut}
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
