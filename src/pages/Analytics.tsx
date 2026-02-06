import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Loader2, 
  Send, 
  GripVertical,
  BarChart3,
  TrendingUp,
  Leaf,
  Droplets,
  Thermometer,
  X,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { NavigationBar } from "@/components/NavigationBar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ADVISOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rural-advisor`;

// Mock performance data for the chart
const performanceData = [
  { year: "2018", ndvi: 0.42, moisture: 35, yield: 78 },
  { year: "2019", ndvi: 0.48, moisture: 38, yield: 82 },
  { year: "2020", ndvi: 0.52, moisture: 41, yield: 85 },
  { year: "2021", ndvi: 0.45, moisture: 36, yield: 79 },
  { year: "2022", ndvi: 0.55, moisture: 44, yield: 88 },
  { year: "2023", ndvi: 0.58, moisture: 42, yield: 91 },
  { year: "2024", ndvi: 0.61, moisture: 45, yield: 94 },
  { year: "2025", ndvi: 0.59, moisture: 43, yield: 92 },
  { year: "2026", ndvi: 0.63, moisture: 46, yield: 96 },
];

const chartConfig: ChartConfig = {
  ndvi: {
    label: "NDVI Score",
    color: "hsl(var(--success))",
  },
  moisture: {
    label: "Soil Moisture %",
    color: "hsl(var(--primary))",
  },
  yield: {
    label: "Yield Index",
    color: "hsl(var(--warning))",
  },
};

export default function Analytics() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y,
    };
  }, [panelPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPanelPosition({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 500, e.clientY - dragOffset.current.y)),
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(ADVISOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          field: {
            name: "General Query",
            area_acres: 0,
            ndvi_score: null,
          },
          query: inputValue,
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
        throw new Error("Failed to get AI response");
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
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: fullText } : m
                  );
                }
                return [...prev, { role: "assistant", content: fullText }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Bar */}
      <NavigationBar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="surface-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Avg NDVI</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0.58</p>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +5% from last month
            </p>
          </div>
          <div className="surface-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Soil Moisture</span>
            </div>
            <p className="text-2xl font-bold text-foreground">42%</p>
            <p className="text-xs text-muted-foreground mt-1">Optimal range</p>
          </div>
          <div className="surface-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Avg Temp</span>
            </div>
            <p className="text-2xl font-bold text-foreground">72°F</p>
            <p className="text-xs text-muted-foreground mt-1">Growing conditions</p>
          </div>
          <div className="surface-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Fields</span>
            </div>
            <p className="text-2xl font-bold text-foreground">9</p>
            <p className="text-xs text-muted-foreground mt-1">1,873 acres total</p>
          </div>
        </div>

        {/* Field Performance Chart */}
        <div className="surface-glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Field Performance Over Time (2018-2026)</h2>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="ndvi"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fill="url(#ndviGradient)"
                name="NDVI Score"
              />
              <Area
                type="monotone"
                dataKey="moisture"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#moistureGradient)"
                name="Soil Moisture %"
              />
              <Line
                type="monotone"
                dataKey="yield"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Yield Index"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Additional Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="surface-glass rounded-xl p-6">
            <h3 className="text-md font-semibold text-foreground mb-3">Seasonal Trends</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Spring Growth</span>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: "78%" }} />
                </div>
                <span className="text-sm font-medium">78%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Summer Peak</span>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: "92%" }} />
                </div>
                <span className="text-sm font-medium">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fall Harvest</span>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "85%" }} />
                </div>
                <span className="text-sm font-medium">85%</span>
              </div>
            </div>
          </div>
          <div className="surface-glass rounded-xl p-6">
            <h3 className="text-md font-semibold text-foreground mb-3">Health Indicators</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chlorophyll Level</span>
                <span className="text-sm font-medium text-success">Optimal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stress Index</span>
                <span className="text-sm font-medium text-success">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Water Stress</span>
                <span className="text-sm font-medium text-warning">Moderate</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nutrient Status</span>
                <span className="text-sm font-medium text-success">Good</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Advisor Toggle Button */}
      {!isPanelOpen && (
        <Button
          onClick={() => setIsPanelOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Movable AI Advisor Panel */}
      {isPanelOpen && (
        <div
          className="fixed z-50 w-96 max-w-[calc(100vw-40px)]"
          style={{ left: panelPosition.x, top: panelPosition.y }}
        >
          <div className="surface-glass rounded-xl shadow-2xl border border-border overflow-hidden">
            {/* Drag Handle */}
            <div
              className="flex items-center gap-2 px-4 py-3 bg-primary/10 cursor-move select-none"
              onMouseDown={handleMouseDown}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground flex-1">Rural AI Advisor</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsPanelOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto scrollbar-thin" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Ask me anything about your fields, crops, or farming practices!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        msg.role === "user"
                          ? "bg-primary/20 ml-8"
                          : "bg-muted/50 mr-8"
                      )}
                    >
                      <div 
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ 
                          __html: msg.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>') 
                        }}
                      />
                    </div>
                  ))
                )}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your fields..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()} size="icon">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}