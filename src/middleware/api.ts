/**
 * Core middleware utilities for API Gateway Lambda handlers.
 *
 * This module provides:
 * - Request validation via Zod schemas
 * - Centralized error handling
 * - Automatic response normalization
 */

import { AppError } from '@@utils/errors';
import middy, { MiddlewareObj } from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import z, { output, ZodError, ZodNever, ZodType } from 'zod';
import { ApiErrorBody, HandlerInput, Schemas } from './types';

/**
 * Middleware to validate and transform incoming API Gateway request data using Zod schemas.
 *
 * This middleware runs in the "before" phase and parses the incoming request:
 * - body: Parses JSON request body into a typed object
 * - query: Validates and transforms query string parameters
 * - path: Validates and transforms path parameters
 *
 * If validation fails, a ZodError will be thrown and handled by downstream error middleware.
 *
 * @param schemas - Optional Zod schemas for body, query, and path validation
 * @returns Middy middleware object
 */
export const zodValidationMiddleware = (
  schemas: Schemas,
): MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
  return {
    before: async (request) => {
      const { event } = request;

      if (schemas.body && event.body !== null) {
        event.body = schemas.body.parse(event.body) as any;
      }

      if (schemas.query && event.queryStringParameters) {
        event.queryStringParameters = schemas.query.parse(
          event.queryStringParameters ?? {},
        ) as any;
      }

      if (schemas.path && event.pathParameters) {
        event.pathParameters = schemas.path.parse(
          event.pathParameters ?? {},
        ) as any;
      }
    },
  };
};

/**
 * Validates the handler's raw return value against a Zod schema.
 * Must run BEFORE responseMiddleware wraps the response.
 * (Middy "after" hooks run in reverse registration order)
 */
export const zodValidationResponseMiddleware = (
  schema: ZodType,
): MiddlewareObj => {
  return {
    after: (request) => {
      const { response } = request;
      // At this point, response is still the raw value from the handler
      // responseMiddleware hasn't wrapped it yet (runs after this in reverse order)
      schema.parse(response);
    },
  };
};

/**
 * Global error handling middleware for API Gateway Lambda handlers.
 *
 * This middleware catches all errors thrown during request processing
 * and maps them into standardized HTTP responses.
 *
 * Error mapping:
 * - ZodError           → 400 VALIDATION_ERROR
 * - AppError           → AppError.statusCode + AppError.errorCode
 * - ParseError         → 400 INVALID_JSON
 * - Unknown            → 500 INTERNAL_ERROR
 *
 * This ensures consistent error responses across all handlers.
 *
 * @returns Middy middleware object
 */
export const errorHandler = (): MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => ({
  onError: async (request) => {
    const error = request.error as any;

    // ZodError
    if (error instanceof ZodError) {
      request.response = jsonResponse(
        400,
        errorBody('VALIDATION_ERROR', 'Validation failed', error.issues),
      );
      return;
    }

    // Handle business error
    if (error instanceof AppError) {
      request.response = jsonResponse(
        error.statusCode,
        errorBody(error.errorCode, error.message, error.details),
      );
      return;
    }

    // Parse error
    if (
      error?.name === 'ParseError' ||
      error?.name === 'UnprocessableEntityError'
    ) {
      request.response = jsonResponse(
        400,
        errorBody('INVALID_JSON', 'Invalid JSON format', error.message),
      );
      return;
    }

    // Other
    request.response = jsonResponse(
      500,
      errorBody('INTERNAL_ERROR', error?.message || 'Internal Server Error'),
    );
  },
});

/**
 * Factory for type-safe API Gateway Lambda handlers with Zod validation.
 *
 * Middleware execution order:
 *   before: httpJsonBodyParser → zodValidation → handler
 *   after:  zodValidationResponse → responseMiddleware   (reverse registration)
 *   error:  errorHandler
 *
 * @returns Middy middleware object
 *
 * @example
 * export const handler = restApiHandler({
 *   body: CreateUserSchema,
 *   response: UserResponseSchema,
 * }).handler(async ({ body }) => {
 *   return createUser(body);
 * });
 */
const responseMiddleware = (): MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => ({
  after: async (request) => {
    const res = request.response;

    // Return directly if res is standard
    if (res?.statusCode) return;

    request.response = jsonResponse(200, {
      success: true,
      data: res ?? {},
    });
  },
});

const jsonResponse = (
  statusCode: number,
  body: unknown,
): APIGatewayProxyResult => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const errorBody = (
  code: string,
  message: string,
  details?: unknown,
): ApiErrorBody => ({
  success: false,
  error: { code, message, ...(details !== undefined && { details }) },
});

/**
 * Middy-enabled handler for API Gateway Proxy Lambda handlers
 */
export const restApiHandler = <
  B extends ZodType = ZodNever, // Default to ZodNever sine it's optional
  Q extends ZodType = ZodNever,
  P extends ZodType = ZodNever,
  R extends ZodType = ZodNever,
>(options: {
  body?: B;
  query?: Q;
  path?: P;
  response?: R;
}) => {
  const wrapper = middy()
    .use(httpJsonBodyParser())
    .use(
      zodValidationMiddleware({
        body: options.body,
        query: options.query,
        path: options.path,
      }),
    )
    .use(errorHandler())
    .use(responseMiddleware());

  if (options.response) {
    wrapper.use(zodValidationResponseMiddleware(options.response));
  }

  return {
    handler: (
      handler: (
        input: HandlerInput<z.infer<B>, z.infer<Q>, z.infer<P>>,
      ) => Promise<[R] extends [ZodNever] ? any : z.infer<R>>, // If need type depends on response
    ) => {
      return wrapper.handler(async (event, context) => {
        const input = {
          body: event.body as output<B>,
          query: event.queryStringParameters as output<Q>,
          path: event.pathParameters as output<P>,
          context,
        };
        return handler(input);
      });
    },
  };
};
