import { DMC_COLORS } from './ColorPalette';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from '@aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import type { PatternDetails } from './types';

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
export function findClosestDmcColor(rgb: number[]): string {
  let minDist = Infinity;
  let closest = DMC_COLORS[0];
  DMC_COLORS.forEach(c => {
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
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Unable to create thumbnail'));
    img.src = src;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/png';
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
  const blob = dataUrlToBlob(thumb);
  const upload = await uploadData({
    path: ({ identityId }) =>
      `customer-images/${identityId}/${crypto.randomUUID()}.png`,
    data: blob,
    options: { contentType: 'image/png' },
  });
  const result = await upload.result;
  const { data } = await client.models.Project.create({
    image: result.path,
    pattern: JSON.stringify(pattern),
    progress: [],
  });
  return data;
}
