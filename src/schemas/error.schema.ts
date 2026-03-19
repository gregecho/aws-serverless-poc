import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const BadInputErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: 'INVALID_INPUT' }),
      message: z.string().openapi({ example: 'The provided ID is invalid' }),
      details: z.any().optional(),
    }),
  })
  .openapi('BadInputErrorResponse');

export const UnauthorizedErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: 'UNAUTHORIZED' }),
      message: z.string().openapi({ example: 'Unauthorized access' }),
      details: z.any().optional(),
    }),
  })
  .openapi('UnauthorizedErrorResponse');

export const NotFoundErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: 'RESOURCE_NOT_FOUND' }),
      message: z.string().openapi({ example: 'Resource not found' }),
      details: z.any().optional(),
    }),
  })
  .openapi('NOTFOUNDErrorResponse');

export const InternalErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: 'INTERNAL_ERROR' }),
      message: z.string().openapi({ example: 'Internal Server Error' }),
      details: z.any().optional(),
    }),
  })
  .openapi('InternalErrorResponse');
