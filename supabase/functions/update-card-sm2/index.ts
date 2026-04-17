// Apply SM-2 algorithm to a card and update study stats / XP / streak
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// rating: 0=again, 1=hard, 2=good, 3=easy
const QUALITY = [0, 3, 4, 5];
const XP_GAIN = [1, 1, 2, 3];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const cardId = body.card_id as string;
    const rating = Number(body.rating);

    if (!cardId || ![0, 1, 2, 3].includes(rating)) {
      return new Response(
        JSON.stringify({ error: "Invalid card_id or rating" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch card (RLS will guard ownership)
    const { data: card, error: cardErr } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (cardErr || !card) {
      return new Response(
        JSON.stringify({ error: "Card not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quality = QUALITY[rating];
    let { ease_factor, interval, repetitions } = card as {
      ease_factor: number; interval: number; repetitions: number;
    };

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * ease_factor);
      repetitions += 1;
    }

    ease_factor = Math.max(
      1.3,
      ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );

    let mastery_state: "new" | "learning" | "review" | "mastered" = "new";
    if (interval > 21 && ease_factor > 2.3) mastery_state = "mastered";
    else if (repetitions >= 2) mastery_state = "review";
    else if (repetitions >= 1) mastery_state = "learning";
    else mastery_state = "new";

    const dueDate = new Date(Date.now() + interval * 86_400_000).toISOString();

    const wasMasteredBefore = card.mastery_state === "mastered";
    const becameMastered = !wasMasteredBefore && mastery_state === "mastered";

    const { error: updateErr } = await supabase
      .from("cards")
      .update({
        ease_factor,
        interval,
        repetitions,
        due_date: dueDate,
        mastery_state,
        last_rating: rating,
      })
      .eq("id", cardId);

    if (updateErr) {
      console.error("Card update failed", updateErr);
      return new Response(
        JSON.stringify({ error: "Could not update card" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // XP / streak update
    const xpGain = XP_GAIN[rating] + (becameMastered ? 50 : 0);
    const today = new Date().toISOString().slice(0, 10);

    const { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (stats) {
      let newStreak = stats.current_streak ?? 0;
      const last = stats.last_studied_date as string | null;
      if (last !== today) {
        if (last) {
          const lastDate = new Date(last);
          const diff = Math.round((Date.now() - lastDate.getTime()) / 86_400_000);
          newStreak = diff === 1 ? newStreak + 1 : 1;
        } else {
          newStreak = 1;
        }
      }
      const longest = Math.max(stats.longest_streak ?? 0, newStreak);

      await supabase
        .from("user_stats")
        .update({
          xp_points: (stats.xp_points ?? 0) + xpGain,
          total_cards_studied: (stats.total_cards_studied ?? 0) + 1,
          current_streak: newStreak,
          longest_streak: longest,
          last_studied_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabase.from("user_stats").insert({
        user_id: userId,
        xp_points: xpGain,
        total_cards_studied: 1,
        current_streak: 1,
        longest_streak: 1,
        last_studied_date: today,
      });
    }

    // Update parent deck last_studied_at
    await supabase
      .from("decks")
      .update({ last_studied_at: new Date().toISOString() })
      .eq("id", card.deck_id);

    return new Response(
      JSON.stringify({
        success: true,
        ease_factor,
        interval,
        repetitions,
        mastery_state,
        due_date: dueDate,
        xp_gained: xpGain,
        became_mastered: becameMastered,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("update-card-sm2 error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
