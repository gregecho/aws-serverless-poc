import { createUserHandler } from '@@handlers/user';
import { UserService } from '@@services/user/userService';
import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockCreateUser = vi.fn();

// Mock UserService.createUser
vi.spyOn(UserService.prototype, 'createUser').mockImplementation(
  mockCreateUser,
);

vi.mock('@@clients/dynamoClient', () => ({
  dynamo: {
    send: vi.fn().mockResolvedValue({}),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const generateUser = () => ({
  name: faker.person.firstName(),
  email: faker.internet.email(),
});

describe('createUser API (integration)', () => {
  test('should return 200 when request is valid', async () => {
    const { name, email } = generateUser();
    mockCreateUser.mockResolvedValue({
      id: faker.string.uuid(),
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    const event = {
      body: JSON.stringify({ name, email }),
      headers: {
        'Content-Type': 'application/json',
      },
    } as any;

    const response = await createUserHandler(event, {} as any);

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      name,
      email,
    });

    expect(mockCreateUser).toHaveBeenCalledWith({ name, email });
  });

  test('should return 400 when email invalid (Zod)', async () => {
    const event = {
      body: JSON.stringify({
        name: faker.person.firstName(),
        email: 'invalid-email',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    } as any;

    const response = await createUserHandler(event, {} as any);

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);

    expect(body.message).toBe('Validation Failed');
    expect(body.errors[0].path).toBe('email');

    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('should return 400 when body is invalid JSON', async () => {
    const event = {
      body: '{ invalid json }',
      headers: {
        'Content-Type': 'application/json',
      },
    } as any;

    const response = await createUserHandler(event, {} as any);

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);

    expect(body.message).toBe('Invalid JSON format');
  });

  test('should return 500 when service throws', async () => {
    mockCreateUser.mockRejectedValue(new Error('DB down'));

    const event = {
      body: JSON.stringify({
        name: faker.person.firstName(),
        email: faker.internet.email(),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    } as any;

    const response = await createUserHandler(event, {} as any);

    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);

    expect(body.message).toBe('Internal Server Error');
  });
});
