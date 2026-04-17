import { useCallback, useState } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractPdfText } from "@/lib/pdf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const STAGES = [
  { pct: 20, label: "Reading your PDF…" },
  { pct: 40, label: "Identifying key concepts…" },
  { pct: 60, label: "Crafting intelligent questions…" },
  { pct: 80, label: "Applying spaced repetition metadata…" },
  { pct: 100, label: "Finalizing your deck…" },
];

export function PdfUploadZone({ onUploaded }: { onUploaded?: () => void }) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("PDF is over 10MB — try a smaller chapter");
      return;
    }
    setFile(f);
    setProgress(0);
    setStage(STAGES[0].label);

    try {
      const text = await extractPdfText(f, (pct) => {
        // Map extraction to 0-30%
        const mapped = Math.round(pct * 0.3);
        setProgress(mapped);
        if (mapped >= 20) setStage(STAGES[1].label);
      });

      if (!text || text.length < 200) {
        toast.error("Could not extract enough text — is this a scanned/image PDF?");
        setStage(null);
        setFile(null);
        return;
      }

      setStage(STAGES[2].label);
      setProgress(50);

      // Smooth fake progress while AI is thinking
      let p = 50;
      const tick = setInterval(() => {
        p = Math.min(90, p + 2);
        setProgress(p);
        if (p >= 60) setStage(STAGES[3].label);
        if (p >= 80) setStage(STAGES[4].label);
      }, 600);

      const deckName = f.name.replace(/\.pdf$/i, "");
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          extracted_text: text,
          deck_name: deckName,
          source_filename: f.name,
        },
      });
      clearInterval(tick);

      if (error) {
        // Try to surface a helpful message
        const ctx: any = (error as any).context;
        const status = ctx?.status;
        let msg = error.message || "AI generation failed";
        try {
          const body = ctx ? await ctx.json() : null;
          if (body?.error) msg = body.error;
        } catch {}
        if (status === 402) msg = "AI credits exhausted. Add funds in workspace settings.";
        if (status === 429) msg = "Rate limit hit — wait a moment and try again.";
        throw new Error(msg);
      }

      setProgress(100);
      toast.success(`✨ Created ${data?.cards_count ?? 0} cards from ${f.name}`);
      onUploaded?.();
      if (data?.deck_id) navigate(`/deck/${data.deck_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate cards";
      toast.error(msg);
    } finally {
      setStage(null);
      setProgress(0);
      setFile(null);
    }
  }, [navigate, onUploaded]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const busy = !!stage;

  return (
    <Card
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={cn(
        "relative overflow-hidden border-2 border-dashed transition-all p-8 text-center",
        drag ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40",
        busy && "pointer-events-none"
      )}
    >
      {busy ? (
        <div className="space-y-4 animate-fade-in">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-hero grid place-items-center">
            <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">{stage}</p>
            <p className="text-sm text-muted-foreground mt-1 truncate">{file?.name}</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-2">{progress}%</p>
          </div>
        </div>
      ) : (
        <label className="block cursor-pointer space-y-3">
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPick} />
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-soft grid place-items-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Drop a PDF to create a new deck</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll read it, generate flashcards, and start spaced repetition. Up to 10MB.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="pointer-events-none">
            <FileText className="h-4 w-4 mr-2" /> Choose PDF
          </Button>
        </label>
      )}
    </Card>
  );
}
