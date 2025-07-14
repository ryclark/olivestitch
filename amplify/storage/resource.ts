import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'olivestorage',
<<<<<<< ours
  access: (allow) => ({
=======
  access: allow => ({
>>>>>>> theirs
    'customer-images/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
<<<<<<< ours
});
=======
});
>>>>>>> theirs
