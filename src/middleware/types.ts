// types.ts
import { Context } from 'aws-lambda';
import { ZodType } from 'zod';

/**
 * Represents the normalized and validated input passed to the business handler.
 *
 * This type contains data that has already been parsed and validated
 * (e.g. by Zod schemas in middleware), so it is safe to use directly
 * in application logic without additional checks.
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

/**
 * Defines the validation schemas for different parts of an incoming HTTP request.
 *
 * Each schema is optional and, if provided, will be used to validate and
 * transform the corresponding part of the request before it reaches the handler.
 *
 * - body: Validates and parses the request body
 * - query: Validates and parses query string parameters
 * - path: Validates and parses path parameters
 */
export type Schemas = {
  body?: ZodType;
  query?: ZodType;
  path?: ZodType;
};

/** 统一错误响应结构 */
export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/** 统一成功响应结构 */
export type ApiSuccessBody<T> = {
  success: true;
  data: T;
};
