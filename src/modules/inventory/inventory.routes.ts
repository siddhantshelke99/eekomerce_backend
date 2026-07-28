import { FastifyPluginAsync } from 'fastify';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import {
  UpsertInventoryBodySchema,
  NearbyInventoryQuerySchema,
  InventoryListResponseSchema,
} from './inventory.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  const inventoryService = new InventoryService(fastify.prisma);
  const inventoryController = new InventoryController(inventoryService);

  // POST /api/v1/inventory (Protected: VENDOR, SUPER_ADMIN)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Inventory'],
        summary: 'Add or update store local inventory and pricing',
        body: UpsertInventoryBodySchema,
      },
    },
    inventoryController.upsertInventoryHandler
  );

  // GET /api/v1/inventory/nearby (Public: Find local stock near user coordinates)
  fastify.get(
    '/nearby',
    {
      schema: {
        tags: ['Inventory'],
        summary: 'Discover physical product inventory available near user location',
        querystring: NearbyInventoryQuerySchema,
        response: {
          200: InventoryListResponseSchema,
        },
      },
    },
    inventoryController.findNearbyInventoryHandler
  );
};
