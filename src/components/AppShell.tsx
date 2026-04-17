import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Flame, LogOut, LayoutDashboard, Settings, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { levelForXp } from "@/lib/levels";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<{ xp_points: number; current_streak: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("user_stats")
        .select("xp_points, current_streak")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data) setStats(data);
    }
    load();
    // refresh stats on route change to reflect study activity
    return () => { cancelled = true; };
  }, [user, location.pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  }

  const xp = stats?.xp_points ?? 0;
  const streak = stats?.current_streak ?? 0;
  const { current, next, progress } = levelForXp(xp);
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container max-w-7xl flex h-16 items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg gradient-hero grid place-items-center group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">FlipWise</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-sm">
              <Flame className="h-4 w-4 text-warning" />
              <span className="font-mono font-semibold">{streak}</span>
              <span className="text-muted-foreground hidden md:inline">day streak</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">{current.name}</span>
              <span className="font-mono text-xs text-primary/70">· {xp} XP</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {next && (
          <div className="container max-w-7xl pb-2 sm:hidden">
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
      </header>

      <main className="container max-w-7xl py-8">{children}</main>
    </div>
  );
}
