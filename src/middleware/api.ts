import middy, { MiddlewareObj } from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { Context } from 'aws-lambda';
import { output, ZodError, ZodType } from 'zod';

/**
 * Middy-enabled handler for API Gateway Proxy Lambda handlers
 */
export const restApiHandler = <R extends ZodType, T extends ZodType>(options: {
  requestSchema: R;
  responseSchema?: T;
}) => {
  const wrapper = middy()
    .use(httpJsonBodyParser())
    .use({
      before: (request) => {
        // Parese body and set the validated body back
        try {
          request.event.body = options.requestSchema.parse(request.event.body);
        } catch (e) {
          throw e;
        }
      },
    })
    .use(handleApiErrors());

  if (options.responseSchema) {
    wrapper.use(validateResponse(options.responseSchema));
  }

  return {
    handler: (handler: (body: output<R>, context: Context) => Promise<any>) => {
      return wrapper.handler(async (event: any, context: Context) => {
        return handler(event.body, context);
      });
    },
  };
};

export const validateResponse = (schema: ZodType): MiddlewareObj => {
  return {
    after: (request) => {
      const { response } = request;
      if (response?.body) {
        try {
          const data =
            typeof response.body === 'string'
              ? JSON.parse(response.body)
              : response.body;
          schema.parse(data); // Throws ZodError if invalid, caught by handleApiErrors
        } catch (e) {
          console.error('Response Validation Error:', e);
          throw e;
        }
      }
    },
  };
};

export const handleApiErrors = (): MiddlewareObj => {
  return {
    onError: (request) => {
      const error = request.error as any;
      const cause = error?.cause;

      //Try to identify zodError
      if (isZodError(error)) return buildZodResponse(error, request);
      if (isZodError(cause)) return buildZodResponse(cause, request);

      // 3. Parse error
      if (error?.name === 'ParseError') {
        request.response = {
          statusCode: 400,
          body: JSON.stringify({
            message: 'Invalid JSON format',
            details: error.message,
          }),
        };
        return;
      }

      // 4. Other
      request.response = {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Internal Server Error',
          error: error?.message,
        }),
      };
    },
  };
};

const isZodError = (err: any): err is ZodError => {
  return err && Array.isArray(err.issues);
};

const buildZodResponse = (zodError: { issues: any[] }, request: any) => {
  request.response = {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Validation Failed',
      errors: zodError.issues.map((issue) => ({
        path: Array.isArray(issue.path) ? issue.path.join('.') : issue.path,
        message: issue.message,
      })),
    }),
  };
};
