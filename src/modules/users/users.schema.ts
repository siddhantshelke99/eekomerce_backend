import { Type, Static } from '@sinclair/typebox';
import { UserResponseSchema, ErrorResponseSchema } from '../auth/auth.schema.js';

export const GetMeResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: UserResponseSchema,
});

export type GetMeResponse = Static<typeof GetMeResponseSchema>;
export { ErrorResponseSchema };
