import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FieldData {
  name: string;
  area_acres: number;
  ndvi_score: number | null;
  precipitation?: number;
  soil_moisture?: number;
  temperature?: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  conditions: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { field, weather } = await req.json() as { field: FieldData; weather?: WeatherData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a Rural AI Advisor - an expert agricultural consultant with deep knowledge of:
- Crop health assessment using NDVI (Normalized Difference Vegetation Index)
- Weather impact on farming
- Irrigation and soil management
- Pest and disease prevention
- Sustainable farming practices

Analyze the provided field data and give actionable, practical advice. Be concise but thorough.
Format your response with clear sections using markdown:
- **Health Status**: Quick assessment
- **Key Observations**: What the data tells us
- **Recommendations**: Specific actions to take
- **Weather Considerations**: How current/upcoming weather affects the field

Keep responses under 300 words. Be encouraging but honest about any concerns.`;

    const fieldInfo = `
Field: ${field.name}
Area: ${field.area_acres} acres
NDVI Score: ${field.ndvi_score !== null ? field.ndvi_score.toFixed(2) : 'Not available'}
${field.precipitation !== undefined ? `Precipitation (7-day): ${field.precipitation} mm` : ''}
${field.soil_moisture !== undefined ? `Soil Moisture: ${field.soil_moisture}%` : ''}
${field.temperature !== undefined ? `Surface Temperature: ${field.temperature}°F` : ''}

${weather ? `
Current Weather:
- Temperature: ${weather.temperature}°F
- Humidity: ${weather.humidity}%
- Conditions: ${weather.conditions}
- Wind Speed: ${weather.wind_speed} mph
- Recent Precipitation: ${weather.precipitation} mm
` : ''}

Please analyze this agricultural field and provide recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: fieldInfo },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue using AI features." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Rural advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
