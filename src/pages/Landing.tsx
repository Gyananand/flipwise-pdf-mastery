import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Brain, Repeat2, TrendingUp,
  Upload, Wand2, GraduationCap, ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "FlipWise — Drop a PDF. Master it forever.";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleGuest() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast.success("Welcome! You're in guest mode.");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Could not start guest session");
      console.error(err);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="container max-w-7xl flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-hero grid place-items-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-semibold">FlipWise</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth?mode=signup">Get started</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative container max-w-5xl pt-12 sm:pt-20 pb-16 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" /> AI-powered spaced repetition
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-semibold leading-[1.02] tracking-tight">
          Drop a PDF.<br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
            Master it forever.
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          FlipWise turns any study material into smart flashcards that adapt to how well you know them — powered by spaced repetition.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="text-base h-12 px-6 shadow-elevated rounded-full animate-pulse-cta">
            <Link to="/auth?mode=signup">
              Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base h-12 px-6 rounded-full" onClick={handleGuest} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Try as Guest
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card · No email needed for guest mode</p>
      </section>

      {/* Features */}
      <section className="container max-w-6xl pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          <Feature
            icon={<Brain className="h-5 w-5" />}
            title="AI-Powered Cards"
            text="Gemini reads your PDF like a great teacher and writes 20–30 deep, thoughtful flashcards."
          />
          <Feature
            icon={<Repeat2 className="h-5 w-5" />}
            title="SM-2 Spaced Repetition"
            text="Cards you struggle with show up more often. Cards you know fade into the background."
          />
          <Feature
            icon={<TrendingUp className="h-5 w-5" />}
            title="Track Your Mastery"
            text="See exactly what you know, what's still learning, and what needs more work."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="container max-w-5xl py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">How it works</h2>
          <p className="text-muted-foreground mt-2">Three steps from PDF to mastery.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <Step
            n={1}
            icon={<Upload className="h-6 w-6" />}
            title="Upload any PDF"
            text="Lecture notes, textbook chapters, research papers — drop it in and let us read it."
          />
          <Step
            n={2}
            icon={<Wand2 className="h-6 w-6" />}
            title="AI generates cards"
            text="Get 20–30 high-quality flashcards covering every key concept, definition, and formula."
          />
          <Step
            n={3}
            icon={<GraduationCap className="h-6 w-6" />}
            title="Study smart"
            text="The app remembers what you know and shows the right card at the right time."
          />
        </div>
        <div className="text-center mt-12">
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link to="/auth?mode=signup">Start studying — it's free <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </section>

      <footer className="container max-w-7xl py-10 text-center text-sm text-muted-foreground border-t border-border">
        Built for the Cuemath AI Builder Challenge · © FlipWise
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="p-6 hover-lift">
      <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{text}</p>
    </Card>
  );
}

function Step({ n, icon, title, text }: { n: number; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="text-center">
      <div className="relative inline-block">
        <div className="h-16 w-16 rounded-2xl gradient-hero grid place-items-center text-primary-foreground shadow-elevated">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border grid place-items-center text-xs font-mono font-semibold">
          {n}
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs mx-auto">{text}</p>
    </div>
  );
}
