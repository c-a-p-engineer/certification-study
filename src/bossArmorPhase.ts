/** Presentation-only boss armor phase. No grading, rewards, storage or timers. */
export type BossArmorPhase = 'sealed' | 'strained' | 'exposed' | 'broken';

export function bossArmorPhase(remaining: number, target: number): BossArmorPhase {
  if (!Number.isFinite(remaining) || !Number.isFinite(target) || target <= 0 || remaining < 0) return 'sealed';
  if (remaining === 0) return 'broken';
  const ratio = Math.min(1, remaining / target);
  if (ratio <= 2 / 7) return 'exposed';
  if (ratio <= 4 / 7) return 'strained';
  return 'sealed';
}
