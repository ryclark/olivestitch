import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'olivestorage',
  access: (allow) => ({
    'customer-images/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
});