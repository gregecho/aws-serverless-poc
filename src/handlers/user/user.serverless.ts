import type { AWS } from '@serverless/typescript';

export const userFunctions: AWS['functions'] = {
  'create-user': {
    handler: 'src/handlers/user/user-handler.createUserHandler',
    events: [
      {
        http: {
          path: '/user',
          method: 'POST',
        },
      },
    ],
  },
  'get-user': {
    handler: 'src/handlers/user/user-handler.getUserHandler',
    events: [
      {
        http: {
          path: '/user/{userId}',
          method: 'GET',
        },
      },
    ],
  },
};
