// XP -> level mapping
export const LEVELS = [
  { name: "Beginner", min: 0 },
  { name: "Student", min: 100 },
  { name: "Scholar", min: 300 },
  { name: "Expert", min: 700 },
  { name: "Master", min: 1500 },
];

export function levelForXp(xp: number) {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = LEVELS[1] ?? null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const progress = next
    ? Math.min(1, (xp - current.min) / (next.min - current.min))
    : 1;
  return { current, next, progress };
}
