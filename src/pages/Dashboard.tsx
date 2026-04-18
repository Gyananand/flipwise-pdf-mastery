import { useEffect, useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeckCard, type DeckSummary } from "@/components/DeckCard";
import { PdfUploadZone } from "@/components/PdfUploadZone";
import { StatCard } from "@/components/StatCard";
import { GuestBanner } from "@/components/GuestBanner";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Sparkles, Zap, BookOpen, Flame, GraduationCap, Loader2, Search, X, CalendarDays } from "lucide-react";
import { format } from "date-fns";

type Stats = {
  total_cards: number;
  due_today: number;
  mastered: number;
};

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [stats, setStats] = useState<Stats>({ total_cards: 0, due_today: 0, mastered: 0 });
  const [streak, setStreak] = useState(0);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  // Make sure user_stats row exists (handles anonymous users where trigger may not fire)
  useEffect(() => {
    if (!user) return;
    supabase.from("user_stats").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    const [decksRes, statsRes, sessionsRes] = await Promise.all([
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
      supabase
        .from("study_sessions")
        .select("studied_at, cards_studied")
        .eq("user_id", user.id),
    ]);

    setStreak(statsRes.data?.current_streak ?? 0);

    // Build heatmap: yyyy-MM-dd -> total cards
    const hm: Record<string, number> = {};
    (sessionsRes.data ?? []).forEach((s) => {
      const day = format(new Date(s.studied_at), "yyyy-MM-dd");
      hm[day] = (hm[day] ?? 0) + (s.cards_studied ?? 0);
    });
    setHeatmap(hm);

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

  const filteredDecks = useMemo(() => {
    if (!decks) return null;
    const q = search.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter((d) => d.name.toLowerCase().includes(q));
  }, [decks, search]);

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        {isGuest && <GuestBanner />}

        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            {greeting()}{!isGuest && user?.email ? `, ${user.email.split("@")[0]}` : ""}
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

        {/* Heatmap */}
        <section>
          <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-primary" /> Study activity
          </h2>
          <Card className="p-4 sm:p-5">
            <HeatmapGrid counts={heatmap} />
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Your decks
            </h2>
            <div className="flex items-center gap-3">
              {decks && decks.length > 0 && (
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your decks..."
                    className="pl-9 pr-8 w-56"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {decks && decks.length > 0 && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {decks.length} deck{decks.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          {decks === null ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <Card key={i} className="p-5 space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-secondary animate-pulse" />
                  <div className="h-5 w-2/3 bg-secondary rounded animate-pulse" />
                  <div className="h-2 w-full bg-secondary rounded animate-pulse" />
                  <div className="h-8 w-full bg-secondary rounded animate-pulse" />
                </Card>
              ))}
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
          ) : filteredDecks && filteredDecks.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">
                No decks match "<span className="font-medium text-foreground">{search}</span>"
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredDecks!.map((d) => <DeckCard key={d.id} deck={d} />)}
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
