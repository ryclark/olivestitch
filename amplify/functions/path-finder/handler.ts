import type { AppSyncResolverHandler } from "aws-lambda";

type Coord = [number, number];

type Input = {
  grid: string[][];
  max_stitches?: number;
  max_jump?: number;
};

type Segment = {
  color: string;
  path: Coord[];
};

export const handler: AppSyncResolverHandler<Input, Segment[]> = async (event) => {
  const { grid, max_stitches = 150, max_jump = 5 } = event.arguments;

  function manhattan(p1: Coord, p2: Coord): number {
    return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
  }

  function bfsCluster(
    colorCells: Set<string>,
    start: Coord,
    maxJump: number,
    maxStitches: number
  ): Coord[] {
    const queue: Coord[] = [start];
    const visited = new Set<string>([start.join(",")]);
    const path: Coord[] = [start];

    while (queue.length && path.length < maxStitches) {
      const current = queue.shift()!;
      for (const cellStr of colorCells) {
        if (visited.has(cellStr)) continue;
        const [r, c] = cellStr.split(",").map(Number);
        const neighbor: Coord = [r, c];
        if (manhattan(current, neighbor) <= maxJump) {
          visited.add(cellStr);
          queue.push(neighbor);
          path.push(neighbor);
          if (path.length >= maxStitches) break;
        }
      }
    }

    return path;
  }

  function segmentColorGroup(
    cells: Coord[],
    maxStitches: number,
    maxJump: number
  ): Coord[][] {
    const segments: Coord[][] = [];
    const remaining = new Set(cells.map((c) => c.join(",")));

    while (remaining.size > 0) {
      const startStr = remaining.values().next().value;
      if (!startStr) break; // Fix TS18048
      const [r, c] = startStr.split(",").map(Number);
      const start: Coord = [r, c];

      const segment = bfsCluster(remaining, start, maxJump, maxStitches);
      segments.push(segment);
      for (const coord of segment) {
        remaining.delete(coord.join(","));
      }
    }

    return segments;
  }

  function planStitchingSegments(
    grid: string[][],
    maxStitches = 150,
    maxJump = 5
  ): Segment[] {
    const colorGroups: Record<string, Coord[]> = {};

    grid.forEach((row, r) => {
      row.forEach((color, c) => {
        if (!colorGroups[color]) colorGroups[color] = [];
        colorGroups[color].push([r, c]);
      });
    });

    const allSegments: Segment[] = [];

    for (const color in colorGroups) {
      const segments = segmentColorGroup(colorGroups[color], maxStitches, maxJump);
      for (const segment of segments) {
        allSegments.push({ color, path: segment });
      }
    }

    return allSegments;
  }

  return planStitchingSegments(grid, max_stitches, max_jump);
};
