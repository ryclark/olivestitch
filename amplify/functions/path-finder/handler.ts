import type { Schema } from "../../data/resource";

export const handler: Schema["pathFinder"]["functionHandler"] = async (event) => {
  const { grid } = event.arguments;

  if (!grid) {
    throw new Error("Missing 'grid' argument");
  }

  const parsed = grid.map(row => {
    if (!row) {
      throw new Error("Grid contains a null or undefined row");
    }
    return row.map(Number);
  });

  const rows = parsed.length;
  const cols = parsed[0]?.length ?? 0;

  return `There are ${rows} rows and ${cols} columns.`;
}