import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Moon, Sun, LogOut, UserPlus, User } from "lucide-react";

const PREFS_KEY = "flipwise:prefs";
type Prefs = { dailyGoal: number; newPerSession: number };
const DEFAULTS: Prefs = { dailyGoal: 20, newPerSession: 10 };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export default function Settings() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [dark, setDark] = useState<boolean>(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Settings · FlipWise"; }, []);

  function updatePrefs(p: Partial<Prefs>) {
    const next = { ...prefs, ...p };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }

  function toggleDark(value: boolean) {
    setDark(value);
    if (value) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("flipwise:theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("flipwise:theme", "light");
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-1">Tune FlipWise to fit how you study.</p>
        </div>

        {/* Account */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold">Account</h2>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="font-mono mt-0.5">
              {isGuest ? "Guest user" : user?.email ?? "—"}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {isGuest && (
              <Button variant="outline" className="flex-1" onClick={() => navigate("/auth?mode=signup")}>
                <UserPlus className="h-4 w-4 mr-2" /> Convert to full account
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={handleSignOut}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
              Sign out
            </Button>
          </div>
          {isGuest && (
            <p className="text-xs text-muted-foreground">
              Heads up — guest data lives in this browser. Convert to a full account to sync across devices.
            </p>
          )}
        </Card>

        {/* Study preferences */}
        <Card className="p-6 space-y-6">
          <h2 className="font-display font-semibold">Study preferences</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Daily study goal</Label>
              <span className="font-mono text-sm font-semibold">{prefs.dailyGoal} cards</span>
            </div>
            <Slider
              value={[prefs.dailyGoal]}
              min={5} max={50} step={5}
              onValueChange={([v]) => updatePrefs({ dailyGoal: v })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>New cards per session</Label>
              <span className="font-mono text-sm font-semibold">{prefs.newPerSession}</span>
            </div>
            <Slider
              value={[prefs.newPerSession]}
              min={5} max={20} step={5}
              onValueChange={([v]) => updatePrefs({ newPerSession: v })}
            />
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6 space-y-3">
          <h2 className="font-display font-semibold">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <Label>Dark mode</Label>
                <p className="text-xs text-muted-foreground">Easier on the eyes for late-night study.</p>
              </div>
            </div>
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </div>
        </Card>

      </div>
    </AppShell>
  );
}
