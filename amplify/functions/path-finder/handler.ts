import type { Schema } from "../../data/resource";

export const handler: Schema["pathFinder"]["functionHandler"] = async (event) => {
  const { grid } = event.arguments;

if (!grid) {
    return "Missing 'grid' argument";
  }

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] == null) {
      return `Grid contains a null or undefined row at index ${i}`;
    }
  }

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  return `There are ${rows} rows and ${cols} columns.`;
};