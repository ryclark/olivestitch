export interface PatternDetails {
  grid: string[][];
  fabricCount: number;
  widthIn: number;
  heightIn: number;
  colors: string[];
  colorUsage: Record<string, number>;
}
