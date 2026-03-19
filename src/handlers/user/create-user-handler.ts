import { restApiHandler } from '@@middleware/api';
import { createUserRepository } from '@@repositories/user/UserRepositoryImpl';
import {
  userRequestSchema,
  userResponseSchema,
} from '@@schemas/user/userSchema';
import { createUserService } from '@@services/user/userService';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'createUser',
});

const userService = createUserService(createUserRepository());

export const handler = restApiHandler({
  requestSchema: userRequestSchema,
  responseSchema: userResponseSchema,
}).handler(async (event) => {
  // event.body is ALREADY validated and typed in middleware
  const result = await userService.createUser(event);
  logger.info('user created', result);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});
