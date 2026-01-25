import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  Send, 
  GripVertical,
  BarChart3,
  TrendingUp,
  Leaf,
  Droplets,
  Thermometer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NDVITrendChart } from "@/components/analytics/NDVITrendChart";
import { PrecipitationChart } from "@/components/analytics/PrecipitationChart";
import { CropHealthChart } from "@/components/analytics/CropHealthChart";
import { FieldSelector } from "@/components/analytics/FieldSelector";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ADVISOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rural-advisor`;

interface Field {
  id: string;
  name: string;
  area_acres: number;
  ndvi_score: number | null;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch fields from database
  useEffect(() => {
    const fetchFields = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("fields")
        .select("id, name, area_acres, ndvi_score")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching fields:", error);
        return;
      }
      
      setFields(data || []);
    };

    fetchFields();
  }, [user]);

  const selectedField = fields.find(f => f.id === selectedFieldId);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-sidebar/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Analytics & AI Advisor</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Field Selector and Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <FieldSelector
            fields={fields}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="surface-glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-3 h-3 text-success" />
                <span className="text-xs text-muted-foreground">Avg NDVI</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {selectedField?.ndvi_score?.toFixed(2) || "0.58"}
              </p>
              <p className="text-xs text-success flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +5%
              </p>
            </div>
            <div className="surface-glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Moisture</span>
              </div>
              <p className="text-lg font-bold text-foreground">42%</p>
              <p className="text-xs text-muted-foreground">Optimal</p>
            </div>
            <div className="surface-glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-muted-foreground">Temp</span>
              </div>
              <p className="text-lg font-bold text-foreground">72°F</p>
              <p className="text-xs text-muted-foreground">Growing</p>
            </div>
            <div className="surface-glass rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Fields</span>
              </div>
              <p className="text-lg font-bold text-foreground">{fields.length}</p>
              <p className="text-xs text-muted-foreground">
                {fields.reduce((acc, f) => acc + f.area_acres, 0).toFixed(0)} ac
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section with Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ndvi">NDVI Analysis</TabsTrigger>
            <TabsTrigger value="precipitation">Precipitation</TabsTrigger>
            <TabsTrigger value="health">Crop Health</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <NDVITrendChart fieldName={selectedField?.name} />
              <PrecipitationChart fieldName={selectedField?.name} />
            </div>
            <CropHealthChart fieldName={selectedField?.name} />
          </TabsContent>

          <TabsContent value="ndvi">
            <NDVITrendChart fieldName={selectedField?.name} />
            <div className="mt-4 surface-glass rounded-xl p-4">
              <h3 className="text-sm font-medium mb-2">NDVI Interpretation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2 rounded bg-red-500/20 border border-red-500/30">
                  <span className="font-medium">0.0 - 0.2</span>
                  <p className="text-muted-foreground">Bare soil/water</p>
                </div>
                <div className="p-2 rounded bg-yellow-500/20 border border-yellow-500/30">
                  <span className="font-medium">0.2 - 0.4</span>
                  <p className="text-muted-foreground">Sparse vegetation</p>
                </div>
                <div className="p-2 rounded bg-green-500/20 border border-green-500/30">
                  <span className="font-medium">0.4 - 0.6</span>
                  <p className="text-muted-foreground">Moderate vegetation</p>
                </div>
                <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/30">
                  <span className="font-medium">0.6 - 1.0</span>
                  <p className="text-muted-foreground">Dense vegetation</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="precipitation">
            <PrecipitationChart fieldName={selectedField?.name} />
            <div className="mt-4 surface-glass rounded-xl p-4">
              <h3 className="text-sm font-medium mb-2">Precipitation Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">28.5"</p>
                  <p className="text-xs text-muted-foreground">Annual Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">2.4"</p>
                  <p className="text-xs text-muted-foreground">Monthly Avg</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">+12%</p>
                  <p className="text-xs text-muted-foreground">vs Last Year</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="health">
            <CropHealthChart fieldName={selectedField?.name} />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="surface-glass rounded-xl p-4">
                <h4 className="text-sm font-medium mb-2 text-success">Health Index</h4>
                <p className="text-xs text-muted-foreground">
                  Overall vegetation vitality based on chlorophyll content and leaf area index.
                </p>
              </div>
              <div className="surface-glass rounded-xl p-4">
                <h4 className="text-sm font-medium mb-2 text-primary">Growth Rate</h4>
                <p className="text-xs text-muted-foreground">
                  Biomass accumulation rate measured through temporal NDVI changes.
                </p>
              </div>
              <div className="surface-glass rounded-xl p-4">
                <h4 className="text-sm font-medium mb-2 text-destructive">Stress Indicator</h4>
                <p className="text-xs text-muted-foreground">
                  Environmental stress factors including water deficit and heat stress.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Movable AI Advisor Panel */}
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
          </div>

          {/* Messages */}
          <ScrollArea className="h-80" ref={scrollRef}>
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
          </ScrollArea>

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
    </div>
  );
}
