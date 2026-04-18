import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfWeek, addDays, subDays, isSameDay } from "date-fns";

type Props = { counts: Record<string, number> };

const LEVELS = [
  { max: 0,  cls: "bg-secondary" },
  { max: 4,  cls: "bg-primary/30" },
  { max: 14, cls: "bg-primary/55" },
  { max: 29, cls: "bg-primary/80" },
  { max: Infinity, cls: "bg-primary" },
];

function levelFor(n: number) {
  return LEVELS.find((l) => n <= l.max) ?? LEVELS[LEVELS.length - 1];
}

export function HeatmapGrid({ counts }: Props) {
  const today = new Date();
  // grid: 53 weeks ending on the current week
  const weeks = useMemo(() => {
    const lastWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    const firstWeekStart = subDays(lastWeekStart, 7 * 52);
    const arr: Date[][] = [];
    for (let w = 0; w < 53; w++) {
      const weekStart = addDays(firstWeekStart, w * 7);
      const days: Date[] = [];
      for (let d = 0; d < 7; d++) days.push(addDays(weekStart, d));
      arr.push(days);
    }
    return arr;
  }, []);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const m = week[0].getMonth();
      if (m !== lastMonth && week[0].getDate() <= 7) {
        labels.push({ col, label: format(week[0], "MMM") });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-block min-w-full">
          {/* month labels */}
          <div className="grid mb-1" style={{ gridTemplateColumns: `auto repeat(53, minmax(0, 1fr))`, gap: 2 }}>
            <div />
            {weeks.map((_, col) => {
              const lbl = monthLabels.find((m) => m.col === col);
              return (
                <div key={col} className="text-[10px] text-muted-foreground h-3 leading-none">
                  {lbl?.label ?? ""}
                </div>
              );
            })}
          </div>
          {/* rows */}
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
            <div
              key={dow}
              className="grid items-center"
              style={{ gridTemplateColumns: `auto repeat(53, minmax(0, 1fr))`, gap: 2, marginBottom: 2 }}
            >
              <div className="text-[10px] text-muted-foreground pr-2 w-8">
                {dow % 2 === 1 ? format(addDays(startOfWeek(today, { weekStartsOn: 0 }), dow), "EEE") : ""}
              </div>
              {weeks.map((week, col) => {
                const day = week[dow];
                if (day > today) return <div key={col} className="h-3 w-3 rounded-sm" />;
                const key = format(day, "yyyy-MM-dd");
                const n = counts[key] ?? 0;
                const isToday = isSameDay(day, today);
                return (
                  <Tooltip key={col}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-3 w-3 rounded-sm ${levelFor(n).cls} ${isToday ? "ring-1 ring-primary" : ""}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <span className="font-mono">{n}</span> card{n === 1 ? "" : "s"} · {format(day, "MMM d, yyyy")}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
          {/* legend */}
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            {LEVELS.map((l, i) => <div key={i} className={`h-3 w-3 rounded-sm ${l.cls}`} />)}
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
