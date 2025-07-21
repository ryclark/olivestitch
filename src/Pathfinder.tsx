import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Box, Button, Flex, Input, VStack, Text } from '@chakra-ui/react';
import Grid from './Grid';
import type { PatternDetails } from './types';
import outputs from '../amplify_outputs.json';

interface Segment {
  color: string;
  path: [number, number][];
}

interface LocationState { pattern?: PatternDetails }

export default function Pathfinder() {
  const location = useLocation();
  const { pattern } = (location.state as LocationState) || {};
  const [maxStitches, setMaxStitches] = useState(150);
  const [maxJump, setMaxJump] = useState(5);
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [segIdx, setSegIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  const handleSubmit = async () => {
    if (!pattern) return;
    const url = (outputs as any).pathPlanner?.functionUrl;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: pattern.grid, max_stitches: maxStitches, max_jump: maxJump }),
    });
    const data = await res.json();
    setSegments(data);
    setSegIdx(0);
    setStepIdx(0);
  };

  useEffect(() => {
    if (!segments) return;
    const timer = setTimeout(() => {
      const current = segments[segIdx];
      if (!current) return;
      if (stepIdx < current.path.length - 1) {
        setStepIdx(stepIdx + 1);
      } else if (segIdx < segments.length - 1) {
        setSegIdx(segIdx + 1);
        setStepIdx(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [segments, segIdx, stepIdx]);

  const stitched = new Set<string>();
  if (segments) {
    for (let i = 0; i < segIdx; i++) {
      for (const [y, x] of segments[i].path) stitched.add(`${y}-${x}`);
    }
    const seg = segments[segIdx];
    if (seg) {
      for (let i = 0; i <= stepIdx; i++) {
        const [y, x] = seg.path[i];
        stitched.add(`${y}-${x}`);
      }
    }
  }
  const displayGrid = pattern
    ? pattern.grid.map((row, y) =>
        row.map((color, x) => (stitched.has(`${y}-${x}`) ? color : null)),
      )
    : [];

  return (
    <Box p={4} textAlign="center">
      {!pattern && <Box>No pattern selected.</Box>}
      {pattern && (
        <VStack spacing={4} align="stretch">
          <Flex gap={2} justify="center">
            <Input
              type="number"
              value={maxStitches}
              onChange={(e) => setMaxStitches(Number(e.target.value))}
              placeholder="Max stitches"
            />
            <Input
              type="number"
              value={maxJump}
              onChange={(e) => setMaxJump(Number(e.target.value))}
              placeholder="Max jump"
            />
            <Button onClick={handleSubmit}>Submit</Button>
          </Flex>
          {segments && (
            <Box textAlign="left">
              {segments.map((s, i) => (
                <Box key={i} mb={2}>
                  <Text fontWeight="bold">Segment {i + 1} - {s.color}</Text>
                  <Text fontFamily="monospace" whiteSpace="pre-wrap" fontSize="sm">
                    {JSON.stringify(s.path)}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
          <Grid grid={displayGrid as string[][]} showGrid={true} maxGridPx={500} />
        </VStack>
      )}
    </Box>
  );
}
