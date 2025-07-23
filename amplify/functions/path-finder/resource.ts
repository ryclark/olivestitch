import { defineFunction } from '@aws-amplify/backend';

export const pathFinder = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'path-finder',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});