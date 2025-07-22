import { defineFunction } from "@aws-amplify/backend";

export const pathFinder = defineFunction({
  name: "path-finder",
  entry: "./handler.ts"
});