import type { Schema } from "../../data/resource";

export const handler: Schema["pathFinder"]["functionHandler"] = async (event) => {
  // arguments typed from `.arguments()`
  const { grid } = event.arguments;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  // return typed from `.returns()`
  return `There are ${rows} rows and ${cols} columns.`;
};