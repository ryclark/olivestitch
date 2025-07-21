import { defineFunction } from "@aws-amplify/backend";

export const myFirstFunction = defineFunction({
  name: "path-finder",
  entry: "./handler.ts"
});