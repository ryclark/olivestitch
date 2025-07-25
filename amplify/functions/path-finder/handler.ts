import type { Schema } from "../../data/resource";
import { generateClient } from "@aws-amplify/backend";

type Coord = [number, number];

function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function bfsCluster(
  remaining: Set<string>,
  start: Coord,
  maxJump: number,
  maxStitches: number,
): Coord[] {
  const queue: Coord[] = [start];
  const segment: Coord[] = [start];
  remaining.delete(start.join(","));

  while (queue.length && segment.length < maxStitches) {
    const current = queue.shift()!;
    for (const cell of Array.from(remaining)) {
      const [r, c] = cell.split(",").map(Number) as Coord;
      if (manhattan(current, [r, c]) <= maxJump) {
        queue.push([r, c]);
        segment.push([r, c]);
        remaining.delete(cell);
        if (segment.length >= maxStitches) break;
      }
    }
  }
  return segment;
}

function segmentColorGroup(
  cells: Coord[],
  maxStitches: number,
  maxJump: number,
): Coord[][] {
  const remaining = new Set(cells.map(c => c.join(",")));
  const segments: Coord[][] = [];

  while (remaining.size) {
    const first = Array.from(remaining)[0];
    const start = first.split(",").map(Number) as Coord;
    const seg = bfsCluster(remaining, start, maxJump, maxStitches);
    segments.push(seg);
  }

  return segments;
}

function planSegments(
  grid: string[][],
  maxStitches: number,
  maxJump: number,
): { color: string; path: Coord[] }[] {
  const colorGroups = new Map<string, Coord[]>();
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const color = grid[r][c];
      if (!color) continue;
      if (!colorGroups.has(color)) colorGroups.set(color, []);
      colorGroups.get(color)!.push([r, c]);
    }
  }

  const allSegments: { color: string; path: Coord[] }[] = [];
  for (const [color, coords] of colorGroups.entries()) {
    const segs = segmentColorGroup(coords, maxStitches, maxJump);
    for (const seg of segs) {
      allSegments.push({ color, path: seg });
    }
  }
  return allSegments;
}

const client = generateClient<Schema>();

export const handler: Schema["pathFinder"]["functionHandler"] = async (event) => {
  const { grid, projectID, max_stitches = 150, max_jump = 5 } = event.arguments as {
    grid: string[][];
    projectID: string;
    max_stitches?: number;
    max_jump?: number;
  };

  if (!grid || !projectID) {
    return "Missing 'grid' or 'projectID' argument";
  }

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] == null) {
      return `Grid contains a null or undefined row at index ${i}`;
    }
  }

  const segments = planSegments(grid, max_stitches, max_jump);

  let segmentIndex = 0;
  for (const seg of segments) {
    segmentIndex += 1;
    const pathXs = seg.path.map(([r]) => r);
    const pathYs = seg.path.map(([_, c]) => c);
    await client.models.Path.create({
      projectID,
      segmentID: segmentIndex.toString(),
      color: seg.color,
      pathXs,
      pathYs,
    });
  }

  return `Saved ${segmentIndex} segments`;
};