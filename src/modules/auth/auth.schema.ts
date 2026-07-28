import { Type, Static } from '@sinclair/typebox';

export const RoleEnum = Type.Union([
  Type.Literal('CUSTOMER'),
  Type.Literal('VENDOR'),
  Type.Literal('SUPER_ADMIN'),
]);

// Register Schema
export const RegisterBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8, maxLength: 100 }),
    name: Type.String({ minLength: 2, maxLength: 100 }),
    role: Type.Optional(RoleEnum),
  },
  { additionalProperties: false }
);

export type RegisterBody = Static<typeof RegisterBodySchema>;

// Login Schema
export const LoginBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 1, maxLength: 100 }),
  },
  { additionalProperties: false }
);

export type LoginBody = Static<typeof LoginBodySchema>;

// Refresh Token Request Body (Optional for Mobile App API clients)
export const RefreshTokenBodySchema = Type.Object(
  {
    refreshToken: Type.Optional(Type.String()),
  },
  { additionalProperties: false }
);

export type RefreshTokenBody = Static<typeof RefreshTokenBodySchema>;

// Standard Error Response Schema
export const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
  }),
});

// User Detail Response Schema
export const UserResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.String(),
  role: RoleEnum,
  createdAt: Type.String({ format: 'date-time' }),
});

export const RegisterResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: UserResponseSchema,
});

// Dual Mobile & Web Login Response Schema
export const LoginResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    accessToken: Type.String(),
    refreshToken: Type.Optional(Type.String()),
    user: UserResponseSchema,
  }),
});

// Refresh Token Response Schema
export const RefreshTokenResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    accessToken: Type.String(),
    refreshToken: Type.Optional(Type.String()),
  }),
});

// Logout Response Schema
export const LogoutResponseSchema = Type.Object({
  success: Type.Literal(true),
  message: Type.String(),
});
