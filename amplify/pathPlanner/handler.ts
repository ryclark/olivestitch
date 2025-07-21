export interface Segment {
  color: string;
  path: [number, number][];
}

function manhattan(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function bfsCluster(
  remaining: Set<string>,
  start: [number, number],
  maxJump: number,
  maxStitches: number,
): [number, number][] {
  const queue: [number, number][] = [start];
  const visited = new Set<string>([`${start[0]},${start[1]}`]);
  const path: [number, number][] = [start];

  while (queue.length && path.length < maxStitches) {
    const [cy, cx] = queue.shift()!;
    for (const cell of Array.from(remaining)) {
      if (visited.has(cell)) continue;
      const [y, x] = cell.split(',').map(Number) as [number, number];
      if (manhattan([cy, cx], [y, x]) <= maxJump) {
        visited.add(cell);
        queue.push([y, x]);
        path.push([y, x]);
        if (path.length >= maxStitches) break;
      }
    }
  }

  return path;
}

function segmentColorGroup(
  cells: [number, number][],
  maxStitches: number,
  maxJump: number,
): [number, number][][] {
  const segments: [number, number][][] = [];
  const remaining = new Set(cells.map((c) => `${c[0]},${c[1]}`));

  while (remaining.size) {
    const first = remaining.values().next().value as string;
    const start: [number, number] = first.split(',').map(Number) as [number, number];
    const segment = bfsCluster(remaining, start, maxJump, maxStitches);
    segments.push(segment);
    for (const [y, x] of segment) {
      remaining.delete(`${y},${x}`);
    }
  }

  return segments;
}

export function planStitchingSegments(
  grid: string[][],
  maxStitches = 150,
  maxJump = 5,
): Segment[] {
  const colorGroups: Record<string, [number, number][]> = {};
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const color = grid[r][c];
      if (color === null || color === undefined) continue;
      if (!colorGroups[color]) colorGroups[color] = [];
      colorGroups[color].push([r, c]);
    }
  }

  const allSegments: Segment[] = [];
  for (const color of Object.keys(colorGroups)) {
    const coords = colorGroups[color];
    const colorSegments = segmentColorGroup(coords, maxStitches, maxJump);
    for (const seg of colorSegments) {
      allSegments.push({ color, path: seg });
    }
  }

  return allSegments;
}

export const handler = async (event: { body?: string }) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;
    const grid = body.grid as string[][];
    const maxStitches = body.max_stitches ?? body.maxStitches ?? 150;
    const maxJump = body.max_jump ?? body.maxJump ?? 5;
    const result = planStitchingSegments(grid, maxStitches, maxJump);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};
