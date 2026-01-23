import { useState, useCallback, useEffect, useRef } from "react";
import { FieldSidebar } from "@/components/FieldSidebar";
import { LeafletMap, LeafletMapRef } from "@/components/LeafletMap";
import { MapToolsPanel } from "@/components/MapToolsPanel";
import { GeoTool } from "@/components/GeoprocessingToolbar";
import { CustomLayer } from "@/components/DataLayerUpload";
import { Alert, AlertNotification } from "@/components/AlertsPanel";
import { WeatherWidget } from "@/components/WeatherWidget";
import { FieldTelemetry } from "@/components/FieldTelemetry";
import { AIAdvisorPanel } from "@/components/AIAdvisorPanel";
import { FieldEditDialog } from "@/components/FieldEditDialog";
import { ViewModeToggle, ViewMode } from "@/components/ViewModeToggle";
import { Compass, Signal, Pencil } from "lucide-react";
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

const Index = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  
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
      {/* Sidebar - hidden in mobile view */}
      {viewMode === "desktop" && (
        <FieldSidebar 
          fields={fields}
          selectedField={selectedField}
          onFieldSelect={handleFieldSelect}
          onEditField={() => setEditDialogOpen(true)}
        />
      )}

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

        {/* Top Bar - Coordinates & Status */}
        <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
          <div className="surface-glass rounded-xl px-4 py-2.5 flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-foreground">
                Esri World Imagery
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">{currentYear}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <ViewModeToggle 
              mode={viewMode} 
              onModeChange={setViewMode} 
              className="hidden sm:flex"
            />
          </div>
        </div>

        {/* Tools Panel - Right Side (hidden in mobile or when field is selected) */}
        <div className={cn(
          "absolute top-4 z-[1000] max-h-[calc(100vh-8rem)] overflow-y-auto pointer-events-auto",
          viewMode === "mobile" ? "right-4 w-64" : "right-16 w-80"
        )}>
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

        {/* Left Side Panels - Weather, Telemetry, AI Advisor */}
        <div className={cn(
          "absolute left-4 z-[1000] w-80 space-y-3 pointer-events-auto",
          viewMode === "mobile" ? "hidden" : "top-20"
        )}>
          <WeatherWidget weather={weather} loading={weatherLoading} />
          
          {selectedField && (
            <>
              <div className="surface-glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {selectedField.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedField.area_acres} acres • NDVI: {selectedField.ndvi_score ?? "N/A"}
                </div>
              </div>
              
              <FieldTelemetry field={selectedField} />
              <AIAdvisorPanel field={selectedField} weather={weather} />
            </>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
          <div className="surface-glass rounded-xl px-4 py-2.5 flex items-center gap-3 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {fields.length > 0 
                ? `${fields.length} field${fields.length > 1 ? 's' : ''} mapped • Total: ${fields.reduce((sum, f) => sum + Number(f.area_acres), 0).toFixed(2)} acres`
                : "Ready to map • Use polygon tool to draw fields"
              }
            </span>
          </div>
        </div>

        {/* Scale Indicator */}
        <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
          <div className="surface-glass rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
            <div className="w-12 h-0.5 bg-foreground rounded-full" />
            <span className="text-xs text-muted-foreground">1 km</span>
          </div>
        </div>

        {/* Mobile Bottom Bar (when in mobile view) */}
        {viewMode === "mobile" && selectedField && (
          <div className="absolute bottom-16 left-4 right-4 z-[1000] pointer-events-auto">
            <div className="surface-glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {selectedField.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
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
