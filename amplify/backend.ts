import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pathFinder } from './path-finder/resource';

defineBackend({
  auth,
  data,
  storage,
  pathFinder
});
