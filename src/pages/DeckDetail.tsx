import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MasteryBadge } from "@/components/MasteryBadge";
import { TopicTag } from "@/components/TopicTag";
import { StatCard } from "@/components/StatCard";
import { Loader2, Play, Shuffle, Trash2, ArrowLeft, BookOpen, ChevronDown } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { computeProgress } from "@/lib/progress";

type Deck = {
  id: string; name: string; emoji: string; color: string;
  description: string | null; created_at: string;
  source_filename: string | null; total_cards: number;
};
type Card = {
  id: string; question: string; answer: string;
  topic_tag: string; mastery_state: string; due_date: string;
};

export default function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "learning" | "review" | "mastered" | "due">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from("decks").select("*").eq("id", id).maybeSingle(),
      supabase.from("cards")
        .select("id, question, answer, topic_tag, mastery_state, due_date")
        .eq("deck_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setDeck(d as Deck | null);
    setCards((c as Card[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (deck) document.title = `${deck.name} · FlipWise`; }, [deck]);

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      new: cards.filter((c) => c.mastery_state === "new").length,
      learning: cards.filter((c) => c.mastery_state === "learning").length,
      review: cards.filter((c) => c.mastery_state === "review").length,
      mastered: cards.filter((c) => c.mastery_state === "mastered").length,
      due: cards.filter((c) => new Date(c.due_date).getTime() <= now).length,
    };
  }, [cards]);

  const filtered = useMemo(() => {
    const now = Date.now();
    if (filter === "all") return cards;
    if (filter === "due") return cards.filter((c) => new Date(c.due_date).getTime() <= now);
    return cards.filter((c) => c.mastery_state === filter);
  }, [cards, filter]);

  async function handleDelete() {
    if (!id) return;
    const { error } = await supabase.from("decks").delete().eq("id", id);
    if (error) { toast.error("Could not delete deck"); return; }
    toast.success("Deck deleted");
    navigate("/dashboard");
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!deck) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Deck not found.</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </AppShell>
    );
  }

  const progressPct = computeProgress({
    new_count: counts.new,
    learning_count: counts.learning,
    review_count: counts.review,
    mastered_count: counts.mastered,
    total_cards: cards.length,
  });

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground story-link">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <Card className="overflow-hidden">
          <div className="h-1.5" style={{ background: deck.color }} />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start gap-6">
            <div
              className="h-16 w-16 rounded-2xl grid place-items-center text-3xl shrink-0"
              style={{ background: `${deck.color}1A` }}
            >
              {deck.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-semibold">{deck.name}</h1>
              {deck.description && <p className="text-muted-foreground mt-1">{deck.description}</p>}
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                {deck.total_cards} cards · Created {format(new Date(deck.created_at), "MMM d, yyyy")}
                {deck.source_filename ? ` · From ${deck.source_filename}` : ""}
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{deck.name}" and all {deck.total_cards} cards. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete deck
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="New" value={counts.new} accent="hsl(var(--info))" />
          <StatCard label="Learning" value={counts.learning} accent="hsl(var(--warning))" />
          <StatCard label="Review" value={counts.review} accent="hsl(var(--primary))" />
          <StatCard label="Mastered" value={`${counts.mastered}`} hint={`${progressPct}% progress`} accent="hsl(var(--success))" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" disabled={counts.due === 0}>
            <Link to={`/study/${deck.id}`}>
              <Play className="h-4 w-4 mr-2" /> Study due cards ({counts.due})
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to={`/study/${deck.id}?mode=all`}>Study all cards</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to={`/study/${deck.id}?mode=shuffle`}>
              <Shuffle className="h-4 w-4 mr-2" /> Shuffle &amp; study
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Cards
            </h2>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="due">Due</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="learning">Learning</TabsTrigger>
                <TabsTrigger value="mastered">Mastered</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">No cards in this view.</div>
            )}
            {filtered.map((c) => {
              const isOpen = expanded === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  className="w-full text-left p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TopicTag tag={c.topic_tag} />
                        <MasteryBadge state={c.mastery_state} />
                        <span className="text-xs text-muted-foreground">
                          Next: {formatDistanceToNow(new Date(c.due_date), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-medium line-clamp-2">{c.question}</p>
                      {isOpen && (
                        <p className="text-sm text-muted-foreground pt-2 border-t border-border mt-2 whitespace-pre-wrap">
                          {c.answer}
                        </p>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
