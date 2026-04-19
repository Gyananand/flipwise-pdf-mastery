import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function LevelUpModal({
  open, onOpenChange, levelName, threshold,
}: { open: boolean; onOpenChange: (v: boolean) => void; levelName: string; threshold: number }) {
  useEffect(() => {
    if (!open) return;
    const burst = (origin: { x: number; y: number }) =>
      confetti({ particleCount: 90, spread: 80, origin, colors: ["#7C3AED", "#EDE9FE", "#FDE047", "#F59E0B"] });
    burst({ x: 0.3, y: 0.5 });
    burst({ x: 0.7, y: 0.5 });
    setTimeout(() => burst({ x: 0.5, y: 0.4 }), 300);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center p-8">
        <div className="mx-auto h-20 w-20 rounded-2xl gradient-hero grid place-items-center shadow-elevated animate-level-pop">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h2 className="font-display text-3xl font-semibold mt-4">Level Up!</h2>
        <p className="text-muted-foreground mt-1">You reached</p>
        <p className="font-display text-2xl font-semibold text-primary mt-1">{levelName}</p>
        <p className="text-xs text-muted-foreground mt-1">at {threshold} XP</p>
        <Button className="mt-6 w-full" onClick={() => onOpenChange(false)}>
          Keep going 🚀
        </Button>
      </DialogContent>
    </Dialog>
  );
}
