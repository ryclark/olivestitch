import { Box } from '@chakra-ui/react';
import { DMC_COLORS } from './ColorPalette';
import { overlayShade } from './utils';

function hexToDmc(hex: string | null) {
  if (!hex) return null;
  const found = DMC_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return found ? `${found.name} (#${found.code})` : null;
}

export interface GridProps {
  grid: string[][];
  setGrid?: React.Dispatch<React.SetStateAction<string[][]>>;
  selectedColor?: string | null;
  showGrid: boolean;
  maxGridPx?: number;
  activeCell?: { y: number; x: number } | null;
  activeColor?: string | null;
  onCellClick?: (y: number, x: number, color: string | null) => void;
  markComplete?: boolean;
  completedCells?: Set<string> | null;
  symbolMap?: Record<string, string> | null;
  showSymbols?: boolean;
}

export default function Grid({
  grid,
  setGrid,
  selectedColor,
  showGrid,
  maxGridPx = 400,
    activeCell = null,
    activeColor = null,
    onCellClick,
  markComplete = false,
  completedCells = null,
  symbolMap = null,
  showSymbols = false
}: GridProps) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const BORDER = 4; // total px for the 2px border around the grid
  const cellSize = Math.floor((maxGridPx - BORDER) / Math.max(rows, cols));

  const handleCellClick = (y: number, x: number) => {
    if (onCellClick) onCellClick(y, x, grid[y][x]);
    if (setGrid && selectedColor !== undefined && selectedColor !== null) {
      setGrid(prev =>
        prev.map((row, rowIdx) =>
          rowIdx === y
            ? row.map((cell, colIdx) => (colIdx === x ? selectedColor : cell))
            : row
        )
      );
    }
  };

  return (
    <Box
      display="grid"
      gridTemplateRows={`repeat(${rows}, ${cellSize}px)`}
      gridTemplateColumns={`repeat(${cols}, ${cellSize}px)`}
      border="2px solid #444"
      boxSizing="border-box"
      w={cellSize * cols + BORDER}
      h={cellSize * rows + BORDER}
      overflow="hidden"
      m="auto"
    >
      {grid.map((row, y) =>
        row.map((color, x) => {
          const dmcLabel = hexToDmc(color) || `(${x + 1}, ${y + 1})`;
          const code = DMC_COLORS.find(c => c.hex.toLowerCase() === (color || '').toLowerCase())?.code;
          const symbol = showSymbols && code && symbolMap ? symbolMap[code] : '';
          const colorFiltered =
            activeColor &&
            (color || '').toLowerCase() !== activeColor.toLowerCase();
          const dimmed =
            activeCell && !(activeCell.y === y && activeCell.x === x);
          const displayColor = colorFiltered ? null : color;
          const cellKey = `${y}-${x}`;
          const isComplete =
            markComplete || (completedCells && completedCells.has(cellKey));
          return (
            <Box
              key={`${y}-${x}`}
              onClick={() => handleCellClick(y, x)}
              w={cellSize}
              h={cellSize}
              bg={showSymbols ? '#fff' : displayColor || '#fff'}
              border={showGrid ? '1px solid #ccc' : 'none'}
              boxSizing="border-box"
              cursor="pointer"
              opacity={dimmed ? 0.3 : 1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color={
                isComplete
                  ? overlayShade(displayColor || '#fff')
                  : showSymbols
                    ? '#000'
                    : 'inherit'
              }
              fontWeight={isComplete || showSymbols ? 'bold' : 'normal'}
              title={dmcLabel}
            >
              {isComplete ? 'X' : symbol}
            </Box>
          );
        })
      )}
    </Box>
  );
}
