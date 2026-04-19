/** Subtle drifting flashcard shapes for the landing hero. Pointer-events-none so it never blocks UI. */
export function FloatingCardsBg() {
  const cards = [
    { left: "8%",  top: "12%", size: 70, delay: 0,  rot: -12, hue: "var(--primary)"  },
    { left: "85%", top: "18%", size: 60, delay: 4,  rot: 14,  hue: "var(--info)"     },
    { left: "15%", top: "70%", size: 90, delay: 2,  rot: 8,   hue: "var(--warning)"  },
    { left: "78%", top: "65%", size: 80, delay: 6,  rot: -10, hue: "var(--success)"  },
    { left: "45%", top: "85%", size: 55, delay: 3,  rot: 18,  hue: "var(--primary)"  },
    { left: "55%", top: "8%",  size: 50, delay: 5,  rot: -8,  hue: "var(--info)"     },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {cards.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm animate-drift"
          style={{
            left: c.left,
            top: c.top,
            width: c.size,
            height: c.size * 1.3,
            transform: `rotate(${c.rot}deg)`,
            animationDelay: `${c.delay}s`,
            boxShadow: `0 8px 24px -10px hsl(${c.hue} / 0.25)`,
          }}
        >
          <div className="h-1 w-full rounded-t-2xl" style={{ background: `hsl(${c.hue})` }} />
        </div>
      ))}
    </div>
  );
}
