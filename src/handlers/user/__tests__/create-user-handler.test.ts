import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { handler } from '../create-user-handler';
import { createUser } from '../userService';

beforeEach(() => {
  vi.clearAllMocks();
});

// Mock and replace the module
vi.mock('../userService', () => ({
  createUser: vi.fn(),
}));

describe('createUser handler', () => {
  test('should return 200 when user created', async () => {
    const name = faker.person.firstName();
    const email = faker.internet.email();
    // Type-safe mocking
    vi.mocked(createUser).mockResolvedValue({
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

    const response = await handler(event, {} as any);
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

    const response = await handler(event, {} as any);

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
  });
});
