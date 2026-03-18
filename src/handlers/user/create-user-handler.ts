import {
  userRequestSchema,
  userResponseSchema,
} from '@@schemas/user/userSchema';
import { Logger } from '@aws-lambda-powertools/logger';
import { restApiHandler } from '../../middleware/api';
import { createUser } from './userService';

const logger = new Logger({
  serviceName: 'createUser',
});

export const handler = restApiHandler({
  requestSchema: userRequestSchema,
  responseSchema: userResponseSchema,
}).handler(async (event) => {
  // event.body is ALREADY validated and typed in middleware
  const result = await createUser(event);
  logger.info('user created', result);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});
