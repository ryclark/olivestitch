import { useMemo, useState } from "react";
import { Box, Button, Heading } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import Grid from "./Grid";
import Header from "./Header";
import Footer from "./Footer";
import type { PatternDetails } from "./types";

interface Path {
  color: string;
  cells: { y: number; x: number }[];
}

function findPaths(grid: (string | null)[][]): Path[] {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const paths: Path[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid[y][x];
      if (!color || visited[y][x]) continue;
      const stack: [number, number][] = [[y, x]];
      visited[y][x] = true;
      const cells: { y: number; x: number }[] = [];
      while (stack.length) {
        const [cy, cx] = stack.pop() as [number, number];
        cells.push({ y: cy, x: cx });
        for (const [dy, dx] of dirs) {
          const ny = cy + dy;
          const nx = cx + dx;
          if (
            ny >= 0 &&
            ny < rows &&
            nx >= 0 &&
            nx < cols &&
            !visited[ny][nx] &&
            grid[ny][nx] === color
          ) {
            visited[ny][nx] = true;
            stack.push([ny, nx]);
          }
        }
      }
      paths.push({ color: color as string, cells });
    }
  }
  paths.sort((a, b) => b.cells.length - a.cells.length);
  return paths;
}

function extractSubGrid(
  grid: (string | null)[][],
  center: { y: number; x: number },
  size: number,
): (string | null)[][] {
  const half = Math.floor(size / 2);
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const res: (string | null)[][] = [];
  for (let y = center.y - half; y <= center.y - half + size - 1; y++) {
    const row: (string | null)[] = [];
    for (let x = center.x - half; x <= center.x - half + size - 1; x++) {
      if (y >= 0 && y < rows && x >= 0 && x < cols) row.push(grid[y][x]);
      else row.push(null);
    }
    res.push(row);
  }
  return res;
}

interface LocationState {
  pattern?: PatternDetails;
}

export default function Pathfinder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pattern } = (location.state as LocationState) || {};

  const paths = useMemo(
    () => (pattern ? findPaths(pattern.grid) : []),
    [pattern],
  );
  const [pathIdx, setPathIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const current = paths[pathIdx];
  const step = current?.cells[stepIdx];
  const last = current ? current.cells.length - 1 : 0;

  const handleNext = () => {
    if (!current) return;
    if (dir === 1) {
      if (stepIdx < last) setStepIdx(stepIdx + 1);
      else setDir(-1);
    } else {
      if (stepIdx > 0) setStepIdx(stepIdx - 1);
      else {
        setDir(1);
        setStepIdx(0);
        setPathIdx((pathIdx + 1) % paths.length);
      }
    }
  };

  if (!pattern) return <Box p={4}>No pattern selected.</Box>;
  if (!current || !step) return <Box p={4}>No path found.</Box>;

  const activeCells = new Set(current.cells.map((c) => `${c.y}-${c.x}`));
  const size = pattern.fabricCount;
  const subGrid = extractSubGrid(pattern.grid, step, size);
  const half = Math.floor(size / 2);
  const subActive = { y: half, x: half };

  return (
    <Box minH="100vh" minW="100vw" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" p={4} textAlign="center">
        <Heading size="md" mb={4}>
          Pathfinder
        </Heading>
        <Grid
          grid={pattern.grid}
          showGrid={true}
          activeColor={current.color}
          activeCell={step}
          activeCells={activeCells}
          maxGridPx={500}
        />
        <Box mt={4} mx="auto" width="fit-content">
          <Grid
            grid={subGrid as string[][]}
            showGrid={true}
            activeColor={current.color}
            activeCell={subActive}
            activeCells={new Set([`${subActive.y}-${subActive.x}`])}
            maxGridPx={200}
          />
        </Box>
        <Button mt={4} bg="green.900" color="yellow.100" onClick={handleNext}>
          Next
        </Button>{" "}
        <Button mt={4} ml={2} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
      <Footer />
    </Box>
  );
}
