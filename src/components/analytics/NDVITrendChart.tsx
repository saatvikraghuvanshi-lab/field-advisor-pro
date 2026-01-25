import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";

interface NDVITrendChartProps {
  fieldName?: string;
}

// Mock historical NDVI data
const generateNDVIData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = [2023, 2024, 2025];
  
  return years.flatMap((year) =>
    months.map((month, idx) => ({
      date: `${month} ${year}`,
      ndvi: Math.max(0.2, Math.min(0.9, 0.4 + Math.sin((idx + year * 12) * 0.5) * 0.25 + Math.random() * 0.15)),
      optimal: 0.6,
    }))
  ).slice(-24); // Last 24 months
};

export function NDVITrendChart({ fieldName }: NDVITrendChartProps) {
  const data = generateNDVIData();

  return (
    <Card className="surface-glass border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Leaf className="w-4 h-4 text-success" />
          NDVI Trend {fieldName && <span className="text-muted-foreground">- {fieldName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                interval={3}
              />
              <YAxis 
                domain={[0, 1]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <ReferenceLine 
                y={0.6} 
                stroke="hsl(var(--success))" 
                strokeDasharray="5 5" 
                label={{ value: "Optimal", fill: "hsl(var(--success))", fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="ndvi"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span>NDVI Score</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-success rounded" style={{ borderStyle: "dashed" }} />
            <span>Optimal Level</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
