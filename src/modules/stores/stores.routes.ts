import { FastifyPluginAsync } from 'fastify';
import { StoresService } from './stores.service.js';
import { StoresController } from './stores.controller.js';
import {
  CreateStoreBodySchema,
  NearbyStoresQuerySchema,
  StoreListResponseSchema,
  SingleStoreResponseSchema,
} from './stores.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const storesRoutes: FastifyPluginAsync = async (fastify) => {
  const storesService = new StoresService(fastify.prisma);
  const storesController = new StoresController(storesService);

  // POST /api/v1/stores (Protected: VENDOR, SUPER_ADMIN)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Stores'],
        summary: 'Register a new store (Vendor/Admin)',
        security: [{ bearerAuth: [] }],
        body: CreateStoreBodySchema,
        response: {
          201: SingleStoreResponseSchema,
        },
      },
    },
    storesController.createStoreHandler
  );

  // GET /api/v1/stores/nearby (Public: Spatial search by lat/lng/radius)
  fastify.get(
    '/nearby',
    {
      schema: {
        tags: ['Stores'],
        summary: 'Find nearby stores within radius (km)',
        querystring: NearbyStoresQuerySchema,
        response: {
          200: StoreListResponseSchema,
        },
      },
    },
    storesController.findNearbyStoresHandler
  );

  // GET /api/v1/stores/slug/:slug (Public: Micro-website storefront)
  fastify.get(
    '/slug/:slug',
    {
      schema: {
        tags: ['Stores'],
        summary: 'Get store storefront by URL slug (Micro-website)',
        params: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
          },
        },
        response: {
          200: SingleStoreResponseSchema,
        },
      },
    },
    storesController.getStoreBySlugHandler
  );

  // GET /api/v1/stores/:id (Public: Get store detail by ID)
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Stores'],
        summary: 'Get store details and catalog',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: SingleStoreResponseSchema,
        },
      },
    },
    storesController.getStoreByIdHandler
  );
};
