import {
  BadInputErrorResponseSchema,
  InternalErrorResponseSchema,
  NotFoundErrorResponseSchema,
} from '@@schemas/error.schema';

export const commonErrors = {
  400: {
    description: 'Bad Request / Validation Error',
    content: { 'application/json': { schema: BadInputErrorResponseSchema } },
  },
  500: {
    description: 'Internal Server Error',
    content: { 'application/json': { schema: InternalErrorResponseSchema } },
  },
};

export const commonGetErrors = {
  400: {
    description: 'Bad Request / Validation Error',
    content: { 'application/json': { schema: BadInputErrorResponseSchema } },
  },
  404: {
    description: 'User not found',
    content: { 'application/json': { schema: NotFoundErrorResponseSchema } },
  },
  500: {
    description: 'Internal Server Error',
    content: { 'application/json': { schema: InternalErrorResponseSchema } },
  },
};
