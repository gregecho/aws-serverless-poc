import { dynamo } from '@@clients/dynamoClient';
import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createUser } from '../userService';

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
    const mockSend = vi.mocked(dynamo.send).mockResolvedValue({} as any);
    const name = faker.person.firstName();
    const email = faker.internet.email();

    const user = {
      name,
      email,
    };

    const result = await createUser(user);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(result.name).toBe(name);
    expect(result.email).toBe(email);
    expect(result).toHaveProperty('id');
  });
});
