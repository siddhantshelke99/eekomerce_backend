import { FastifyPluginAsync } from 'fastify';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import {
  CreateOrderBodySchema,
  UpdateOrderStatusBodySchema,
  OrderListResponseSchema,
  SingleOrderResponseSchema,
} from './orders.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  const ordersService = new OrdersService(fastify.prisma);
  const ordersController = new OrdersController(ordersService);

  // POST /api/v1/orders (Protected: CUSTOMER, VENDOR, SUPER_ADMIN)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Orders'],
        summary: 'Place order for Pickup or 60-min Local Delivery',
        security: [{ bearerAuth: [] }],
        body: CreateOrderBodySchema,
        response: {
          201: SingleOrderResponseSchema,
        },
      },
    },
    ordersController.createOrderHandler
  );

  // GET /api/v1/orders/me (Protected: CUSTOMER)
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Orders'],
        summary: 'Get customer order history',
        security: [{ bearerAuth: [] }],
        response: {
          200: OrderListResponseSchema,
        },
      },
    },
    ordersController.getUserOrdersHandler
  );

  // GET /api/v1/orders/store/:storeId (Protected: VENDOR, SUPER_ADMIN)
  fastify.get(
    '/store/:storeId',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Orders'],
        summary: 'Get store orders for vendor fulfillment',
        security: [{ bearerAuth: [] }],
        response: {
          200: OrderListResponseSchema,
        },
      },
    },
    ordersController.getStoreOrdersHandler
  );

  // PATCH /api/v1/orders/:id/status (Protected: VENDOR, SUPER_ADMIN)
  fastify.patch(
    '/:id/status',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Orders'],
        summary: 'Update order status (DISPATCHED, DELIVERED, CANCELLED)',
        security: [{ bearerAuth: [] }],
        body: UpdateOrderStatusBodySchema,
        response: {
          200: SingleOrderResponseSchema,
        },
      },
    },
    ordersController.updateOrderStatusHandler
  );
};
