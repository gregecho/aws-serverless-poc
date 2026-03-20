import { parser } from '@aws-lambda-powertools/parser/middleware';
import middy, { MiddlewareObj } from '@middy/core';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { output, ZodError, ZodType } from 'zod';
import { AppError } from '../utils/errors';

/**
 * Middy-enabled handler for API Gateway Proxy Lambda handlers
 */
export const restApiHandler = <R extends ZodType, T extends ZodType>(options: {
  requestSchema: R;
  responseSchema?: T;
}) => {
  const wrapper = middy();
  //wrapper.use(httpJsonBodyParser());
  wrapper.use(httpHeaderNormalizer());

  wrapper.use({
    before: (request) => {
      const target = getValidationTarget(request.event);
      // 将处理后的数据存回 event.body 供 parser 消费
      request.event.body = target;
    },
  });

  wrapper.use(parser({ schema: options.requestSchema }));

  wrapper.use(handleApiErrors());

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

/**
 * 核心优化：自动识别校验源
 * GET/DELETE 校验 pathParameters，POST/PUT/PATCH 校验 body
 */
const getValidationTarget = (event: APIGatewayProxyEvent) => {
  const method = event.httpMethod?.toUpperCase();
  if (['GET', 'DELETE'].includes(method)) {
    // 合并路径参数和查询参数进行统一校验
    return { ...event.pathParameters, ...event.queryStringParameters };
  }
  // 对于有 Body 的请求，如果是字符串则尝试解析（兼容手动模拟 event 的情况）
  return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
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

      // 1. Handle business error
      if (error instanceof AppError) {
        request.response = {
          statusCode: error.statusCode,
          body: JSON.stringify({
            success: false,
            message: error.message,
            error: {
              code: error.errorCode,
              details: error.details,
            },
          }),
        };
        return;
      }

      //2. Try to identify zodError
      if (isZodError(error)) return buildZodResponse(error, request);
      if (isZodError(cause)) return buildZodResponse(cause, request);

      // 3. Parse error
      if (
        error?.name === 'ParseError' ||
        error?.name === 'UnprocessableEntityError'
      ) {
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
