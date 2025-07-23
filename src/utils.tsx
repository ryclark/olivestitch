import { DMC_COLORS } from './ColorPalette';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from '@aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import type { PatternDetails } from './types';

export const STITCH_SYMBOLS = [
  '●','○','■','□','▲','△','▼','▽','◆','◇',
  '★','☆','✚','✖','✱','✦','✧','✩','✪','✫',
  '✬','✭','✮','✯','☐','☑','☒','♠','♣','♥',
  '♦','♢','♤','♧','⌂','♪','♫','♭','♮','♯',
  '∆','π','Ω','Ψ','Φ','Λ','Θ','Σ','Γ','μ',
  'λ','ζ','∞','⊥','⊙','⊗','⊕','⊖','⊞','⊟',
  '◉','◌','◎','◍','◐','◑','◒','◓','◔','◕',
  '◖','◗','◘','◙','◢','◣','◤','◥','◦','◯',
  '◻','◼','◽','◾','▣','▤','▥','▦','▧','▨',
  '▩','▢','◊'
];

export function hexToDmcCode(hex: string): string | null {
  const found = DMC_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return found ? found.code : null;
}

export function generateSymbolMap(colors: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  colors.forEach((hex, idx) => {
    const code = hexToDmcCode(hex) || hex;
    const base = STITCH_SYMBOLS[idx];
    let symbol = base;
    if (!symbol) {
      const fallback = idx - STITCH_SYMBOLS.length;
      symbol = String.fromCharCode(65 + (fallback % 26));
    }
    map[code] = symbol;
  });
  return map;
}

const client = generateClient<Schema>();

// Convert hex to RGB array
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255
  ];
}

// Euclidean distance in RGB space
function colorDist(a: number[], b: number[]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}

// Count how many times each color is used
export function getColorUsage(grid: (string | null)[][]): Record<string, number> {
  const counts: Record<string, number> = {};
  grid.forEach(row =>
    row.forEach(hex => {
      if (!hex) return;
      counts[hex] = (counts[hex] || 0) + 1;
    })
  );
  return counts;
}

// Reduce the number of colors used in the grid to the desired count
export function reduceColors(grid: string[][], targetCount: number): string[][] {
  if (targetCount <= 0) return grid;
  const counts = getColorUsage(grid);
  const topColors = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, targetCount)
    .map(([hex]) => hex);
  if (topColors.length === 0) return grid;
  return grid.map(row =>
    row.map(hex => {
      if (!hex) return hex;
      if (topColors.includes(hex)) return hex;
      const rgb = hexToRgb(hex);
      let best = topColors[0];
      let min = Infinity;
      topColors.forEach(tc => {
        const d = colorDist(rgb, hexToRgb(tc));
        if (d < min) {
          min = d;
          best = tc;
        }
      });
      return best;
    })
  );
}

// Find the closest DMC color (by RGB distance)
export function findClosestDmcColor(
  rgb: number[],
  palette: typeof DMC_COLORS = DMC_COLORS
): string {
  let minDist = Infinity;
  let closest = palette[0];
  palette.forEach(c => {
    const dmcRgb = hexToRgb(c.hex);
    const dist = colorDist(rgb, dmcRgb);
    if (dist < minDist) {
      minDist = dist;
      closest = c;
    }
  });
  return closest.hex;
}

// Export the grid as PNG (with optional grid overlay)
export function exportGridAsPng(grid: string[][], cellSize: number, showGrid: boolean): string {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw cells
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = grid[y][x] || '#fff';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Optional grid overlay
  if (showGrid) {
    ctx.strokeStyle = '#888';
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, rows * cellSize);
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellSize);
      ctx.lineTo(cols * cellSize, j * cellSize);
      ctx.stroke();
    }
  }

  return canvas.toDataURL('image/png');
}

