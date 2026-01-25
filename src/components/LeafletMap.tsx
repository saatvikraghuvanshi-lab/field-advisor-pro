import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GeoTool } from "./GeoprocessingToolbar";
import { CustomLayer } from "./DataLayerUpload";
import { Crosshair, ZoomIn, ZoomOut, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
// Calculate geodesic area in acres
function calculateAcres(latlngs: L.LatLng[]): number {
  const earthRadius = 6378137; // meters
  let area = 0;

  if (latlngs.length < 3) return 0;

  for (let i = 0; i < latlngs.length; i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[(i + 1) % latlngs.length];

    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const lng1 = (p1.lng * Math.PI) / 180;
    const lng2 = (p2.lng * Math.PI) / 180;

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * earthRadius * earthRadius) / 2);
  const acres = area * 0.000247105; // Convert square meters to acres
  return Math.round(acres * 100) / 100;
}

// Calculate distance between two points in meters
function calculateDistance(p1: L.LatLng, p2: L.LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface LeafletMapProps {
  onFieldSelect?: (field: any) => void;
  onFieldsChange?: (fields: any[]) => void;
  onMeasurementResult?: (result: { type: "distance" | "area"; value: number; unit: string }) => void;
  currentYear?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

export interface LeafletMapRef {
  setGeoTool: (tool: GeoTool) => void;
  updateCustomLayers: (layers: CustomLayer[]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  locate: () => void;
  refreshFields: () => void;
}

export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(
  ({ onFieldSelect, onFieldsChange, onMeasurementResult, currentYear, userLocation, onLocationChange }, ref) => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const drawnLayersRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
    const customLayersRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const measureLayersRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const userMarkerRef = useRef<L.CircleMarker | null>(null);
    const userAccuracyRef = useRef<L.Circle | null>(null);
    const geoToolRef = useRef<GeoTool>("none");
    const measurePointsRef = useRef<L.LatLng[]>([]);
    const measureMarkersRef = useRef<L.Marker[]>([]);
    const hasInitializedLocation = useRef(false);
    const { user } = useAuth();

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      setGeoTool: (tool: GeoTool) => {
        geoToolRef.current = tool;
        measurePointsRef.current = [];
        measureLayersRef.current.clearLayers();
        measureMarkersRef.current.forEach((m) => m.remove());
        measureMarkersRef.current = [];

        if (mapRef.current) {
          if (tool === "none") {
            mapRef.current.pm.enableGlobalEditMode();
            mapRef.current.pm.disableGlobalEditMode();
          } else {
            mapRef.current.pm.disableDraw();
          }
        }
      },
      updateCustomLayers: (layers: CustomLayer[]) => {
        customLayersRef.current.clearLayers();

        layers
          .filter((layer) => layer.visible && layer.data)
          .forEach((layer) => {
            const geoJsonLayer = L.geoJSON(layer.data!, {
              style: {
                color: layer.color,
                fillColor: layer.color,
                fillOpacity: 0.3,
                weight: 2,
              },
              pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 6,
                  color: layer.color,
                  fillColor: layer.color,
                  fillOpacity: 0.6,
                  weight: 2,
                });
              },
              onEachFeature: (feature, featureLayer) => {
                if (feature.properties) {
                  const props = Object.entries(feature.properties)
                    .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
                    .join("<br/>");
                  featureLayer.bindPopup(`
                    <div style="font-family: system-ui; min-width: 150px;">
                      <strong style="color: ${layer.color};">${layer.name}</strong>
                      <br/><br/>
                      <span style="color: #64748b; font-size: 12px;">${props}</span>
                    </div>
                  `);
                }
              },
            });
            customLayersRef.current.addLayer(geoJsonLayer);
          });
      },
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      locate: () => mapRef.current?.locate({ setView: true, maxZoom: 16 }),
      refreshFields: () => loadFields(),
    }));

    // Load existing fields from database
    const loadFields = useCallback(async () => {
      if (!user || !mapRef.current) return;

      try {
        const { data: fields, error } = await supabase
          .from("fields")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Clear existing layers
        drawnLayersRef.current.clearLayers();

        // Add fields to map
        fields?.forEach((field) => {
          const coordinates = field.coordinates as number[][];
          if (coordinates && coordinates.length > 0) {
            const latlngs = coordinates.map((coord) => L.latLng(coord[0], coord[1]));
            const polygon = L.polygon(latlngs, {
              color: field.color || "#fbbf24",
              fillColor: field.color || "#fbbf24",
              fillOpacity: 0.3,
              weight: 2,
            });

            polygon.bindPopup(`
              <div style="font-family: system-ui; min-width: 150px;">
                <strong style="color: #0f172a;">${field.name}</strong>
                <br/>
                <span style="color: #64748b; font-size: 12px;">Area: ${field.area_acres} acres</span>
                ${field.ndvi_score ? `<br/><span style="color: #64748b; font-size: 12px;">NDVI: ${field.ndvi_score}</span>` : ""}
              </div>
            `);

            polygon.on("click", () => {
              onFieldSelect?.(field);
            });

            drawnLayersRef.current.addLayer(polygon);
          }
        });

        onFieldsChange?.(fields || []);
      } catch (error) {
        console.error("Error loading fields:", error);
      }
    }, [user, onFieldSelect, onFieldsChange]);

    // Save field to database
    const saveField = async (layer: L.Polygon) => {
      if (!user) {
        toast.error("Please sign in to save fields");
        return;
      }

      try {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const coordinates = latlngs.map((ll) => [ll.lat, ll.lng]);
        const areaAcres = calculateAcres(latlngs);

        // Generate mock NDVI score
        const ndviScore = Math.round((0.3 + Math.random() * 0.6) * 100) / 100;

        const { data, error } = await supabase
          .from("fields")
          .insert({
            user_id: user.id,
            name: `Field ${Date.now().toString().slice(-4)}`,
            coordinates: coordinates,
            area_acres: areaAcres,
            ndvi_score: ndviScore,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success(`Field saved: ${areaAcres} acres`);

        // Update popup with saved data
        layer.bindPopup(`
          <div style="font-family: system-ui; min-width: 150px;">
            <strong style="color: #0f172a;">${data.name}</strong>
            <br/>
            <span style="color: #64748b; font-size: 12px;">Area: ${data.area_acres} acres</span>
            <br/>
            <span style="color: #64748b; font-size: 12px;">NDVI: ${data.ndvi_score}</span>
          </div>
        `);

        layer.on("click", () => {
          onFieldSelect?.(data);
        });

        loadFields();
      } catch (error: any) {
        console.error("Error saving field:", error);
        toast.error("Failed to save field");
      }
    };

    // Handle map click for geoprocessing tools
    const handleMapClick = useCallback(
      (e: L.LeafletMouseEvent) => {
        const tool = geoToolRef.current;
        if (tool === "none") return;

        if (tool === "point-info") {
          toast.info(`Coordinates: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
          return;
        }

        if (tool === "measure-distance") {
          measurePointsRef.current.push(e.latlng);

          // Add marker
          const marker = L.circleMarker(e.latlng, {
            radius: 6,
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 1,
          }).addTo(measureLayersRef.current);
          measureMarkersRef.current.push(marker as any);

          if (measurePointsRef.current.length === 2) {
            const [p1, p2] = measurePointsRef.current;
            const distanceMeters = calculateDistance(p1, p2);

            // Draw line
            L.polyline([p1, p2], {
              color: "#3b82f6",
              weight: 3,
              dashArray: "10, 10",
            }).addTo(measureLayersRef.current);

            // Report result
            const value = distanceMeters >= 1000 ? distanceMeters / 1000 : distanceMeters;
            const unit = distanceMeters >= 1000 ? "km" : "m";
            onMeasurementResult?.({ type: "distance", value, unit });

            // Reset points for next measurement
            measurePointsRef.current = [];
          }
        }

        if (tool === "measure-area") {
          measurePointsRef.current.push(e.latlng);

          // Add marker
          const marker = L.circleMarker(e.latlng, {
            radius: 6,
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 1,
          }).addTo(measureLayersRef.current);
          measureMarkersRef.current.push(marker as any);

          // Draw polygon preview
          if (measurePointsRef.current.length >= 3) {
            measureLayersRef.current.eachLayer((layer) => {
              if (layer instanceof L.Polygon) {
                measureLayersRef.current.removeLayer(layer);
              }
            });

            const polygon = L.polygon(measurePointsRef.current, {
              color: "#22c55e",
              fillColor: "#22c55e",
              fillOpacity: 0.2,
              weight: 2,
            }).addTo(measureLayersRef.current);

            const acres = calculateAcres(measurePointsRef.current);
            onMeasurementResult?.({ type: "area", value: acres, unit: "acres" });
          }
        }
      },
      [onMeasurementResult]
    );

    // Handle double-click to finish area measurement
    const handleMapDblClick = useCallback(() => {
      if (geoToolRef.current === "measure-area" && measurePointsRef.current.length >= 3) {
        const acres = calculateAcres(measurePointsRef.current);
        onMeasurementResult?.({ type: "area", value: acres, unit: "acres" });
        toast.success(`Area: ${acres.toFixed(2)} acres`);
      }
    }, [onMeasurementResult]);

    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      // Initialize map - will center on user location if available, else Kansas
      const map = L.map(mapContainerRef.current, {
        center: [39.0119, -98.4842],
        zoom: 4, // Start zoomed out, will zoom in when location is found
        zoomControl: false,
      });

      mapRef.current = map;

      // Esri World Imagery (satellite tiles)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri",
          maxZoom: 19,
        }
      ).addTo(map);

      // Add labels overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
        }
      ).addTo(map);

      // Add layer groups to map
      drawnLayersRef.current.addTo(map);
      customLayersRef.current.addTo(map);
      measureLayersRef.current.addTo(map);

      // Initialize Geoman drawing controls - positioned at topleft to avoid overlap
      map.pm.addControls({
        position: "topleft",
        drawCircle: false,
        drawCircleMarker: false,
        drawMarker: false,
        drawPolyline: false,
        drawText: false,
        cutPolygon: false,
        rotateMode: false,
      });

      // Style Geoman controls to match theme
      map.pm.setGlobalOptions({
        pathOptions: {
          color: "#fbbf24",
          fillColor: "#fbbf24",
          fillOpacity: 0.3,
          weight: 2,
        },
      });

      // Handle polygon creation
      map.on("pm:create", (e) => {
        if (e.layer instanceof L.Polygon) {
          drawnLayersRef.current.addLayer(e.layer);
          saveField(e.layer);
        }
      });

      // Handle polygon removal
      map.on("pm:remove", async () => {
        toast.info("Field removed from map");
      });

      // Handle clicks for geoprocessing
      map.on("click", handleMapClick);
      map.on("dblclick", handleMapDblClick);

      // Handle location found
      map.on("locationfound", (e) => {
        onLocationChange?.(e.latlng.lat, e.latlng.lng);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, []);

    // Load fields when user changes
    useEffect(() => {
      if (user) {
        loadFields();
      }
    }, [user, loadFields]);

    // Update user location marker
    useEffect(() => {
      if (!mapRef.current || !userLocation) return;

      const { latitude, longitude } = userLocation;
      const latlng = L.latLng(latitude, longitude);

      // Center map on first location fix
      if (!hasInitializedLocation.current) {
        mapRef.current.setView(latlng, 15);
        hasInitializedLocation.current = true;
      }

      // Create or update the pulsing blue dot
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(latlng);
      } else {
        userMarkerRef.current = L.circleMarker(latlng, {
          radius: 8,
          color: "#fff",
          fillColor: "#3b82f6",
          fillOpacity: 1,
          weight: 3,
          className: "user-location-marker",
        }).addTo(mapRef.current);

        // Add pulsing effect
        const pulseIcon = L.divIcon({
          className: "user-location-pulse",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker(latlng, { icon: pulseIcon }).addTo(mapRef.current);
      }

      // Update accuracy circle
      if (userAccuracyRef.current) {
        userAccuracyRef.current.setLatLng(latlng);
      } else {
        userAccuracyRef.current = L.circle(latlng, {
          radius: 50,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(mapRef.current);
      }
    }, [userLocation]);

    const handleLocate = useCallback(() => {
      if (mapRef.current) {
        if (userLocation) {
          mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15);
        } else {
          mapRef.current.locate({ setView: true, maxZoom: 16 });
        }
      }
    }, [userLocation]);

    return (
      <div className="relative w-full h-full" style={{ minHeight: "400px" }}>
        <div
          ref={mapContainerRef}
          className="w-full h-full"
        />

        {/* Map Controls - Bottom Right to avoid Geoman overlap */}
        <div className="absolute bottom-20 right-4 z-[1001] flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            className="surface-glass h-9 w-9"
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="surface-glass h-9 w-9"
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-full h-px bg-border my-1" />
          <Button
            variant="outline"
            size="icon"
            className="surface-glass h-9 w-9"
            onClick={handleLocate}
            title="My Location"
          >
            <Navigation className="w-4 h-4 text-primary" />
          </Button>
        </div>
      </div>
    );
  }
);

LeafletMap.displayName = "LeafletMap";
