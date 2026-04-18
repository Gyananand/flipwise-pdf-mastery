// Generate flashcards from extracted PDF text using Lovable AI Gateway (Gemini)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROMPT_TEMPLATE = `You are an expert educator creating comprehensive flashcards from study material.

Analyze the following text and generate 20-30 high-quality flashcards that:
1. Cover ALL key concepts, definitions, formulas, theorems, and facts
2. Include "why" and "how" questions, not just "what" questions
3. Cover relationships between concepts and edge cases
4. Include worked example questions where applicable
5. Write questions like a great teacher — specific, clear, thought-provoking
6. Write answers: concise but complete (2-4 sentences max)
7. Assign each card a topic_tag (e.g. "Definition", "Formula", "Application", "Concept", "Example", "Relationship")
8. Assign difficulty_hint: "easy" for recall, "medium" for understanding, "hard" for application/analysis

Text to analyze:
[EXTRACTED_TEXT]`;

const COLORS = [
  "#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706",
  "#DB2777", "#0891B2", "#65A30D", "#EA580C", "#9333EA",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const extractedText: string = (body.extracted_text ?? "").toString();
    const deckName: string = (body.deck_name ?? "Untitled Deck").toString();
    const sourceFilename: string = (body.source_filename ?? "").toString();

    if (!extractedText || extractedText.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Not enough text extracted from PDF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cap text size to keep token usage reasonable
    const trimmed = extractedText.slice(0, 60_000);
    const userPrompt = PROMPT_TEMPLATE.replace("[EXTRACTED_TEXT]", trimmed);

    // Call Lovable AI Gateway with tool calling for structured output
    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an expert educator. Use the create_flashcards tool to return your output." },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_flashcards",
                description: "Return generated flashcards with metadata",
                parameters: {
                  type: "object",
                  properties: {
                    deck_description: { type: "string" },
                    suggested_emoji: { type: "string" },
                    cards: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          answer: { type: "string" },
                          topic_tag: { type: "string" },
                          difficulty_hint: { type: "string", enum: ["easy", "medium", "hard"] },
                        },
                        required: ["question", "answer", "topic_tag", "difficulty_hint"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["deck_description", "suggested_emoji", "cards"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_flashcards" } },
        }),
      }
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "AI did not return structured output" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: {
      deck_description: string;
      suggested_emoji: string;
      cards: Array<{ question: string; answer: string; topic_tag: string; difficulty_hint: "easy" | "medium" | "hard" }>;
    };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Could not parse tool args", toolCall.function.arguments);
      return new Response(
        JSON.stringify({ error: "Could not parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed.cards || parsed.cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "No cards generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // Insert deck
    const { data: deck, error: deckErr } = await supabase
      .from("decks")
      .insert({
        user_id: userId,
        name: deckName,
        description: parsed.deck_description,
        color,
        emoji: parsed.suggested_emoji || "📚",
        source_filename: sourceFilename,
      })
      .select()
      .single();

    if (deckErr || !deck) {
      console.error("Deck insert failed", deckErr);
      return new Response(
        JSON.stringify({ error: "Could not create deck" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert cards
    const cardsToInsert = parsed.cards.map((c) => ({
      deck_id: deck.id,
      question: c.question,
      answer: c.answer,
      topic_tag: c.topic_tag || "Concept",
      difficulty_hint: ["easy", "medium", "hard"].includes(c.difficulty_hint) ? c.difficulty_hint : "medium",
    }));

    const { error: cardsErr } = await supabase.from("cards").insert(cardsToInsert);
    if (cardsErr) {
      console.error("Cards insert failed", cardsErr);
      // Roll back deck
      await supabase.from("decks").delete().eq("id", deck.id);
      return new Response(
        JSON.stringify({ error: "Could not create cards" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ deck_id: deck.id, cards_count: cardsToInsert.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-flashcards error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
