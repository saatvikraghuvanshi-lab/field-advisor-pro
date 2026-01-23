import { Leaf, Droplets, Thermometer, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
}

interface FieldTelemetryProps {
  field: Field | null;
  className?: string;
}

interface TelemetryItem {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  trend?: "up" | "down" | "stable";
  status?: "good" | "warning" | "critical";
}

export function FieldTelemetry({ field, className }: FieldTelemetryProps) {
  // Generate mock telemetry data based on field
  const telemetry = useMemo<TelemetryItem[]>(() => {
    if (!field) return [];

    const ndviScore = field.ndvi_score ?? 0.5;
    
    // Derive realistic values from NDVI
    const soilMoisture = Math.round(25 + ndviScore * 50 + (Math.random() - 0.5) * 10);
    const soilTemp = Math.round(65 + (1 - ndviScore) * 10 + (Math.random() - 0.5) * 8);
    const precipitation7d = Math.round((ndviScore * 25 + Math.random() * 10) * 10) / 10;
    const evapotranspiration = Math.round((2 + ndviScore * 3 + Math.random()) * 10) / 10;
    const leafAreaIndex = Math.round((ndviScore * 5 + 1) * 100) / 100;
    const chlorophyll = Math.round((ndviScore * 60 + 20) * 10) / 10;

    return [
      {
        label: "NDVI Score",
        value: ndviScore.toFixed(2),
        unit: "",
        icon: <Leaf className="w-4 h-4" />,
        color: ndviScore >= 0.6 ? "text-green-500" : ndviScore >= 0.3 ? "text-yellow-500" : "text-red-500",
        trend: ndviScore >= 0.5 ? "up" : ndviScore >= 0.3 ? "stable" : "down",
        status: ndviScore >= 0.6 ? "good" : ndviScore >= 0.3 ? "warning" : "critical",
      },
      {
        label: "Soil Moisture",
        value: soilMoisture,
        unit: "%",
        icon: <Droplets className="w-4 h-4" />,
        color: soilMoisture >= 40 && soilMoisture <= 70 ? "text-blue-500" : "text-yellow-500",
        trend: soilMoisture >= 50 ? "stable" : "down",
        status: soilMoisture >= 40 && soilMoisture <= 70 ? "good" : "warning",
      },
      {
        label: "Soil Temperature",
        value: soilTemp,
        unit: "°F",
        icon: <Thermometer className="w-4 h-4" />,
        color: soilTemp >= 60 && soilTemp <= 80 ? "text-orange-500" : "text-red-500",
        trend: "stable",
        status: soilTemp >= 60 && soilTemp <= 80 ? "good" : "warning",
      },
      {
        label: "Precipitation (7d)",
        value: precipitation7d,
        unit: "mm",
        icon: <Droplets className="w-4 h-4" />,
        color: "text-cyan-500",
        trend: precipitation7d >= 15 ? "up" : "stable",
        status: precipitation7d >= 10 ? "good" : precipitation7d >= 5 ? "warning" : "critical",
      },
      {
        label: "Evapotranspiration",
        value: evapotranspiration,
        unit: "mm/day",
        icon: <Wind className="w-4 h-4" />,
        color: "text-purple-500",
        trend: "stable",
        status: "good",
      },
      {
        label: "Leaf Area Index",
        value: leafAreaIndex,
        unit: "LAI",
        icon: <Leaf className="w-4 h-4" />,
        color: "text-emerald-500",
        trend: leafAreaIndex >= 3 ? "up" : "stable",
        status: leafAreaIndex >= 3 ? "good" : "warning",
      },
      {
        label: "Chlorophyll",
        value: chlorophyll,
        unit: "μg/cm²",
        icon: <Leaf className="w-4 h-4" />,
        color: "text-lime-500",
        trend: chlorophyll >= 50 ? "up" : "stable",
        status: chlorophyll >= 50 ? "good" : "warning",
      },
    ];
  }, [field]);

  const getTrendIcon = (trend: "up" | "down" | "stable" | undefined) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: "good" | "warning" | "critical" | undefined) => {
    switch (status) {
      case "good":
        return "bg-green-500/20 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/30";
      case "critical":
        return "bg-red-500/20 border-red-500/30";
      default:
        return "bg-muted/30 border-border";
    }
  };

  if (!field) {
    return (
      <div className={cn("surface-glass rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Field Telemetry</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a field to view detailed environmental telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("surface-glass rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Field Telemetry</span>
        </div>
        <span className="text-xs text-muted-foreground">{field.name}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {telemetry.map((item) => (
          <div
            key={item.label}
            className={cn(
              "p-2 rounded-lg border flex items-center gap-2",
              getStatusColor(item.status)
            )}
          >
            <div className={cn("shrink-0", item.color)}>{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">
                  {item.value}
                  <span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
                </span>
                {getTrendIcon(item.trend)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
