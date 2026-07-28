import { FastifyPluginAsync } from 'fastify';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { GetMeResponseSchema, ErrorResponseSchema } from './users.schema.js';

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const usersService = new UsersService(fastify.prisma);
  const usersController = new UsersController(usersService);

  // GET /api/v1/users/me (Protected Route)
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        response: {
          200: GetMeResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    usersController.getMeHandler
  );
};
