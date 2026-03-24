import { UserRepository } from '@@repositories/user/UserRepository';
import { UserBody, UserResponse } from '@@schemas/user/userSchema';
import { Errors } from '@@utils/errors';
import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createUserService } from '../userService';

beforeAll(() => {
  vi.stubEnv('USERS_TABLE', 'mock-USERS_TABLE');
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Mock DynamoDB client
vi.mock('@@clients/dynamoClient', () => {
  return {
    dynamo: {
      send: vi.fn().mockResolvedValue({}),
    },
  };
});

describe('createUser service', () => {
  test('should save user to dynamoDB', async () => {
    const mockRepo: UserRepository = {
      save: vi.fn().mockImplementation(async (user) => ({
        id: 'mock-id',
        ...user,
      })),
      getById: vi.fn(),
      update: function (
        userId: string,
        user: Partial<UserBody>,
      ): Promise<UserResponse> {
        throw new Error('Function not implemented.');
      },
      delete: function (userId: string): Promise<void> {
        throw new Error('Function not implemented.');
      },
      list: function (
        query?: Record<string, string | undefined>,
      ): Promise<UserResponse[]> {
        throw new Error('Function not implemented.');
      },
    };

    const userService = createUserService(mockRepo);
    const name = faker.person.firstName();
    const email = faker.internet.email();

    const user = {
      name,
      email,
    };

    const result = await userService.create(user);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe(name);
    expect(result.email).toBe(email);
    expect(result).toHaveProperty('id');
  });
});

const makeUser = (): UserResponse => ({
  id: faker.string.uuid(),
  name: faker.person.firstName(),
  email: faker.internet.email(),
  createdAt: new Date().toISOString(),
});

const makeRepo = (overrides: Partial<UserRepository> = {}): UserRepository => ({
  save: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  ...overrides,
});

describe('getById service', () => {
  test('should return user when found', async () => {
    const user = makeUser();
    const repo = makeRepo({ getById: vi.fn().mockResolvedValue(user) });
    const result = await createUserService(repo).getById(user.id);
    expect(repo.getById).toHaveBeenCalledWith(user.id);
    expect(result).toEqual(user);
  });

  test('should throw NOT_FOUND when user does not exist', async () => {
    const repo = makeRepo({
      getById: vi.fn().mockRejectedValue(Errors.NOT_FOUND('user')),
    });
    await expect(
      createUserService(repo).getById(faker.string.uuid()),
    ).rejects.toMatchObject({ statusCode: 404, errorCode: 'RESOURCE_NOT_FOUND' });
  });
});

describe('list service', () => {
  test('should return list of users', async () => {
    const users = [makeUser(), makeUser()];
    const repo = makeRepo({ list: vi.fn().mockResolvedValue(users) });
    const result = await createUserService(repo).list();
    expect(result).toHaveLength(2);
  });

  test('should pass query params to repository', async () => {
    const repo = makeRepo({ list: vi.fn().mockResolvedValue([]) });
    const query = { page: '1', limit: '10' };
    await createUserService(repo).list(query);
    expect(repo.list).toHaveBeenCalledWith(query);
  });
});

describe('update service', () => {
  test('should return updated user', async () => {
    const user = makeUser();
    const repo = makeRepo({ update: vi.fn().mockResolvedValue(user) });
    const result = await createUserService(repo).update(user.id, { name: 'New Name' });
    expect(repo.update).toHaveBeenCalledWith(user.id, { name: 'New Name' });
    expect(result).toEqual(user);
  });

  test('should throw NOT_FOUND when user does not exist', async () => {
    const repo = makeRepo({
      update: vi.fn().mockRejectedValue(Errors.NOT_FOUND('user')),
    });
    await expect(
      createUserService(repo).update(faker.string.uuid(), { name: 'x' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('delete service', () => {
  test('should call repository delete', async () => {
    const repo = makeRepo({ delete: vi.fn().mockResolvedValue(undefined) });
    const id = faker.string.uuid();
    await createUserService(repo).delete(id);
    expect(repo.delete).toHaveBeenCalledWith(id);
  });

  test('should throw NOT_FOUND when user does not exist', async () => {
    const repo = makeRepo({
      delete: vi.fn().mockRejectedValue(Errors.NOT_FOUND('user')),
    });
    await expect(
      createUserService(repo).delete(faker.string.uuid()),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
