import { FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { RegisterBodySchema, LoginBodySchema } from './auth.schema.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);
  const authController = new AuthController(authService);

  // POST /api/v1/auth/register
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Register a new Customer or Vendor user',
        body: RegisterBodySchema,
      },
    },
    authController.registerHandler
  );

  // POST /api/v1/auth/login
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Authenticate with email & password',
        body: LoginBodySchema,
      },
    },
    authController.loginHandler
  );

  // POST /api/v1/auth/google
  fastify.post(
    '/google',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Authenticate via Google OAuth ID token',
        body: {
          type: 'object',
          required: ['email', 'name', 'googleId'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            googleId: { type: 'string' },
          },
        },
      },
    },
    authController.googleLoginHandler
  );

  // POST /api/v1/auth/refresh
  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Refresh JWT access token',
      },
    },
    authController.refreshTokenHandler
  );

  // POST /api/v1/auth/logout
  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['Authentication'],
        summary: 'Revoke refresh session & logout',
      },
    },
    authController.logoutHandler
  );
};
