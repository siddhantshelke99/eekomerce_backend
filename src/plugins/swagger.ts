import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env } from '../config/env.js';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // Only mount OpenAPI / Swagger docs in non-production environments
  if (env.NODE_ENV === 'production') {
    return;
  }

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Hyperlocal Commerce Platform API',
        description: 'VAPT-compliant production REST API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Authentication and session management' },
        { name: 'Users', description: 'User account and profile management' },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
};

export default fp(swaggerPlugin, {
  name: 'swagger',
});
