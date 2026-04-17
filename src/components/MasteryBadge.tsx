import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  new: "bg-info/10 text-info border-info/20",
  learning: "bg-warning/10 text-warning border-warning/20",
  review: "bg-primary/10 text-primary border-primary/20",
  mastered: "bg-success/10 text-success border-success/20",
};

const LABELS: Record<string, string> = {
  new: "New",
  learning: "Learning",
  review: "Review",
  mastered: "Mastered",
};

export function MasteryBadge({ state, className }: { state: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[state] ?? STYLES.new,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[state] ?? "New"}
    </span>
  );
}
