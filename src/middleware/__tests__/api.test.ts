import { restApiHandler } from '@@middleware/api';
import { AppError } from '@@utils/errors';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────
const bodySchema = z.object({
  name: z.string(),
});

const querySchema = z.object({
  page: z.string(),
});

const pathSchema = z.object({
  id: z.string(),
});

const responseSchema = z.object({
  message: z.string(),
});

const mockContext = {} as Context;

const mockEvent = (overrides?: {
  body?: Record<string, unknown>;
  query?: Record<string, string>;
  path?: Record<string, string>;
}): APIGatewayProxyEvent =>
  ({
    body: overrides?.body ? JSON.stringify(overrides.body) : null,
    queryStringParameters: overrides?.query ?? null,
    pathParameters: overrides?.path ?? null,
    headers: { 'content-type': 'application/json' },
  }) as any;

describe('restApiHandler', () => {
  describe('happy path', () => {
    test('should handle full request correctly', async () => {
      const handler = restApiHandler({
        body: bodySchema,
        query: querySchema,
        path: pathSchema,
        response: responseSchema,
      }).handler(async ({ body, query, path }) => {
        return { message: `${body.name}-${query.page}-${path.id}` };
      });

      const res = await handler(
        mockEvent({
          body: { name: 'Greg' },
          query: { page: '1' },
          path: { id: '123' },
        }),
        mockContext,
      );

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({
        success: true,
        data: { message: 'Greg-1-123' },
      });
    });

    test('should work with no schemas provided', async () => {
      const handler = restApiHandler({}).handler(async () => {
        return { ok: true };
      });

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({
        success: true,
        data: { ok: true },
      });
    });

    test('should wrap null/undefined return as empty object', async () => {
      const handler = restApiHandler({}).handler(async () => {
        return undefined as any;
      });

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ success: true, data: {} });
    });

    test('should pass through response with statusCode untouched', async () => {
      const handler = restApiHandler({}).handler(async () => {
        return {
          statusCode: 201,
          body: JSON.stringify({ created: true }),
        } as any;
      });

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body)).toEqual({ created: true });
    });

    test('should set content-type header', async () => {
      const handler = restApiHandler({}).handler(async () => ({ ok: true }));

      const res = await handler(mockEvent(), mockContext);

      expect(res.headers?.['content-type']).toBe('application/json');
    });
  });

  describe('body validation', () => {
    test('should parse and pass validated body to handler', async () => {
      let received: any;
      const handler = restApiHandler({ body: bodySchema }).handler(
        async ({ body }) => {
          received = body;
          return {};
        },
      );

      await handler(mockEvent({ body: { name: 'Alice' } }), mockContext);

      expect(received).toEqual({ name: 'Alice' });
    });

    test('should return 400 when body fails validation', async () => {
      const handler = restApiHandler({ body: bodySchema }).handler(
        async () => ({}),
      );

      const res = await handler(
        mockEvent({ body: { name: 123 } }), // name should be string
        mockContext,
      );

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
      });
    });

    test('should return 400 when required body field is missing', async () => {
      const handler = restApiHandler({ body: bodySchema }).handler(
        async () => ({}),
      );

      const res = await handler(mockEvent({ body: {} }), mockContext);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    });

    test('should skip body validation when body is null', async () => {
      const handler = restApiHandler({ body: bodySchema }).handler(
        async () => ({ ok: true }),
      );

      const res = await handler(mockEvent(), mockContext); // body: null

      expect(res.statusCode).toBe(200);
    });
  });

  describe('query validation', () => {
    test('should parse and pass validated query to handler', async () => {
      let received: any;
      const handler = restApiHandler({ query: querySchema }).handler(
        async ({ query }) => {
          received = query;
          return {};
        },
      );

      await handler(mockEvent({ query: { page: '2' } }), mockContext);

      expect(received).toEqual({ page: '2' });
    });

    test('should return 400 when query fails validation', async () => {
      const strictQuery = z.object({ page: z.string().regex(/^\d+$/) });
      const handler = restApiHandler({ query: strictQuery }).handler(
        async () => ({}),
      );

      const res = await handler(
        mockEvent({ query: { page: 'abc' } }),
        mockContext,
      );

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    });
  });

  describe('path validation', () => {
    test('should parse and pass validated path to handler', async () => {
      let received: any;
      const handler = restApiHandler({ path: pathSchema }).handler(
        async ({ path }) => {
          received = path;
          return {};
        },
      );

      await handler(mockEvent({ path: { id: '42' } }), mockContext);

      expect(received).toEqual({ id: '42' });
    });

    test('should return 400 when path fails validation', async () => {
      const strictPath = z.object({ id: z.string().uuid() });
      const handler = restApiHandler({ path: strictPath }).handler(
        async () => ({}),
      );

      const res = await handler(
        mockEvent({ path: { id: 'not-a-uuid' } }),
        mockContext,
      );

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    });
  });

  describe('response validation', () => {
    test('should pass when response matches schema', async () => {
      const handler = restApiHandler({ response: responseSchema }).handler(
        async () => ({
          message: 'hello',
        }),
      );

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(200);
    });

    test('should return 400 when response does not match schema', async () => {
      const handler = restApiHandler({ response: responseSchema }).handler(
        async () =>
          ({
            wrong: 'field', // missing `message`
          }) as any,
      );

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    });

    test('should not validate response when schema is not provided', async () => {
      const handler = restApiHandler({}).handler(async () => ({
        anything: true,
      }));

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('error handling', () => {
    test('should return AppError statusCode and errorCode', async () => {
      const handler = restApiHandler({}).handler(async () => {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
      });

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body)).toEqual({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    });

    test('should include details in AppError response when provided', async () => {
      const handler = restApiHandler({}).handler(async () => {
        throw new AppError(400, 'Bad input', 'BAD_INPUT', { field: 'email' });
      });

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: {
          code: 'BAD_INPUT',
          details: { field: 'email' },
        },
      });
    });

    test('should return 500 for unknown errors', async () => {
      const handler = restApiHandler({}).handler(async () => {
        throw new Error('Something exploded');
      });

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body)).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something exploded',
        },
      });
    });

    test('should return 500 with fallback message when error has no message', async () => {
      const handler = restApiHandler({}).handler(async () => {
        throw new Error();
      });

      const res = await handler(mockEvent(), mockContext);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      });
    });

    test('should return 400 for invalid JSON body', async () => {
      const handler = restApiHandler({}).handler(async () => ({}));

      const event = mockEvent();
      event.body = '{ invalid json }';

      const res = await handler(event, mockContext);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toMatchObject({
        success: false,
        error: { code: 'INVALID_JSON' },
      });
    });
  });

  describe('context', () => {
    test('should pass lambda context to handler', async () => {
      const ctx = { functionName: 'my-function' } as Context;
      let received: any;

      const handler = restApiHandler({}).handler(async ({ context }) => {
        received = context;
        return {};
      });

      await handler(mockEvent(), ctx);

      expect(received.functionName).toBe('my-function');
    });
  });
});
