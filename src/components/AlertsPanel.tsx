import { useState, useEffect } from "react";
import { Bell, AlertTriangle, CheckCircle, X, Plus, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Alert {
  id: string;
  name: string;
  metric: "ndvi" | "temperature" | "moisture" | "air_quality";
  condition: "above" | "below";
  threshold: number;
  fieldId?: string;
  active: boolean;
  triggered: boolean;
  lastTriggered?: Date;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  message: string;
  severity: "warning" | "critical";
  timestamp: Date;
  dismissed: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
  notifications: AlertNotification[];
  onAlertsChange: (alerts: Alert[]) => void;
  onNotificationDismiss: (id: string) => void;
  className?: string;
}

const METRIC_OPTIONS = [
  { value: "ndvi", label: "NDVI Score" },
  { value: "temperature", label: "Temperature" },
  { value: "moisture", label: "Moisture Level" },
  { value: "air_quality", label: "Air Quality Index" },
];

const METRIC_UNITS: Record<string, string> = {
  ndvi: "",
  temperature: "°F",
  moisture: "%",
  air_quality: "AQI",
};

export function AlertsPanel({
  alerts,
  notifications,
  onAlertsChange,
  onNotificationDismiss,
  className,
}: AlertsPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<Alert>>({
    metric: "ndvi",
    condition: "below",
    threshold: 0.3,
  });

  const activeNotifications = notifications.filter((n) => !n.dismissed);
  const hasNotifications = activeNotifications.length > 0;

  const createAlert = () => {
    if (!newAlert.name || !newAlert.metric || newAlert.threshold === undefined) {
      toast.error("Please fill in all fields");
      return;
    }

    const alert: Alert = {
      id: crypto.randomUUID(),
      name: newAlert.name,
      metric: newAlert.metric as Alert["metric"],
      condition: newAlert.condition as Alert["condition"],
      threshold: newAlert.threshold,
      active: true,
      triggered: false,
    };

    onAlertsChange([...alerts, alert]);
    setNewAlert({ metric: "ndvi", condition: "below", threshold: 0.3 });
    setIsDialogOpen(false);
    toast.success(`Alert "${alert.name}" created`);
  };

  const toggleAlert = (id: string) => {
    onAlertsChange(
      alerts.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const deleteAlert = (id: string) => {
    onAlertsChange(alerts.filter((a) => a.id !== id));
    toast.info("Alert deleted");
  };

  return (
    <div className={cn("surface-glass rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-4 h-4 text-primary" />
            {hasNotifications && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium text-foreground">Alerts</span>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Alert Name
                </label>
                <Input
                  placeholder="e.g., Low NDVI Warning"
                  value={newAlert.name || ""}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Metric
                </label>
                <Select
                  value={newAlert.metric}
                  onValueChange={(v) =>
                    setNewAlert({ ...newAlert, metric: v as Alert["metric"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Condition
                  </label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(v) =>
                      setNewAlert({
                        ...newAlert,
                        condition: v as Alert["condition"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Threshold
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newAlert.threshold}
                    onChange={(e) =>
                      setNewAlert({
                        ...newAlert,
                        threshold: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={createAlert} className="w-full">
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Notifications */}
      {activeNotifications.length > 0 && (
        <div className="space-y-2 mb-4">
          {activeNotifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-3 rounded-lg flex items-start gap-2",
                notification.severity === "critical"
                  ? "bg-destructive/10 border border-destructive/30"
                  : "bg-warning/10 border border-warning/30"
              )}
            >
              <AlertTriangle
                className={cn(
                  "w-4 h-4 shrink-0 mt-0.5",
                  notification.severity === "critical"
                    ? "text-destructive"
                    : "text-warning"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => onNotificationDismiss(notification.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Alert Rules */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground uppercase">
          Alert Rules ({alerts.filter((a) => a.active).length} active)
        </span>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No alerts configured. Click + to create one.
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "p-2 rounded-lg flex items-center gap-2 transition-all",
                alert.active ? "bg-muted/30" : "bg-muted/10 opacity-60"
              )}
            >
              <button
                onClick={() => toggleAlert(alert.id)}
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  alert.active
                    ? "border-success bg-success"
                    : "border-muted-foreground"
                )}
              >
                {alert.active && <CheckCircle className="w-3 h-3 text-success-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {alert.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {METRIC_OPTIONS.find((m) => m.value === alert.metric)?.label}{" "}
                  {alert.condition} {alert.threshold}
                  {METRIC_UNITS[alert.metric]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-destructive"
                onClick={() => deleteAlert(alert.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
