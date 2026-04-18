import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopicTag } from "@/components/TopicTag";
import { Loader2, X, Sparkles, Keyboard, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

type Card = {
  id: string;
  question: string;
  answer: string;
  topic_tag: string;
  mastery_state: string;
  due_date: string;
  deck_id: string;
};

const RATINGS = [
  { rating: 0, label: "Again", emoji: "😰", hint: "No idea", color: "destructive", key: "1" },
  { rating: 1, label: "Hard", emoji: "😓", hint: "Struggled", color: "warning", key: "2" },
  { rating: 2, label: "Good", emoji: "🙂", hint: "Got it", color: "info", key: "3" },
  { rating: 3, label: "Easy", emoji: "😄", hint: "Perfect", color: "success", key: "4" },
] as const;

const RATING_BG: Record<string, string> = {
  destructive: "bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30",
  warning: "bg-warning/10 hover:bg-warning/20 text-warning border-warning/30",
  info: "bg-info/10 hover:bg-info/20 text-info border-info/30",
  success: "bg-success/10 hover:bg-success/20 text-success border-success/30",
};

export default function StudySession() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const mode = params.get("mode") ?? "due";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [queue, setQueue] = useState<Card[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [done, setDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const submittingRef = useRef(false);

  const loadQueue = useCallback(async () => {
    if (!user) return;
    const isAll = id === "all";

    // Read user prefs (set in /settings)
    let newPerSession = 10;
    let sessionCap = 20;
    try {
      const raw = localStorage.getItem("flipwise:prefs");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.newPerSession === "number") newPerSession = p.newPerSession;
        if (typeof p.dailyGoal === "number") sessionCap = p.dailyGoal;
      }
    } catch { /* ignore */ }

    let query = supabase
      .from("cards")
      .select("id, question, answer, topic_tag, mastery_state, due_date, deck_id, decks!inner(user_id)")
      .eq("decks.user_id", user.id);

    if (!isAll && id) query = query.eq("deck_id", id);
    const { data, error } = await query;
    if (error) { toast.error("Could not load cards"); return; }

    let cards = (data ?? []) as Card[];
    const now = Date.now();

    if (mode === "all") {
      // keep all
    } else if (mode === "shuffle") {
      cards = [...cards].sort(() => Math.random() - 0.5);
    } else {
      // due mode (default)
      const due = cards.filter((c) => new Date(c.due_date).getTime() <= now);
      const newOnes = cards.filter((c) => c.mastery_state === "new").slice(0, newPerSession);
      // merge unique
      const map = new Map<string, Card>();
      [...due, ...newOnes].forEach((c) => map.set(c.id, c));
      cards = Array.from(map.values());
    }

    // session cap from settings
    cards = cards.slice(0, sessionCap);
    // shuffle queue order for due/all (skip if explicit shuffle already done)
    if (mode !== "shuffle") cards.sort(() => Math.random() - 0.5);

    setQueue(cards);
    setIdx(0);
    setFlipped(false);
    setTally({ again: 0, hard: 0, good: 0, easy: 0 });
    setDone(false);
    startTimeRef.current = Date.now();
  }, [user, id, mode]);

  useEffect(() => { loadQueue(); }, [loadQueue]);
  useEffect(() => { document.title = "Study · FlipWise"; }, []);

  const current = queue?.[idx] ?? null;

  const submitRating = useCallback(async (rating: 0 | 1 | 2 | 3) => {
    if (!current || submittingRef.current || !flipped) return;
    submittingRef.current = true;

    const key = (["again", "hard", "good", "easy"] as const)[rating];
    setTally((t) => ({ ...t, [key]: t[key] + 1 }));

    // call edge function (don't block UI on response except for XP totals)
    supabase.functions
      .invoke("update-card-sm2", { body: { card_id: current.id, rating } })
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        if (data?.xp_gained) setXpEarned((x) => x + data.xp_gained);
        if (data?.became_mastered) {
          toast.success("🎯 Card mastered!", { duration: 1800 });
        }
      });

    setTransitioning(true);
    setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx >= (queue?.length ?? 0)) {
        finalizeSession();
      } else {
        setIdx(nextIdx);
        setFlipped(false);
        setTransitioning(false);
      }
      submittingRef.current = false;
    }, 280);
  }, [current, flipped, idx, queue]);

  const finalizeSession = useCallback(async () => {
    if (!user || !queue) return;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const total = queue.length;
    const goodEasy = tally.good + tally.easy;
    const success = total > 0 ? goodEasy / total : 0;

    await supabase.from("study_sessions").insert({
      user_id: user.id,
      deck_id: id !== "all" ? id : null,
      cards_studied: total,
      cards_again: tally.again,
      cards_hard: tally.hard,
      cards_good: tally.good,
      cards_easy: tally.easy,
      duration_seconds: duration,
    });

    // Bonus XP for completing session
    const { data: stats } = await supabase
      .from("user_stats").select("xp_points, total_sessions").eq("user_id", user.id).maybeSingle();
    if (stats) {
      await supabase.from("user_stats").update({
        xp_points: (stats.xp_points ?? 0) + 10,
        total_sessions: (stats.total_sessions ?? 0) + 1,
      }).eq("user_id", user.id);
      setXpEarned((x) => x + 10);
    }

    if (success >= 0.8) {
      // Confetti!
      const launch = (origin: { x: number; y: number }) =>
        confetti({ particleCount: 80, spread: 70, origin, colors: ["#7C3AED", "#EDE9FE", "#059669", "#D97706"] });
      launch({ x: 0.2, y: 0.6 });
      launch({ x: 0.8, y: 0.6 });
      setTimeout(() => launch({ x: 0.5, y: 0.5 }), 250);
    }

    setDone(true);
    setTransitioning(false);
  }, [user, queue, tally, id]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); return; }
      if (e.key === "Escape") { navigate(-1); return; }
      if (flipped) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) submitRating((n - 1) as 0 | 1 | 2 | 3);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, submitRating, done, navigate]);

  if (queue === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="p-10 text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-display text-2xl font-semibold">You're all caught up!</h1>
          <p className="text-muted-foreground mt-2">No cards to study right now. Come back later.</p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (done) {
    const total = queue.length;
    const success = total > 0 ? Math.round(((tally.good + tally.easy) / total) * 100) : 0;
    const successColor = success >= 80 ? "text-success" : success >= 60 ? "text-info" : "text-warning";
    const message = success >= 90 ? "🌟 Outstanding work!"
      : success >= 75 ? "🚀 Great session!"
      : success >= 50 ? "👍 Solid effort — keep going."
      : "💪 Tough one. Review and try again.";
    const minutes = Math.floor((Date.now() - startTimeRef.current) / 60000);
    const seconds = Math.floor(((Date.now() - startTimeRef.current) % 60000) / 1000);

    return (
      <div className="min-h-screen grid place-items-center p-6 bg-background">
        <Card className="w-full max-w-lg p-8 sm:p-10 text-center shadow-elevated animate-scale-in">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-hero grid place-items-center mb-4">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-semibold">{message}</h1>
          <p className="text-muted-foreground mt-1">Session complete</p>

          <div className={cn("font-display text-6xl font-semibold mt-6", successColor)}>
            {success}%
          </div>
          <p className="text-sm text-muted-foreground">success rate</p>

          <div className="grid grid-cols-4 gap-3 mt-6">
            {(["again", "hard", "good", "easy"] as const).map((k, i) => (
              <div key={k} className="rounded-xl border border-border p-3">
                <div className="text-xl">{RATINGS[i].emoji}</div>
                <div className="font-mono text-xl font-semibold mt-1">{tally[k]}</div>
                <div className="text-xs text-muted-foreground capitalize">{k}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-muted-foreground text-xs">Time</div>
              <div className="font-mono font-semibold">{minutes}m {seconds}s</div>
            </div>
            <div className="rounded-lg bg-primary-soft p-3">
              <div className="text-primary/80 text-xs">XP earned</div>
              <div className="font-mono font-semibold text-primary">+{xpEarned}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-8">
            <Button onClick={loadQueue} className="flex-1">Study again</Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to={id !== "all" ? `/deck/${id}` : "/dashboard"}>
                {id !== "all" ? "Back to deck" : "Back to dashboard"}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const progress = ((idx) / queue.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container max-w-3xl flex items-center gap-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Exit">
            <X className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3 min-w-0">
            {id === "all" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-soft text-primary shrink-0">
                All Decks
              </span>
            )}
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-mono shrink-0">
            {idx + 1} / {queue.length}
          </div>
        </div>
      </header>

      {/* Card */}
      <div className="flex-1 container max-w-3xl py-8 sm:py-12 flex flex-col items-center justify-center">
        <div
          className={cn(
            "w-full perspective-1200",
            transitioning && "animate-slide-out-left",
            !transitioning && "animate-slide-in-right"
          )}
          key={current?.id}
        >
          <button
            onClick={() => setFlipped((f) => !f)}
            className="w-full text-left preserve-3d relative transition-transform duration-500 outline-none"
            style={{ transform: flipped ? "rotateY(180deg)" : "none", minHeight: "min(60vh, 480px)" }}
            aria-label="Flip card"
          >
            {/* Front */}
            <Card className="absolute inset-0 backface-hidden p-6 sm:p-10 flex flex-col shadow-flashcard">
              <div className="flex items-center justify-between">
                <TopicTag tag={current?.topic_tag ?? "Concept"} />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Question</span>
              </div>
              <div className="flex-1 grid place-items-center py-6">
                <p className="font-display text-2xl sm:text-3xl text-center leading-snug">
                  {current?.question}
                </p>
              </div>
              <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Keyboard className="h-3.5 w-3.5" /> Tap or press <kbd className="font-mono px-1.5 py-0.5 rounded border border-border bg-secondary">Space</kbd> to reveal
              </div>
            </Card>
            {/* Back */}
            <Card className="absolute inset-0 backface-hidden rotate-y-180 p-6 sm:p-10 flex flex-col shadow-flashcard bg-primary-soft border-primary/20">
              <div className="flex items-center justify-between">
                <TopicTag tag={current?.topic_tag ?? "Concept"} className="!bg-primary !text-primary-foreground" />
                <span className="text-xs uppercase tracking-wider text-primary/70">Answer</span>
              </div>
              <div className="flex-1 grid place-items-center py-6">
                <p className="text-xl sm:text-2xl text-center leading-relaxed text-foreground whitespace-pre-wrap">
                  {current?.answer}
                </p>
              </div>
              <div className="text-center text-xs text-primary/70 flex items-center justify-center gap-2">
                <ArrowRight className="h-3.5 w-3.5" /> Rate how well you knew it
              </div>
            </Card>
          </button>
        </div>

        {/* Rating buttons */}
        <div className="w-full mt-8">
          <div
            className={cn(
              "grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity duration-200",
              flipped ? "opacity-100" : "opacity-30 pointer-events-none"
            )}
          >
            {RATINGS.map((r) => (
              <button
                key={r.rating}
                onClick={() => submitRating(r.rating)}
                disabled={!flipped}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-elevated",
                  RATING_BG[r.color]
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{r.emoji}</span>
                  <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-current/20 opacity-60">
                    {r.key}
                  </kbd>
                </div>
                <div className="mt-2 font-display font-semibold">{r.label}</div>
                <div className="text-xs opacity-80">{r.hint}</div>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            <kbd className="font-mono px-1.5 py-0.5 rounded border border-border">Space</kbd> flip ·
            <kbd className="font-mono px-1.5 py-0.5 rounded border border-border ml-1">1-4</kbd> rate ·
            <kbd className="font-mono px-1.5 py-0.5 rounded border border-border ml-1">Esc</kbd> exit
          </p>
        </div>
      </div>
    </div>
  );
}
