import fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';

import { env } from './config/env.js';
import { errorHandler } from './common/errors/error-handler.js';
import prismaPlugin from './plugins/prisma.js';
import jwtPlugin from './plugins/jwt.js';
import swaggerPlugin from './plugins/swagger.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { storesRoutes } from './modules/stores/stores.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { reservationsRoutes } from './modules/reservations/reservations.routes.js';
import { requestsRoutes } from './modules/requests/requests.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { corporateRoutes } from './modules/corporate/corporate.routes.js';

export async function buildApp() {
  const loggerConfig =
    env.NODE_ENV === 'development'
      ? {
          level: 'debug',
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : {
          level: 'info',
        };

  const app = fastify({
    logger: loggerConfig,
    ajv: {
      customOptions: {
        removeAdditional: false,
        useDefaults: true,
        coerceTypes: true,
        allErrors: true,
      },
    },
  });

  // 1. Security Headers (Helmet)
  await app.register(fastifyHelmet, {
    contentSecurityPolicy:
      env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
  });

  // 2. CORS Security
  const allowedOrigins =
    env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim());
  await app.register(fastifyCors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Refresh-Token'],
  });

  // 3. Global Rate Limiting
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
  });

  // 4. Plugins Registration
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(swaggerPlugin);

  // 5. Central Error Handler
  app.setErrorHandler(errorHandler);

  // 6. Health Check Route
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    };
  });

  // 7. Feature Routes Registration
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(usersRoutes, { prefix: '/api/v1/users' });
  await app.register(storesRoutes, { prefix: '/api/v1/stores' });
  await app.register(productsRoutes, { prefix: '/api/v1/products' });
  await app.register(inventoryRoutes, { prefix: '/api/v1/inventory' });
  await app.register(reservationsRoutes, { prefix: '/api/v1/reservations' });
  await app.register(requestsRoutes, { prefix: '/api/v1/requests' });
  await app.register(ordersRoutes, { prefix: '/api/v1/orders' });
  await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  await app.register(corporateRoutes, { prefix: '/api/v1/corporate' });

  return app;
}
