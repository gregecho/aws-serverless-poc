import {
  BadInputErrorResponseSchema,
  InternalErrorResponseSchema,
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
