import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as ChatRequest;
    const { message } = body;
    
    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Wewe ni Sauti Chama, msaidizi wa kidigital kwa vikundi vya akiba (chamas) huko Afrika Magharibi.

Unajua kuhusu:
- Jinsi ya kuunda chama mpya
- Jinsi ya kujiunga na chama
- Jinsi ya kufanya mchango
- Jinsi ya kuangalia pesa zako
- Habari ya malipo na mizunguko

Maelekezo:
- Zungumza kwa Kiswahili au Kiingereza, kulingana na lugha ya mtumiaji
- Eleza kwa urahisi, watu wengi hawana ujuzi wa teknolojia
- Kumbuka chamas ni vikundi vya akiba vya jamii
- Tumia MetaMask kwa malipo ya blockchain (Ethereum)
- Mchango unafanywa kwa USDC au sarafu nyingine za kidijitali`;

    console.log("Processing chat message:", { length: message.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Sorry, I could not respond.";

    console.log("AI response generated:", { length: aiMessage.length });

    return new Response(
      JSON.stringify({ message: aiMessage } as ChatResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
