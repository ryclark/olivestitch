import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from "../../data/resource";

Amplify.configure(outputs);


type Coord = [number, number];

function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function isInBounds(grid: string[][], r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < grid.length && c < grid[0].length;
}

function floodFillCluster(
  grid: string[][],
  visited: boolean[][],
  start: Coord,
  color: string,
  maxJump: number
): Coord[] {
  const queue: Coord[] = [start];
  const cluster: Coord[] = [start];
  visited[start[0]][start[1]] = true;

  while (queue.length) {
    const [r, c] = queue.shift()!;
    for (let dr = -maxJump; dr <= maxJump; dr++) {
      for (let dc = -maxJump; dc <= maxJump; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (!isInBounds(grid, nr, nc)) continue;
        if (visited[nr][nc]) continue;
        if (grid[nr][nc] !== color) continue;
        if (manhattan([r, c], [nr, nc]) > maxJump) continue;

        visited[nr][nc] = true;
        queue.push([nr, nc]);
        cluster.push([nr, nc]);
      }
    }
  }

  return cluster;
}

function chunkCluster(cluster: Coord[], maxStitches: number): Coord[][] {
  const chunks: Coord[][] = [];
  for (let i = 0; i < cluster.length; i += maxStitches) {
    chunks.push(cluster.slice(i, i + maxStitches));
  }
  return chunks;
}

function planSegments(
  grid: string[][],
  maxStitches: number,
  maxJump: number
): { color: string; path: Coord[] }[] {
  const segments: { color: string; path: Coord[] }[] = [];
  const visited: boolean[][] = grid.map(row => row.map(() => false));

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (visited[r][c]) continue;

      const color = grid[r][c];
      const cluster = floodFillCluster(grid, visited, [r, c], color, maxJump);
      const chunks = chunkCluster(cluster, maxStitches);

      for (const chunk of chunks) {
        segments.push({ color, path: chunk });
      }
    }
  }

  return segments;
}

const client = generateClient<Schema>();

export const handler: Schema["pathFinder"]["functionHandler"] = async (event) => {
  const {
    grid,
    projectID,
    max_stitches = 150,
    max_jump = 5
  } = event.arguments as {
    grid?: string[] | null; // string[] where each string is like "[#FF0000, #00FF00]"
    projectID?: string; //| null;
    max_stitches?: number;
    max_jump?: number;
  };

  if (!grid || !projectID) {
    return "Missing 'grid' or 'projectID' argument";
  }

  // ✅ Manually parse pseudo-JSON color rows like "[#FF0000, #00FF00]"
  let parsedGrid: string[][];
  try {
    parsedGrid = grid.map((rowStr, i) => {
      if (typeof rowStr !== "string") {
        throw new Error(`Row ${i} is not a string`);
      }

      const cleaned = rowStr
        .trim()
        .replace(/^\[/, "")   // remove starting bracket
        .replace(/\]$/, "")   // remove ending bracket
        .split(",")
        .map((cell, j) => {
          const color = cell.trim();
          if (!color) throw new Error(`Empty cell at [${i},${j}]`);
          return color;
        });

      return cleaned;
    });
  } catch (err: any) {
    return `Failed to parse grid: ${err.message}`;
  }

  // ✅ Run segmentation
  let segments: { color: string; path: Coord[] }[];
  try {
    segments = planSegments(parsedGrid, max_stitches, max_jump);
  } catch (e: any) {
    return `Error in planSegments: ${e?.message ?? e}`;
  }

const output = segments.map((seg, i) => {
  const pathStr = seg.path.map(([r, c]) => `(${r},${c})`).join(" → ");
  return `Segment ${i + 1}:\nColor: ${seg.color}\nPath: ${pathStr}`;
}).join("\n\n");

return output;

/*

try {
  const firstSegment = segments[0];

  if (!firstSegment || !Array.isArray(firstSegment.path)) {
    return "No segment to save or path is invalid";
  }

  const pathXs = firstSegment.path.map(([r]) => r);
  const pathYs = firstSegment.path.map(([_, c]) => c);

  await client.models.Path.create({
    projectID,
    segmentID: "1",
    color: firstSegment.color,
    pathXs,
    pathYs,
  });

  return "Saved first segment.";
} catch (err) {
  const errorMessage =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : JSON.stringify(err);
  return `Error saving first segment: ${errorMessage}`;
}



try {
  const results = await Promise.allSettled(
    segments.map(async (seg, i) => {
      try {
        if (!Array.isArray(seg.path)) {
          throw new Error(`Invalid path for segment ${i + 1}: path is not an array`);
        }

        const pathXs = seg.path.map(([r]) => r);
        const pathYs = seg.path.map(([_, c]) => c);

        return await client.models.Path.create({
          projectID,
          segmentID: (i + 1).toString(),
          color: seg.color,
          pathXs,
          pathYs,
        });
      } catch (e) {
        const errorMessage =
          e instanceof Error
            ? e.message
            : typeof e === "string"
            ? e
            : JSON.stringify(e);
        // Rethrow to be caught in allSettled's rejection handler
        throw new Error(`Segment ${i + 1} error: ${errorMessage}`);
      }
    })
  );

  const successes = results.filter(r => r.status === "fulfilled").length;
  const failures = results
    .map((r, i) =>
      r.status === "rejected"
        ? (r.reason instanceof Error
            ? r.reason.message
            : typeof r.reason === "string"
            ? r.reason
            : `Segment ${i + 1} failed: ${JSON.stringify(r.reason)}`)
        : null
    )
    .filter(Boolean);

  if (failures.length > 0) {
    return `Saved ${successes} segments. ${failures.length} failed:\n` + failures.join("\n");
  }

  return `Saved ${segments.length} segments.`;
} catch (err) {
  const errorMessage =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : JSON.stringify(err);
  return `Unexpected top-level failure: ${errorMessage}`;
}
*/
}
