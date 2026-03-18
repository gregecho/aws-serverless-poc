import type { AWS } from '@serverless/typescript';

export const userFunctions: AWS['functions'] = {
  'create-user': {
    handler: 'src/handlers/user/create-user-handler.handler',
    events: [
      {
        http: {
          path: '/user',
          method: 'POST',
        },
      },
    ],
  },
};
