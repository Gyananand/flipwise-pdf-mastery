import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Sign in · FlipWise";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created! You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    setBusy(true);
    try {
      // Quick guest = anonymous-style account with random creds.
      const guestEmail = `guest_${crypto.randomUUID().slice(0, 8)}@flipwise.app`;
      const guestPwd = crypto.randomUUID();
      const { error } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPwd,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Welcome, guest!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Could not create guest account");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left visual */}
      <div className="hidden lg:flex flex-col justify-between p-12 gradient-hero text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl font-semibold">FlipWise</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="font-display text-5xl font-semibold leading-[1.05]">
            Drop a PDF.<br/>Master it forever.
          </h1>
          <p className="text-lg text-primary-foreground/90">
            FlipWise turns any study material into smart flashcards that adapt to how well you know them.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 text-sm">
            <div><div className="font-display text-3xl font-semibold">AI</div><div className="opacity-80">Card generation</div></div>
            <div><div className="font-display text-3xl font-semibold">SM-2</div><div className="opacity-80">Spaced repetition</div></div>
            <div><div className="font-display text-3xl font-semibold">📈</div><div className="opacity-80">Progress tracking</div></div>
          </div>
        </div>
        <div className="text-sm opacity-70">© FlipWise — Built for serious learners.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl gradient-hero grid place-items-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-semibold">FlipWise</span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {mode === "signin" ? "Sign in to keep your streak alive." : "Start turning PDFs into mastery."}
            </p>
          </div>

          <Card className="p-6 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <button
              type="button"
              className="mt-4 text-sm text-muted-foreground hover:text-foreground story-link"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </Card>

          <div className="relative text-center">
            <div className="absolute inset-x-0 top-1/2 border-t border-border" />
            <span className="relative bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">or</span>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGuest} disabled={busy}>
            Continue as guest
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Guest accounts are created instantly. No email needed.
          </p>
        </div>
      </div>
    </div>
  );
}
