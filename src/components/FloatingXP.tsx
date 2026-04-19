import { useEffect, useState } from "react";

type Bubble = { id: number; amount: number; x: number; y: number };

let counter = 0;
const listeners = new Set<(b: Bubble) => void>();

/** Call from anywhere to fire a floating "+N XP" near a screen point. */
export function spawnXP(amount: number, x: number, y: number) {
  const b: Bubble = { id: ++counter, amount, x, y };
  listeners.forEach((fn) => fn(b));
}

export function FloatingXPLayer() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const fn = (b: Bubble) => {
      setBubbles((cur) => [...cur, b]);
      setTimeout(() => setBubbles((cur) => cur.filter((x) => x.id !== b.id)), 1400);
    };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute font-display font-bold text-primary text-2xl drop-shadow-lg animate-xp-float"
          style={{ left: b.x, top: b.y, transform: "translate(-50%, -50%)" }}
        >
          +{b.amount} XP
        </div>
      ))}
    </div>
  );
}
