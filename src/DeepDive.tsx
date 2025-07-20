import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid as ChakraGrid,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Heading,
} from '@chakra-ui/react';
import UsedColors from './UsedColors';
import { getColorUsage } from './utils';
import { DMC_COLORS } from './ColorPalette';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import StitchGrid from './Grid';
import type { PatternDetails } from './types';

const client = generateClient<Schema>();

export default function DeepDive() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pattern, progress, id } =
    (location.state as { pattern?: PatternDetails; progress?: string[]; id?: string } | undefined) || {};

  const [hover, setHover] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selected, setSelected] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ y: number; x: number } | null>(null);
  const [focusedColor, setFocusedColor] = useState<string | null>(null);
  const [sectionComplete, setSectionComplete] = useState<boolean>(false);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set(progress || [])
  );
  const [showSymbols, setShowSymbols] = useState<boolean>(false);

  const grid = useMemo(() => pattern?.grid ?? [], [pattern]);
  const fabricCount = pattern?.fabricCount ?? 14;
  const maxGridPx = 500;
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const BORDER = 4;
  const cellSize = Math.floor((maxGridPx - BORDER) / Math.max(rows, cols));
  const gridWidth = cellSize * cols + BORDER;
  const gridHeight = cellSize * rows + BORDER;
  const inchPx = cellSize * fabricCount;
  const inchCols = Math.ceil(cols / fabricCount);
  const inchRows = Math.ceil(rows / fabricCount);
  const subMaxPx = 300;
  const subCellSize = Math.floor((subMaxPx - BORDER) / fabricCount);
  const subGridWidth = subCellSize * fabricCount + BORDER;

  const overlays = [];
  for (let y = 0; y < inchRows; y++) {
    for (let x = 0; x < inchCols; x++) {
      const w = cellSize * Math.min(fabricCount, cols - x * fabricCount);
      const h = cellSize * Math.min(fabricCount, rows - y * fabricCount);
      const sectionKey = `${y}-${x}`;
      const done = completedSections.has(sectionKey);
      overlays.push(
        <Box
          key={sectionKey}
          position="absolute"
          left={x * inchPx}
          top={y * inchPx}
          width={w}
          height={h}
          cursor="pointer"
          onMouseEnter={() => !selected && setHover({ x, y, w, h })}
          onMouseLeave={() => !selected && setHover(null)}
          onClick={() => {
            setSelected({ x, y, w, h });
            setHover(null);
          }}
        >
          {done && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(255,255,255,0.7)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
              fontWeight="bold"
              color="teal"
              pointerEvents="none"
            >
              ✓
            </Box>
          )}
        </Box>
      );
    }
  }

  const getSectionKeys = useCallback((section: { x: number; y: number }) => {
    const keys: string[] = [];
    for (let dy = 0; dy < fabricCount; dy++) {
      for (let dx = 0; dx < fabricCount; dx++) {
        const yy = section.y * fabricCount + dy;
        const xx = section.x * fabricCount + dx;
        if (yy < rows && xx < cols) keys.push(`${yy}-${xx}`);
      }
    }
    return keys;
  }, [fabricCount, rows, cols]);

  const active = selected || hover;

  useEffect(() => {
    if (!pattern) return;
    setFocusedCell(null);
    setFocusedColor(null);
    if (selected) {
      const keys = getSectionKeys(selected);
      const sectionKey = `${selected.y}-${selected.x}`;
      const done =
        completedSections.has(sectionKey) ||
        keys.every(k => completedCells.has(k));
      setSectionComplete(done);
    } else {
      setSectionComplete(false);
    }
  }, [active, completedCells, completedSections, pattern, selected, getSectionKeys]);

  useEffect(() => {
    if (!id) return;
    client.models.Project.update({ id, progress: Array.from(completedSections) });
  }, [completedSections, id]);

  const subGrid = active
      ? grid
          .slice(active.y * fabricCount, active.y * fabricCount + fabricCount)
          .map((row: string[]) =>
            row.slice(active.x * fabricCount, active.x * fabricCount + fabricCount)
          )
      : null;

  const colorUsage = subGrid ? getColorUsage(subGrid) : {};
  const completedUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!pattern) return counts;
    completedCells.forEach(key => {
      const [y, x] = key.split('-').map(Number);
      const c = grid[y][x];
      if (!c) return;
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [completedCells, grid, pattern]);

  if (!pattern) {
    return <Box p={4}>No pattern available.</Box>;
  }

  return (
    <Box p={4}>
      <Button mb={4} onClick={() => navigate(-1)} bg="green.900" color="yellow.100">
        Back
      </Button>
      <FormControl display="flex" alignItems="center" mb={4} width="fit-content">
        <FormLabel htmlFor="symbol-toggle" mb="0">
          Symbols
        </FormLabel>
        <Switch
          id="symbol-toggle"
          isChecked={showSymbols}
          onChange={e => setShowSymbols(e.target.checked)}
        />
      </FormControl>
      <ChakraGrid
        gap={4}
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        templateAreas={{
          base: '"large" "section" "colors"',
          md: '"large section" "large colors"',
          lg: '"large section colors"',
        }}
        alignItems="flex-start"
      >
        <Box gridArea="large" w="100%">
          <Heading size="md" mb={2}>
            Pattern Map
          </Heading>
          <Box position="relative" height={gridHeight} flexShrink={0} overflow="hidden">
            <StitchGrid
              grid={grid}
              setGrid={() => {}}
              selectedColor={null}
              showGrid={true}
              maxGridPx={maxGridPx}
              completedCells={completedCells}
              symbolMap={pattern.symbols}
              showSymbols={false}
            />
            <Box position="absolute" top={0} left={0} right={0} bottom={0}>
              {overlays}
            </Box>
            {active && (
              <Box
                pointerEvents="none"
                position="absolute"
                left={active.x * inchPx}
                top={active.y * inchPx}
                width={active.w}
                height={active.h}
                boxShadow="0 0 0 9999px rgba(0,0,0,0.5)"
                border="2px solid teal"
              />
            )}
          </Box>
        </Box>
        {active && (
          <>
            <Box gridArea="section" w="100%">
              <Heading size="md" mb={2}>
                Section View
              </Heading>
              <StitchGrid
                grid={subGrid || []}
                setGrid={() => {}}
                selectedColor={null}
                showGrid={true}
                maxGridPx={subMaxPx}
                activeCell={focusedCell}
                activeColor={focusedColor}
                markComplete={sectionComplete}
                symbolMap={pattern.symbols}
                showSymbols={showSymbols}
                onCellClick={(_, __, color) => {
                  setFocusedCell(null);
                  setFocusedColor(prev => (prev === color ? prev : color));
                }}
              />
            </Box>
            <Box gridArea="colors" mt={2} w="100%">
              <Heading size="md" mb={2}>
                Details & Actions
              </Heading>
              <UsedColors
                colors={Object.keys(colorUsage)}
                usage={colorUsage}
                activeColor={focusedColor}
                symbols={pattern.symbols}
                showSymbols={showSymbols}
                onColorClick={color => {
                  setFocusedCell(null);
                  setFocusedColor(prev => (prev === color ? prev : color));
                }}
              />
              {selected && (
                <Button
                  mt={2}
                  bg="green.900"
                  color="yellow.100"
                  onClick={() => {
                    if (!selected) return;
                    const keys = getSectionKeys(selected);
                    const sectionKey = `${selected.y}-${selected.x}`;
                  setCompletedCells(prev => {
                    const next = new Set(prev);
                    if (sectionComplete) {
                      keys.forEach(k => next.delete(k));
                    } else {
                      keys.forEach(k => next.add(k));
                    }
                    return next;
                  });
                  setCompletedSections(prev => {
                    const next = new Set(prev);
                    if (sectionComplete) next.delete(sectionKey);
                    else next.add(sectionKey);
                    return next;
                  });
                  setSectionComplete(prev => !prev);
                  }}
                >
                  {sectionComplete ? 'Revisit Section' : 'Section Complete'}
                </Button>
              )}
              {focusedColor && (
                <Box mt={3} textAlign="center">
                  {(() => {
                    const dmc = DMC_COLORS.find(
                      c => c.hex.toLowerCase() === focusedColor.toLowerCase()
                    );
                    const name = dmc
                      ? `${dmc.name} (#${dmc.code})`
                      : focusedColor;
                    const sectionCount = colorUsage[focusedColor] || 0;
                    const remaining =
                      (pattern.colorUsage[focusedColor] || 0) -
                      (completedUsage[focusedColor] || 0);
                    const skeins = (remaining / 1800).toFixed(2);
                    return (
                      <>
                        <Box fontWeight="bold">{name}</Box>
                        <Box fontSize="sm">
                          {sectionCount} stitches in this section
                          <br />
                          {remaining} stitches remaining overall
                          <br />
                          {skeins} skeins needed
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              )}
            </Box>
          </>
        )}
      </ChakraGrid>
    </Box>
  );
}
