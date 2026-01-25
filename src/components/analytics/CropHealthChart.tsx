import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface CropHealthChartProps {
  fieldName?: string;
}

// Mock crop health data with multiple metrics
const generateCropHealthData = () => {
  const weeks = [];
  for (let i = 1; i <= 20; i++) {
    const baseHealth = 60 + Math.sin(i * 0.3) * 15;
    weeks.push({
      week: `W${i}`,
      health: Math.round(Math.min(100, Math.max(40, baseHealth + Math.random() * 10))),
      stress: Math.round(Math.max(5, 25 - Math.sin(i * 0.3) * 10 + Math.random() * 8)),
      growth: Math.round(Math.min(100, Math.max(30, 50 + i * 2 + Math.random() * 10))),
    });
  }
  return weeks;
};

export function CropHealthChart({ fieldName }: CropHealthChartProps) {
  const data = generateCropHealthData();

  return (
    <Card className="surface-glass border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Crop Health Index {fieldName && <span className="text-muted-foreground">- {fieldName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                interval={3}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                label={{ value: "%", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Area
                type="monotone"
                dataKey="health"
                stroke="hsl(var(--success))"
                fill="url(#healthGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="growth"
                stroke="hsl(var(--primary))"
                fill="url(#growthGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="stress"
                stroke="hsl(var(--destructive))"
                fill="url(#stressGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success" />
            <span>Health</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Growth</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span>Stress</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
