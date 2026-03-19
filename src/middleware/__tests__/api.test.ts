import { handleApiErrors } from '@@middleware/api';
import { Errors } from '@@utils/errors';
import { describe, expect, test } from 'vitest';
import { ZodError } from 'zod';

describe('handleApiErrors middleware', () => {
  const middleware = handleApiErrors();

  test('should return 400 for ZodError (via cause)', async () => {
    const zodError = new ZodError([
      {
        code: 'invalid_format',
        path: ['email'],
        message: 'invalid email',
      } as any,
    ]);

    const request: any = {
      error: {
        cause: zodError,
      },
    };
    //Non-null assertion (!) tells TypeScript that the value will definitely exist,
    //while optional chaining (?.) safely accesses a value only if it exists.
    await middleware.onError!(request);

    expect(request.response.statusCode).toBe(400);

    const body = JSON.parse(request.response.body);
    expect(body.message).toBe('Validation Failed');
    expect(body.errors[0].path).toBe('email');
  });

  test('should handled by AppError if appError is throwed', async () => {
    const appError = Errors.BAD_REQUEST('test bad request');
    const request: any = {
      error: appError,
    };

    await middleware.onError!(request);
    expect(request.response.statusCode).toBe(400);

    const body = JSON.parse(request.response.body);
    expect(body.message).toBe('test bad request');
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  test('should return 400 for direct ZodError', async () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        path: ['name'],
        message: 'Required',
      } as any,
    ]);

    const request: any = {
      error: zodError,
    };

    await middleware.onError!(request);

    expect(request.response.statusCode).toBe(400);

    const body = JSON.parse(request.response.body);
    expect(body.message).toBe('Validation Failed');
    expect(body.errors[0].path).toBe('name');
  });

  test('should return 400 for ParseError', async () => {
    const request: any = {
      error: {
        name: 'ParseError',
        message: 'Unexpected token',
      },
    };

    await middleware.onError!(request);

    expect(request.response.statusCode).toBe(400);

    const body = JSON.parse(request.response.body);
    expect(body.message).toBe('Invalid JSON format');
  });

  test('should return 500 for unknown error', async () => {
    const request: any = {
      error: new Error('Something went wrong'),
    };

    await middleware.onError!(request);

    expect(request.response.statusCode).toBe(500);

    const body = JSON.parse(request.response.body);
    expect(body.message).toBe('Internal Server Error');
  });
});
