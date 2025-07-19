export type SkillLevel = 1 | 2 | 3 | 4 | 5;

/** Base stitch rates (stitches per hour) by skill level */
export const BASE_STITCH_RATES: Record<SkillLevel, number> = {
  1: 150,
  2: 180,
  3: 210,
  4: 240,
  5: 270
};

/**
 * Estimate the hours required to complete a pattern for a given skill level.
 * @param totalStitches Total number of stitches in the pattern
 * @param flossColors Number of floss colors used
 * @param confettiLevel Confetti level from 1 (low) to 10 (high)
 * @param skillLevel Stitcher skill level from 1 (beginner) to 5 (expert)
 * @returns Estimated hours rounded to one decimal place
 */
export function estimateTime(
  totalStitches: number,
  flossColors: number,
  confettiLevel: number,
  skillLevel: SkillLevel
): number {
  const baseRate = BASE_STITCH_RATES[skillLevel];
  const colorPenalty = flossColors > 1 ? 1 + (flossColors - 1) * 0.01 : 1;
  const confettiPenalty = confettiLevel > 1 ? 1 + (confettiLevel - 1) * 0.15 : 1;
  const adjustedRate = baseRate / (colorPenalty * confettiPenalty);
  const hours = totalStitches / adjustedRate;
  return Math.round(hours * 10) / 10;
}

/**
 * Get estimated hours for all skill levels (1-5).
 */
export function estimateTimeRange(
  totalStitches: number,
  flossColors: number,
  confettiLevel: number
): number[] {
  return [1, 2, 3, 4, 5].map(l =>
    estimateTime(totalStitches, flossColors, confettiLevel, l as SkillLevel)
  );
}
