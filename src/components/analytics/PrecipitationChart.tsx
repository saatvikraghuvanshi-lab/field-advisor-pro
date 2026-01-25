import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets } from "lucide-react";

interface PrecipitationChartProps {
  fieldName?: string;
}

// Mock precipitation data
const generatePrecipitationData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return months.map((month, idx) => {
    // Simulate seasonal patterns
    const baseRain = 2 + Math.sin((idx - 3) * 0.5) * 1.5;
    const rainfall = Math.max(0.5, baseRain + Math.random() * 2);
    
    return {
      month,
      rainfall: parseFloat(rainfall.toFixed(1)),
      average: parseFloat((2.5 + Math.sin((idx - 3) * 0.5) * 1).toFixed(1)),
    };
  });
};

export function PrecipitationChart({ fieldName }: PrecipitationChartProps) {
  const data = generatePrecipitationData();

  const getBarColor = (value: number, average: number) => {
    if (value < average * 0.7) return "hsl(var(--destructive))";
    if (value > average * 1.3) return "hsl(210 100% 50%)";
    return "hsl(210 80% 60%)";
  };

  return (
    <Card className="surface-glass border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          Precipitation History {fieldName && <span className="text-muted-foreground">- {fieldName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                label={{ value: "inches", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
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
                  `${value} in`,
                  name === "rainfall" ? "Rainfall" : "Average"
                ]}
              />
              <Bar dataKey="rainfall" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.rainfall, entry.average)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span>Below Avg</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(210 100% 50%)" }} />
            <span>Above Avg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
