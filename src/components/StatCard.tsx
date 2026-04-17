import { Card } from "@/components/ui/card";

export function StatCard({
  label, value, hint, accent,
}: { label: string; value: string | number; hint?: string; accent?: string }) {
  return (
    <Card className="p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold" style={accent ? { color: accent } : undefined}>
          {value}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
