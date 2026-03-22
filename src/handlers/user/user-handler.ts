import { restApiHandler } from '@@middleware/api';
import { createUserRepository } from '@@repositories/user/UserRepositoryImpl';
import {
  getUserRequestSchema,
  userRequestSchema,
  userResponseSchema,
} from '@@schemas/user/userSchema';
import { createUserService } from '@@services/user/userService';
import { Errors } from '@@utils/errors';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'createUser',
});

const userService = createUserService(createUserRepository());

export const createUserHandler = restApiHandler({
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

export const getUserHandler = restApiHandler({
  requestSchema: getUserRequestSchema,
  responseSchema: userResponseSchema,
}).handler(async (event) => {
  const result = await userService.getUser(event.pathParameters.userId);

  if (!result) {
    throw Errors.NOT_FOUND('User');
  }

  return result;
});
