export type Coord = [number, number];

function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function key(c: Coord): string {
  return `${c[0]},${c[1]}`;
}

function parseKey(k: string): Coord {
  const [y, x] = k.split(',').map(n => parseInt(n, 10));
  return [y, x];
}

function bfsCluster(remaining: Set<string>, start: Coord, maxJump: number, maxStitches: number): Coord[] {
  const queue: Coord[] = [start];
  const visited = new Set<string>([key(start)]);
  const path: Coord[] = [start];

  while (queue.length && path.length < maxStitches) {
    const current = queue.shift()!;
    for (const cellKey of Array.from(remaining)) {
      if (!visited.has(cellKey)) {
        const cell = parseKey(cellKey);
        if (manhattan(current, cell) <= maxJump) {
          visited.add(cellKey);
          queue.push(cell);
          path.push(cell);
          if (path.length >= maxStitches) break;
        }
      }
    }
  }
  return path;
}

function segmentColorGroup(cells: Coord[], maxStitches: number, maxJump: number): Coord[][] {
  const segments: Coord[][] = [];
  const remaining = new Set<string>(cells.map(key));

  while (remaining.size) {
    const firstKey = remaining.values().next().value as string;
    const start = parseKey(firstKey);
    const seg = bfsCluster(remaining, start, maxJump, maxStitches);
    seg.forEach(c => remaining.delete(key(c)));
    segments.push(seg);
  }

  return segments;
}

function planStitchingSegments(grid: string[][], maxStitches = 150, maxJump = 5) {
  const colorGroups: Record<string, Coord[]> = {};
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[0]?.length || 0); c++) {
      const color = grid[r][c];
      if (!colorGroups[color]) colorGroups[color] = [];
      colorGroups[color].push([r, c]);
    }
  }

  const allSegments: { color: string; path: Coord[] }[] = [];
  for (const color of Object.keys(colorGroups)) {
    const segs = segmentColorGroup(colorGroups[color], maxStitches, maxJump);
    segs.forEach(s => allSegments.push({ color, path: s }));
  }
  return allSegments;
}

export const handler = async (event: unknown) => {
  try {
    const e = event as { body?: string } & Record<string, unknown>;
    const body = e.body ? JSON.parse(e.body) : (e as Record<string, unknown>);
    const grid = body.grid as string[][];
    const maxStitches = body.max_stitches ?? 150;
    const maxJump = body.max_jump ?? 5;
    const result = planStitchingSegments(grid, maxStitches, maxJump);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
