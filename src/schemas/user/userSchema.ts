import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const baseUserSchema = z
  .object({
    name: z
      .string()
      .min(2, 'name too short')
      .describe('user name')
      .meta({ example: 'first name' }),
    email: z
      .email('invalid email')
      .describe('users email')
      .meta({ example: 'test@test.com' }),
  })
  .openapi('BaseUser');

// extend: Use extend to add additional createAt
// omit: Use omit to remove additional properties
export const userResponseSchema = baseUserSchema
  .extend({
    id: z.uuid().describe('user id'),
    createdAt: z
      .string()
      .describe('User created at')
      .meta({ example: '1900-01-01' }),
  })
  .openapi('UserResponse');

// partial: Make all fields to optional
export const updateUserRequestSchema = baseUserSchema
  .partial()
  .openapi('UpdateUserRequest');

export const userRequestSchema = baseUserSchema.openapi('UserRequest');

export const getUserRequestSchema = z.object({
  pathParameters: z.object({
    userId: z.string().describe('unique identifier of user to retrieve').meta({
      example: '123-123-123-12345',
    }),
  }),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserRequest = z.infer<typeof userRequestSchema>;
export type UserBody = z.infer<typeof baseUserSchema>;

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
