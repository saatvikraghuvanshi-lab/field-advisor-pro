import { useState, useCallback } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WeatherData } from "@/hooks/useWeather";

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  color: string;
  precipitation?: number;
  soil_moisture?: number;
  temperature?: number;
}

interface AIAdvisorPanelProps {
  field: Field | null;
  weather: WeatherData | null;
  className?: string;
}

const ADVISOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rural-advisor`;

export function AIAdvisorPanel({ field, weather, className }: AIAdvisorPanelProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyzeField = useCallback(async () => {
    if (!field) return;

    setLoading(true);
    setAdvice("");
    setHasAnalyzed(true);

    try {
      const response = await fetch(ADVISOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          field: {
            name: field.name,
            area_acres: field.area_acres,
            ndvi_score: field.ndvi_score,
            precipitation: field.precipitation ?? Math.round(Math.random() * 20),
            soil_moisture: field.soil_moisture ?? Math.round(30 + Math.random() * 40),
            temperature: field.temperature ?? Math.round(60 + Math.random() * 25),
          },
          weather: weather ? {
            temperature: weather.temperature,
            humidity: weather.humidity,
            precipitation: weather.precipitation,
            wind_speed: weather.wind_speed,
            conditions: weather.conditions,
          } : undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits depleted. Please add credits to continue.");
          return;
        }
        throw new Error("Failed to get AI analysis");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAdvice(fullText);
            }
          } catch {
            // Incomplete JSON, wait for more data
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Handle any remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAdvice(fullText);
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("Failed to analyze field. Please try again.");
      setAdvice("");
    } finally {
      setLoading(false);
    }
  }, [field, weather]);

  if (!field) {
    return (
      <div className={cn("surface-glass rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Rural AI Advisor</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a field to receive AI-powered agricultural analysis and recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("surface-glass rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Rural AI Advisor</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={analyzeField}
          disabled={loading}
          className="h-7"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasAnalyzed ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {!hasAnalyzed && !loading && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Get AI-powered insights for <strong>{field.name}</strong>
          </p>
          <Button onClick={analyzeField} size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Analyze Field
          </Button>
        </div>
      )}

      {loading && !advice && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Analyzing field data...</span>
        </div>
      )}

      {advice && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div 
            className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: advice
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>') 
            }}
          />
        </div>
      )}
    </div>
  );
}
