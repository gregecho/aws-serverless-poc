import { Context } from 'aws-lambda';
import { RouteConfig } from '@asteasolutions/zod-to-openapi';

/**
 * Represents the normalized and validated input passed to the business handler.
 *
 * This type contains data that has already been parsed and validated
 *
 * @template B - Type of the request body
 * @template Q - Type of the query string parameters
 * @template P - Type of the path parameters
 */
export type HandlerInput<B = unknown, Q = unknown, P = unknown> = {
  body: B;
  query: Q;
  path: P;
  context: Context;
};

/** Unified Error Body */
export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/** Unified Success body */
export type ApiSuccessBody<T> = {
  success: true;
  data: T;
};

/** OpenAPI route metadata for restApiHandler */
export type OpenApiMeta = {
  method: RouteConfig['method'];
  path: string;
  summary?: string;
  tags?: string[];
  description?: string;
};