// Lighten or darken a hex color by a percentage (-1 to 1)
export function shadeColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  const R = Math.round((t - r) * p) + r;
  const G = Math.round((t - g) * p) + g;
  const B = Math.round((t - b) * p) + b;
  return (
    '#' +
    [R, G, B]
      .map(v => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

// Choose a contrasting shade for overlaying text on a cell color
export function overlayShade(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 255000;
  // If the color is bright, darken the shade, else lighten it
  return shadeColor(hex, brightness > 0.6 ? -0.4 : 0.4);
}

/**
 * Apply a simple smoothing pass over the grid to reduce isolated stitches.
 * A lower level results in more blending of neighboring colors.
 * @param grid The original color grid
 * @param level Confetti level from 1 (heavily blended) to 10 (no blending)
 */
export function applyConfettiLevel(grid: string[][], level: number): string[][] {
  const passes = Math.max(0, 10 - level);
  if (passes === 0) return grid;
  let result = grid.map(r => r.slice());
  const h = result.length;
  const w = result[0]?.length || 0;

  for (let p = 0; p < passes; p++) {
    const copy = result.map(r => r.slice());
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const counts: Record<string, number> = {};
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue;
            const c = result[ny][nx];
            counts[c] = (counts[c] || 0) + 1;
          }
        }
        let best = result[y][x];
        let bestCount = counts[best];
        for (const c in counts) {
          if (counts[c] > bestCount) {
            best = c;
            bestCount = counts[c];
          }
        }
        if (best !== result[y][x] && bestCount >= 5) {
          copy[y][x] = best;
        }
      }
    }
    result = copy;
  }

  return result;
}

/**
 * Calculate a normalized Confetti Level Score (1-100) for a grid.
 * @param grid Grid of stitch colors/symbols
 */
export function calculateConfettiScore(grid: string[][]): number {
  const blockSize = 10;
  const minCLS = 2;
  const maxCLS = 22;
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  if (rows === 0 || cols === 0) return 1;

  const rawScores: number[] = [];
  for (let y = 0; y < rows; y += blockSize) {
    for (let x = 0; x < cols; x += blockSize) {
      const counts: Record<string, number> = {};
      const uniques = new Set<string>();
      for (let j = 0; j < blockSize; j++) {
        for (let i = 0; i < blockSize; i++) {
          const ny = y + j;
          const nx = x + i;
          if (ny >= rows || nx >= cols) continue;
          const c = grid[ny][nx];
          uniques.add(c);
          counts[c] = (counts[c] || 0) + 1;
        }
      }
      const confettiStitches = Object.values(counts).filter(v => v === 1).length;
      const raw = (uniques.size + confettiStitches) / 2;
      rawScores.push(raw);
    }
  }

  const avgRaw = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
  const normalized =
    1 + (99 * (avgRaw - minCLS)) / (maxCLS - minCLS);
  return Math.round(normalized * 10) / 10;
}

// Generate a small data URL thumbnail from a File or data URL string
export async function createThumbnail(
  image: string | File,
  maxDim = 400
): Promise<string> {
  const srcPromise =
    typeof image === 'string'
      ? Promise.resolve(image)
      : new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => {
            const result = e.target?.result;
            if (typeof result === 'string') resolve(result);
            else reject(new Error('Unable to read image'));
          };
          reader.onerror = () => reject(new Error('Unable to read image'));
          reader.readAsDataURL(image);
        });

  const src = await srcPromise;
  return new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Unable to create thumbnail'));
    img.src = src;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function saveProject(
  image: string | File,
  pattern: PatternDetails
) {
  const thumb = await createThumbnail(image);
  const gridPng = exportGridAsPng(pattern.grid, 10, false);
  const gridThumb = await createThumbnail(gridPng);
  const blob = dataUrlToBlob(thumb);
  const gridBlob = dataUrlToBlob(gridThumb);

  const [imageUpload, gridUpload] = await Promise.all([
    uploadData({
      path: ({ identityId }) =>
        `customer-images/${identityId}/${crypto.randomUUID()}.jpg`,
      data: blob,
      options: { contentType: 'image/jpeg' },
    }),
    uploadData({
      path: ({ identityId }) =>
        `customer-images/${identityId}/${crypto.randomUUID()}.jpg`,
      data: gridBlob,
      options: { contentType: 'image/jpeg' },
    }),
  ]);

  const imageResult = await imageUpload.result;
  const gridResult = await gridUpload.result;

  const { data } = await client.models.Project.create({
    image: imageResult.path,
    gridImage: gridResult.path,
    pattern: JSON.stringify(pattern),
    progress: [],
  });
  return data;
}
