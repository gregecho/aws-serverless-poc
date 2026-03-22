import { UserRepository } from '@@repositories/user/UserRepository';
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
      get: vi.fn(),
    };

    const userService = createUserService(mockRepo);
    const name = faker.person.firstName();
    const email = faker.internet.email();

    const user = {
      name,
      email,
    };

    const result = await userService.createUser(user);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe(name);
    expect(result.email).toBe(email);
    expect(result).toHaveProperty('id');
  });
});
