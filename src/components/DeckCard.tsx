import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MasteryBadge } from "@/components/MasteryBadge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type DeckSummary = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  total_cards: number;
  created_at: string;
  due_count: number;
  new_count: number;
  learning_count: number;
  mastered_count: number;
};

export function DeckCard({ deck }: { deck: DeckSummary }) {
  const masteryPct = deck.total_cards > 0
    ? Math.round((deck.mastered_count / deck.total_cards) * 100)
    : 0;

  return (
    <Card className="group overflow-hidden hover-lift bg-card">
      <div className="h-1.5" style={{ background: deck.color }} />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="h-12 w-12 rounded-xl grid place-items-center text-2xl shrink-0"
              style={{ background: `${deck.color}1A` }}
            >
              <span>{deck.emoji}</span>
            </div>
            <div className="min-w-0">
              <Link to={`/deck/${deck.id}`} className="block">
                <h3 className="font-display font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                  {deck.name}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">
                {deck.total_cards} cards · {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mastery</span>
            <span className="font-mono font-medium">{masteryPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${masteryPct}%`, background: deck.color }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {deck.due_count > 0 && <MasteryBadge state="review" className="!bg-primary/15" />}
          {deck.new_count > 0 && (
            <span className="inline-flex items-center rounded-full border border-info/20 bg-info/10 text-info px-2.5 py-0.5 text-xs font-medium">
              {deck.new_count} new
            </span>
          )}
          {deck.learning_count > 0 && (
            <span className="inline-flex items-center rounded-full border border-warning/20 bg-warning/10 text-warning px-2.5 py-0.5 text-xs font-medium">
              {deck.learning_count} learning
            </span>
          )}
          {deck.due_count > 0 && (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
              {deck.due_count} due
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button asChild className="flex-1" size="sm">
            <Link to={`/study/${deck.id}`}>
              <Play className="h-3.5 w-3.5 mr-1.5" /> Study
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/deck/${deck.id}`}>Open</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
