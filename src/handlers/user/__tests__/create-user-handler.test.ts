import { UserService } from '@@services/user/userService';
import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createUserHandler, getUserHandler } from '..';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createUser handler', () => {
  // Mock UserService.createUser
  const mockCreateUser = vi.fn();

  vi.spyOn(UserService.prototype, 'createUser').mockImplementation(
    mockCreateUser,
  );

  test('should return 200 when user created', async () => {
    const name = faker.person.firstName();
    const email = faker.internet.email();
    // Type-safe mocking
    mockCreateUser.mockResolvedValue({
      id: faker.string.uuid(),
      name: name,
      email: email,
      createdAt: faker.date.anytime().toDateString(),
    });

    const userData = {
      name: name,
      email: email,
    };

    const event = {
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    } as any;

    const response = await createUserHandler(event, {} as any);
    expect(mockCreateUser).toHaveBeenCalledWith({ name, email });
    expect(response).toBeDefined();
    // ?.: optional chaining: Only access if NOT null/undefined
    // !.: Non-null assertion: This is NOT null/undefined
    expect(response!.statusCode).toBe(200);

    const body = JSON.parse(response!.body);
    expect(body.name).toBe(name);
    expect(body).toMatchObject({
      name: name,
    });
  });

  test('should return 400 when email is invalid', async () => {
    const userData = {
      name: faker.person.firstName(),
      email: 'invalid-email-format',
    };

    const event = {
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    } as any;

    const response = await createUserHandler(event, {} as any);

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    /**
     * {
          "message": "Validation Failed",
          "errors": [
            {
              "path": "email",
              "message": "invalid email"
            }
          ]
        }
     */
    expect(body.message).toBe('Validation Failed');
    expect(body.errors[0].path).toBe('email');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});

describe('getUser handler', () => {
  const mockGetUser = vi.fn();

  vi.spyOn(UserService.prototype, 'getUser').mockImplementation(mockGetUser);
  test('should return 200 when user exist', async () => {
    const name = faker.person.firstName();
    const email = faker.internet.email();
    const userId = faker.string.uuid();
    // Type-safe mocking
    mockGetUser.mockResolvedValue({
      id: userId,
      name: name,
      email: email,
      createdAt: faker.date.anytime().toDateString(),
    });

    const event = {
      pathParameters: { userId },
    };

    const response = await getUserHandler(event, {} as any);
    expect(mockGetUser).toHaveBeenCalledWith({ name, email });
    expect(response).toBeDefined();
    // ?.: optional chaining: Only access if NOT null/undefined
    // !.: Non-null assertion: This is NOT null/undefined
    expect(response!.statusCode).toBe(200);

    const body = JSON.parse(response!.body);
    expect(body.name).toBe(name);
    expect(body).toMatchObject({
      name: name,
    });
  });
});
