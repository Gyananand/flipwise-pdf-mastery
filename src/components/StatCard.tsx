import { Card } from "@/components/ui/card";
import { useCountUp } from "@/hooks/useCountUp";

export function StatCard({
  label, value, hint, accent,
}: { label: string; value: string | number; hint?: string; accent?: string }) {
  const numeric = typeof value === "number" ? value : Number(value);
  const isNumber = typeof value === "number" || (!Number.isNaN(numeric) && value !== "");
  const animated = useCountUp(isNumber ? numeric : 0, 900);
  const display = isNumber ? animated : value;

  return (
    <Card className="p-5 shadow-card hover-lift">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span
          className="font-display text-3xl font-semibold tabular-nums"
          style={accent ? { color: accent } : undefined}
        >
          {display}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
