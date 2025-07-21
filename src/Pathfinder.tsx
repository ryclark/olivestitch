import { Box, Button, NumberInput, NumberInputField, FormControl, FormLabel, VStack } from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Grid from './Grid';
import type { PatternDetails } from './types';

interface Segment { color: string; path: [number, number][]; }

export default function Pathfinder() {
  const location = useLocation();
  const { pattern } = (location.state as { pattern?: PatternDetails } | undefined) || {};
  const [maxStitches, setMaxStitches] = useState<number>(150);
  const [maxJump, setMaxJump] = useState<number>(5);
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [displayGrid, setDisplayGrid] = useState<string[][]>([]);

  const baseGrid = useMemo(() => pattern?.grid ?? [], [pattern]);

  useEffect(() => {
    if (!pattern) return;
    setDisplayGrid(baseGrid.map(row => row.map(() => '#ffffff')));
  }, [pattern, baseGrid]);

  const animateSegments = (segs: Segment[]) => {
    if (!pattern) return;
    const working = baseGrid.map(row => row.map(() => '#ffffff'));
    setDisplayGrid(working.map(r => [...r]));
    let segIdx = 0;
    let stitchIdx = 0;
    const step = () => {
      if (segIdx >= segs.length) return;
      const seg = segs[segIdx];
      if (stitchIdx < seg.path.length) {
        const [y, x] = seg.path[stitchIdx];
        working[y][x] = seg.color;
        setDisplayGrid(working.map(r => [...r]));
        stitchIdx++;
        setTimeout(step, 100);
      } else {
        segIdx++;
        stitchIdx = 0;
        setTimeout(step, 300);
      }
    };
    step();
  };

  const handleSubmit = async () => {
    if (!pattern) return;
    const res = await fetch('/path-finder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: pattern.grid, max_stitches: maxStitches, max_jump: maxJump })
    });
    const data = await res.json();
    setSegments(data);
    animateSegments(data);
  };

  if (!pattern) return <Box p={4}>No pattern data.</Box>;

  return (
    <Box p={4}>
      <VStack align="start" spacing={4} mb={4}>
        <FormControl>
          <FormLabel>Max Stitches</FormLabel>
          <NumberInput value={maxStitches} onChange={(v) => setMaxStitches(parseInt(v))} min={1}>
            <NumberInputField />
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel>Max Jump</FormLabel>
          <NumberInput value={maxJump} onChange={(v) => setMaxJump(parseInt(v))} min={1}>
            <NumberInputField />
          </NumberInput>
        </FormControl>
        <Button onClick={handleSubmit} bg="green.900" color="yellow.100">Submit</Button>
      </VStack>
      <Grid grid={displayGrid} showGrid maxGridPx={500} />
      {segments && (
        <Box mt={4} fontSize="sm">
          {segments.map((s, i) => (
            <Box key={i} mb={2}>
              <strong>Segment {i + 1} - {s.color}</strong>: {s.path.map(p => `(${p[0]},${p[1]})`).join(' -> ')}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
