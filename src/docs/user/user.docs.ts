import {
  userRequestSchema,
  userResponseSchema,
} from '@@schemas/user/userSchema';
import { commonErrors } from '../common.errors';
import { registry } from '../registry';

registry.registerPath({
  method: 'post',
  path: '/user',
  tags: ['User'],
  summary: 'Create new user',
  request: {
    body: {
      content: {
        'application/json': { schema: userRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'create user success',
      content: { 'application/json': { schema: userResponseSchema } },
    },
    ...commonErrors,
  },
});
