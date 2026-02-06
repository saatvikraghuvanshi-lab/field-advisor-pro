import { useState, useCallback, useEffect, useRef } from "react";
import { LeafletMap, LeafletMapRef } from "@/components/LeafletMap";
import { FieldSidebar } from "@/components/FieldSidebar";
import { MapToolsPanel } from "@/components/MapToolsPanel";
import { GeoTool } from "@/components/GeoprocessingToolbar";
import { CustomLayer } from "@/components/DataLayerUpload";
import { Alert, AlertNotification } from "@/components/AlertsPanel";
import { FieldTelemetry } from "@/components/FieldTelemetry";
import { AIAdvisorPanel } from "@/components/AIAdvisorPanel";
import { FieldEditDialog } from "@/components/FieldEditDialog";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Compass, Signal, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

type ViewMode = "desktop" | "mobile";

const Index = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // View mode state - from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("terrapulse-view-mode");
    return (saved as ViewMode) || "desktop";
  });
  
  // Time-series state
  const [currentYear, setCurrentYear] = useState(2024);
  
  // Geoprocessing state
  const [activeTool, setActiveTool] = useState<GeoTool>("none");
  const [measurementResult, setMeasurementResult] = useState<{
    type: "distance" | "area";
    value: number;
    unit: string;
  } | null>(null);
  
  // Custom layers state
  const [customLayers, setCustomLayers] = useState<CustomLayer[]>([]);
  
  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Geolocation and weather hooks
  const { latitude, longitude, loading: geoLoading, permissionDenied } = useGeolocation();
  const { weather, loading: weatherLoading, fetchWeather } = useWeather();

  const mapRef = useRef<LeafletMapRef>(null);

  // Save view mode to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("terrapulse-view-mode", mode);
  };

  // Fetch weather when location is available
  useEffect(() => {
    if (latitude && longitude) {
      fetchWeather(latitude, longitude);
    }
  }, [latitude, longitude, fetchWeather]);

  const handleFieldSelect = useCallback((field: Field) => {
    setSelectedField(field);
  }, []);

  const handleFieldsChange = useCallback((newFields: Field[]) => {
    setFields(newFields);
  }, []);

  const handleToolChange = useCallback((tool: GeoTool) => {
    setActiveTool(tool);
    if (tool === "none") {
      setMeasurementResult(null);
    }
    mapRef.current?.setGeoTool(tool);
  }, []);

  const handleMeasurementResult = useCallback((result: { type: "distance" | "area"; value: number; unit: string }) => {
    setMeasurementResult(result);
  }, []);

  const handleNotificationDismiss = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    fetchWeather(lat, lng);
  }, [fetchWeather]);

  const handleFieldUpdated = useCallback(() => {
    mapRef.current?.refreshFields();
    setSelectedField(null);
  }, []);

  const handleFieldDeleted = useCallback(() => {
    mapRef.current?.refreshFields();
    setSelectedField(null);
  }, []);

  // Check alerts when fields change
  useEffect(() => {
    if (fields.length === 0 || alerts.length === 0) return;

    alerts.forEach((alert) => {
      if (!alert.active) return;

      fields.forEach((field) => {
        let value: number | null = null;
        
        if (alert.metric === "ndvi") {
          value = field.ndvi_score;
        }
        
        if (value === null) return;

        const isTriggered =
          alert.condition === "above"
            ? value > alert.threshold
            : value < alert.threshold;

        if (isTriggered) {
          const existingNotification = notifications.find(
            (n) => n.alertId === alert.id && !n.dismissed
          );
          
          if (!existingNotification) {
            const newNotification: AlertNotification = {
              id: crypto.randomUUID(),
              alertId: alert.id,
              message: `${alert.name}: ${field.name} has ${alert.metric.toUpperCase()} ${alert.condition} ${alert.threshold} (current: ${value})`,
              severity: alert.condition === "below" ? "critical" : "warning",
              timestamp: new Date(),
              dismissed: false,
            };
            
            setNotifications((prev) => [newNotification, ...prev]);
            toast.warning(newNotification.message);
          }
        }
      });
    });
  }, [fields, alerts]);

  // Update custom layers on map
  useEffect(() => {
    mapRef.current?.updateCustomLayers(customLayers);
  }, [customLayers]);

  const userLocation = latitude && longitude ? { latitude, longitude } : null;

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden",
      viewMode === "mobile" && "max-w-[390px] mx-auto border-x border-border"
    )}>
      {/* Left Sidebar */}
      <FieldSidebar
        fields={fields}
        selectedField={selectedField}
        onFieldSelect={handleFieldSelect}
        onEditField={() => setEditDialogOpen(true)}
      />

      {/* Main Map Area */}
      <main className="relative flex-1 overflow-hidden">
        {/* Map Container */}
        <div className="absolute inset-0">
          <LeafletMap 
            ref={mapRef}
            onFieldSelect={handleFieldSelect}
            onFieldsChange={handleFieldsChange}
            onMeasurementResult={handleMeasurementResult}
            currentYear={currentYear}
            userLocation={userLocation}
            onLocationChange={handleLocationChange}
          />
        </div>

        {/* Top Status Bar */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="flex items-center justify-between">
            {/* Left: Status Info */}
            <div className="surface-glass rounded-xl px-3 py-2 flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono text-foreground">Esri World Imagery</span>
              </div>
              <div className="w-px h-3.5 bg-border" />
              <span className="text-xs text-muted-foreground font-mono">{currentYear}</span>
              <div className="w-px h-3.5 bg-border" />
              <div className="flex items-center gap-1.5">
                <Signal className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
              <div className="w-px h-3.5 bg-border" />
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 px-2 gap-1"
                  onClick={() => handleViewModeChange("desktop")}
                >
                  <Monitor className="w-3 h-3" />
                  <span className="text-xs hidden sm:inline">Desktop</span>
                </Button>
                <Button
                  variant={viewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 px-2 gap-1"
                  onClick={() => handleViewModeChange("mobile")}
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="text-xs hidden sm:inline">Mobile</span>
                </Button>
              </div>
            </div>

            {/* Right: Tools Panel Trigger - moved further right to avoid Geoman overlap */}
            <div className="pointer-events-auto mr-12">
              <MapToolsPanel
                fields={fields}
                currentYear={currentYear}
                onYearChange={setCurrentYear}
                activeTool={activeTool}
                onToolChange={handleToolChange}
                measurementResult={measurementResult}
                customLayers={customLayers}
                onCustomLayersChange={setCustomLayers}
                alerts={alerts}
                notifications={notifications}
                onAlertsChange={setAlerts}
                onNotificationDismiss={handleNotificationDismiss}
              />
            </div>
          </div>
        </div>

        {/* Weather Widget - Top Left below status bar */}
        {weather && (
          <div className="absolute top-20 left-4 z-[999] pointer-events-auto">
            <WeatherWidget weather={weather} loading={weatherLoading} />
          </div>
        )}

        {/* Telemetry & AI Panel - Left Side (Desktop Only) */}
        {viewMode === "desktop" && selectedField && (
          <div className="absolute left-4 top-[280px] z-[999] w-72 space-y-2 pointer-events-auto">
            <FieldTelemetry field={selectedField} />
            <AIAdvisorPanel field={selectedField} weather={weather} />
          </div>
        )}

        {/* Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
          <div className="surface-glass rounded-xl px-3 py-2 flex items-center gap-2.5 pointer-events-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {fields.length > 0 
                ? `${fields.length} field${fields.length > 1 ? 's' : ''} mapped • Total: ${fields.reduce((sum, f) => sum + Number(f.area_acres), 0).toFixed(2)} acres`
                : "Draw polygons to add fields"
              }
            </span>
          </div>
        </div>

        {/* Scale Indicator */}
        <div className="absolute bottom-4 right-4 z-[999] pointer-events-none">
          <div className="surface-glass rounded-lg px-2.5 py-1 flex items-center gap-1.5 pointer-events-auto">
            <div className="w-10 h-0.5 bg-foreground rounded-full" />
            <span className="text-xs text-muted-foreground">1 km</span>
          </div>
        </div>

        {/* Mobile Bottom Bar (when in mobile view) */}
        {viewMode === "mobile" && selectedField && (
          <div className="absolute bottom-16 left-4 right-4 z-[1000] pointer-events-auto">
            <div className="surface-glass rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">
                  {selectedField.name}
                </span>
                <button
                  className="text-xs text-primary"
                  onClick={() => setEditDialogOpen(true)}
                >
                  Edit
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedField.area_acres} acres • NDVI: {selectedField.ndvi_score ?? "N/A"}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Field Edit Dialog */}
      <FieldEditDialog
        field={selectedField}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onFieldUpdated={handleFieldUpdated}
        onFieldDeleted={handleFieldDeleted}
      />
    </div>
  );
};

export default Index;
