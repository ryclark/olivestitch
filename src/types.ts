export interface PatternDetails {
  grid: string[][];
  fabricCount: number;
  widthIn: number;
  heightIn: number;
  colors: string[];
  colorUsage: Record<string, number>;
  symbols: Record<string, string>;
  /** Confetti level from 1 (low) to 10 (high) */
  confettiLevel: number;
}
