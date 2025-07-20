import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Flex,
  Text,
  Switch,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import {
  FiArrowUp,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { useLocation, useNavigate } from "react-router-dom";
import Grid from "./Grid";
import type { PatternDetails } from "./types";
import { hexToDmcCode } from "./utils";

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
  const [showFullGrid, setShowFullGrid] = useState(true);

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

  const activeCells = new Set(
    current.cells.slice(0, stepIdx + 1).map((c) => `${c.y}-${c.x}`),
  );
  const size = pattern.fabricCount;
  const subGrid = extractSubGrid(pattern.grid, step, size);
  const half = Math.floor(size / 2);
  const subActive = { y: half, x: half };
  const subLabels: Record<string, string> = {};
  for (let i = 0; i <= stepIdx; i++) {
    const c = current.cells[i];
    const subY = c.y - (step.y - half);
    const subX = c.x - (step.x - half);
    if (subY >= 0 && subY < size && subX >= 0 && subX < size) {
      subLabels[`${subY}-${subX}`] = String(i + 1);
    }
  }
  const subActiveCells = new Set(Object.keys(subLabels));

  const nextIdx = Math.min(Math.max(stepIdx + dir, 0), last);
  const nextStep = current.cells[nextIdx];
  let Arrow: IconType | null = null;
  if (nextStep) {
    if (nextStep.y > step.y) Arrow = FiArrowDown;
    else if (nextStep.y < step.y) Arrow = FiArrowUp;
    else if (nextStep.x > step.x) Arrow = FiArrowRight;
    else if (nextStep.x < step.x) Arrow = FiArrowLeft;
  }
  const colorCode = hexToDmcCode(current.color);
  const displayGrid = (showFullGrid
    ? pattern.grid
    : pattern.grid.map((row, y) =>
        row.map((col, x) => (activeCells.has(`${y}-${x}`) ? col : null)),
      )) as unknown as string[][];

  return (
    <Box minH="100vh" minW="100vw" display="flex" flexDirection="column">
      <Box flex="1" p={4} textAlign="center">
        <Heading size="md" mb={4}>
          Pathfinder
        </Heading>
        <Flex justify="center" align="center" mb={2} gap={4}>
          <Flex align="center">
            <Box
              w="24px"
              h="24px"
              border="1px solid #ccc"
              bg={current.color}
              mr={2}
            />
            <Text>{colorCode ? `#${colorCode}` : current.color}</Text>
          </Flex>
          {Arrow && (
            <Box as={Arrow} aria-label="next direction" />
          )}
        </Flex>
        <FormControl
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb={2}
        >
          <FormLabel htmlFor="full-toggle" mb="0">
            Show full image
          </FormLabel>
          <Switch
            id="full-toggle"
            isChecked={showFullGrid}
            onChange={(e) => setShowFullGrid(e.target.checked)}
          />
        </FormControl>
        <Grid
          grid={displayGrid}
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
            activeCells={subActiveCells}
            labels={subLabels}
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
    </Box>
  );
}
