import { useState, useCallback, useRef } from "react";
import { Upload, FileJson, Table, X, Layers, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Papa from "papaparse";

export interface CustomLayer {
  id: string;
  name: string;
  type: "geojson" | "csv";
  data: GeoJSON.FeatureCollection | null;
  visible: boolean;
  color: string;
}

interface DataLayerUploadProps {
  layers: CustomLayer[];
  onLayersChange: (layers: CustomLayer[]) => void;
  className?: string;
}

const LAYER_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function DataLayerUpload({
  layers,
  onLayersChange,
  className,
}: DataLayerUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVToGeoJSON = (
    csvData: string,
    fileName: string
  ): GeoJSON.FeatureCollection | null => {
    try {
      const result = Papa.parse(csvData, { header: true, skipEmptyLines: true });
      
      if (result.errors.length > 0) {
        toast.error("CSV parsing error: " + result.errors[0].message);
        return null;
      }

      const features: GeoJSON.Feature[] = [];
      const rows = result.data as Record<string, string>[];

      // Find lat/lng columns
      const latCol = Object.keys(rows[0] || {}).find((k) =>
        ["lat", "latitude", "y"].includes(k.toLowerCase())
      );
      const lngCol = Object.keys(rows[0] || {}).find((k) =>
        ["lng", "lon", "longitude", "x"].includes(k.toLowerCase())
      );

      if (!latCol || !lngCol) {
        toast.error("CSV must have latitude and longitude columns");
        return null;
      }

      for (const row of rows) {
        const lat = parseFloat(row[latCol]);
        const lng = parseFloat(row[lngCol]);

        if (!isNaN(lat) && !isNaN(lng)) {
          features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            properties: { ...row },
          });
        }
      }

      return {
        type: "FeatureCollection",
        features,
      };
    } catch (error) {
      toast.error("Failed to parse CSV file");
      return null;
    }
  };

  const handleFile = useCallback(
    async (file: File) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        let data: GeoJSON.FeatureCollection | null = null;
        let type: "geojson" | "csv" = "geojson";

        if (extension === "geojson" || extension === "json") {
          try {
            const parsed = JSON.parse(content);
            if (parsed.type === "FeatureCollection") {
              data = parsed;
            } else if (parsed.type === "Feature") {
              data = { type: "FeatureCollection", features: [parsed] };
            } else {
              toast.error("Invalid GeoJSON format");
              return;
            }
          } catch {
            toast.error("Failed to parse GeoJSON file");
            return;
          }
        } else if (extension === "csv") {
          type = "csv";
          data = parseCSVToGeoJSON(content, file.name);
          if (!data) return;
        } else {
          toast.error("Unsupported file type. Use GeoJSON or CSV.");
          return;
        }

        const newLayer: CustomLayer = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          type,
          data,
          visible: true,
          color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
        };

        onLayersChange([...layers, newLayer]);
        toast.success(`Layer "${newLayer.name}" added with ${data?.features.length} features`);
      };

      reader.readAsText(file);
    },
    [layers, onLayersChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      files.forEach(handleFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const toggleLayerVisibility = (layerId: string) => {
    onLayersChange(
      layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      )
    );
  };

  const removeLayer = (layerId: string) => {
    onLayersChange(layers.filter((l) => l.id !== layerId));
    toast.info("Layer removed");
  };

  return (
    <div className={cn("surface-glass rounded-xl p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Custom Layers</span>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/30 hover:border-primary/50"
        )}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop GeoJSON or CSV files here
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          or click to browse
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json,.csv"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(handleFile);
          e.target.value = "";
        }}
        multiple
      />

      {/* Layer List */}
      {layers.length > 0 && (
        <div className="mt-4 space-y-2">
          <span className="text-xs text-muted-foreground uppercase">Active Layers</span>
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: layer.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {layer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {layer.type.toUpperCase()} • {layer.data?.features.length || 0} features
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => toggleLayerVisibility(layer.id)}
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-destructive"
                onClick={() => removeLayer(layer.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
