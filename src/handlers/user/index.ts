import { restApiHandler } from '@@middleware/api';
import { createUserRepository } from '@@repositories/user/UserRepositoryImpl';
import {
  createUserRequestSchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  updateUserRequestSchema,
  userIdPathSchema,
  userResponseSchema,
} from '@@schemas/user/userSchema';
import { createUserService } from '@@services/user/userService';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'createUser' });
const userService = createUserService(createUserRepository());

export const createUserHandler = restApiHandler({
  body: createUserRequestSchema,
  response: userResponseSchema,
}).handler(async ({ body }) => {
  const result = await userService.create(body);
  logger.info('user created', { userId: result.id });
  return result;
});

export const getUserByIdHandler = restApiHandler({
  path: userIdPathSchema,
  response: userResponseSchema,
}).handler(async ({ path }) => {
  const result = await userService.getById(path.id);
  logger.info('user fetched', { userId: path.id });
  return result;
});

export const listUsersHandler = restApiHandler({
  query: listUsersQuerySchema,
  response: listUsersResponseSchema,
}).handler(async ({ query }) => {
  const result = await userService.list(query);
  logger.info('users listed', { count: result.length });
  return result;
});

export const updateUserHandler = restApiHandler({
  body: updateUserRequestSchema,
  path: userIdPathSchema,
  response: userResponseSchema,
}).handler(async ({ body, path }) => {
  const result = await userService.update(path.id, body);
  logger.info('user updated', { userId: path.id });
  return result;
});

export const deleteUserHandler = restApiHandler({
  path: userIdPathSchema,
}).handler(async ({ path }) => {
  await userService.delete(path.id);
  logger.info('user deleted', { userId: path.id });
  return { success: true };
});
