import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GuestBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-soft/60 px-4 py-3 flex items-center gap-3 text-sm">
      <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center shrink-0">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium">You're in guest mode.</span>{" "}
        <span className="text-muted-foreground">Sign up to save progress across devices.</span>
      </div>
      <Button asChild size="sm" variant="default">
        <Link to="/auth?mode=signup">Sign up</Link>
      </Button>
      <button
        onClick={() => setHidden(true)}
        className="p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
