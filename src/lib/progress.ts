// Overall progress weighting per mastery state.
// new = 0%, learning = 40%, review = 70%, mastered = 100%
export const PROGRESS_WEIGHTS = {
  new: 0,
  learning: 40,
  review: 70,
  mastered: 100,
} as const;

export function computeProgress(counts: {
  new_count?: number;
  learning_count?: number;
  review_count?: number;
  mastered_count?: number;
  total_cards: number;
}): number {
  const total = counts.total_cards;
  if (!total || total <= 0) return 0;
  const sum =
    (counts.new_count ?? 0) * PROGRESS_WEIGHTS.new +
    (counts.learning_count ?? 0) * PROGRESS_WEIGHTS.learning +
    (counts.review_count ?? 0) * PROGRESS_WEIGHTS.review +
    (counts.mastered_count ?? 0) * PROGRESS_WEIGHTS.mastered;
  return Math.round(sum / total);
}
