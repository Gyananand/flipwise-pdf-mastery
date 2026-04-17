import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeckCard, type DeckSummary } from "@/components/DeckCard";
import { PdfUploadZone } from "@/components/PdfUploadZone";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Zap, BookOpen, Flame, GraduationCap, Loader2 } from "lucide-react";

type Stats = {
  total_cards: number;
  due_today: number;
  mastered: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [stats, setStats] = useState<Stats>({ total_cards: 0, due_today: 0, mastered: 0 });
  const [streak, setStreak] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const [decksRes, statsRes] = await Promise.all([
      supabase
        .from("decks")
        .select("id, name, emoji, color, description, total_cards, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_stats")
        .select("current_streak")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setStreak(statsRes.data?.current_streak ?? 0);

    if (!decksRes.data) {
      setDecks([]);
      return;
    }

    const deckIds = decksRes.data.map((d) => d.id);
    let cards: { deck_id: string; mastery_state: string; due_date: string }[] = [];
    if (deckIds.length > 0) {
      const { data: cardData } = await supabase
        .from("cards")
        .select("deck_id, mastery_state, due_date")
        .in("deck_id", deckIds);
      cards = cardData ?? [];
    }

    const now = Date.now();
    const summaries: DeckSummary[] = decksRes.data.map((d) => {
      const mine = cards.filter((c) => c.deck_id === d.id);
      return {
        ...d,
        due_count: mine.filter((c) => new Date(c.due_date).getTime() <= now).length,
        new_count: mine.filter((c) => c.mastery_state === "new").length,
        learning_count: mine.filter((c) => c.mastery_state === "learning").length,
        mastered_count: mine.filter((c) => c.mastery_state === "mastered").length,
      };
    });

    setDecks(summaries);
    setStats({
      total_cards: cards.length,
      due_today: cards.filter((c) => new Date(c.due_date).getTime() <= now).length,
      mastered: cards.filter((c) => c.mastery_state === "mastered").length,
    });
  }, [user]);

  useEffect(() => {
    document.title = "Dashboard · FlipWise";
    load();
  }, [load]);

  const totalDue = stats.due_today;

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            {greeting()}{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">Pick up where you left off — or feed me a new PDF.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total cards" value={stats.total_cards} />
          <StatCard label="Due today" value={stats.due_today} accent={totalDue > 0 ? "hsl(var(--primary))" : undefined} />
          <StatCard label="Mastered" value={stats.mastered} accent="hsl(var(--success))" />
          <StatCard label="Current streak" value={streak} hint={streak === 1 ? "day" : "days"} accent="hsl(var(--warning))" />
        </div>

        {totalDue > 0 && (
          <Card className="overflow-hidden shadow-elevated">
            <div className="p-6 gradient-hero text-primary-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold">You have {totalDue} cards due</p>
                  <p className="text-sm opacity-90">Stay sharp — knock them out in a quick session.</p>
                </div>
              </div>
              <Button asChild size="lg" variant="secondary" className="shadow-lg">
                <Link to="/study/all">
                  <Flame className="h-4 w-4 mr-2" />
                  Study now
                </Link>
              </Button>
            </div>
          </Card>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Your decks
            </h2>
            {decks && decks.length > 0 && (
              <span className="text-sm text-muted-foreground">{decks.length} deck{decks.length === 1 ? "" : "s"}</span>
            )}
          </div>

          {decks === null ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : decks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-soft grid place-items-center mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold">No decks yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Drop a PDF below to create your first deck. We'll generate smart flashcards automatically.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {decks.map((d) => <DeckCard key={d.id} deck={d} />)}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Create a new deck
          </h2>
          <PdfUploadZone onUploaded={load} />
        </section>
      </div>
    </AppShell>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
