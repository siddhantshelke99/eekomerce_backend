import { FastifyPluginAsync } from 'fastify';
import { RequestsService } from './requests.service.js';
import { RequestsController } from './requests.controller.js';
import {
  CreateProductRequestSchema,
  CreateVendorQuoteSchema,
  ProductRequestListResponseSchema,
  SingleProductRequestResponseSchema,
} from './requests.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const requestsRoutes: FastifyPluginAsync = async (fastify) => {
  const requestsService = new RequestsService(fastify.prisma);
  const requestsController = new RequestsController(requestsService);

  // POST /api/v1/requests (Protected: CUSTOMER, VENDOR, SUPER_ADMIN)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Requests'],
        summary: 'Submit an "Ask Nearby Stores" broadcast request',
        security: [{ bearerAuth: [] }],
        body: CreateProductRequestSchema,
        response: {
          201: SingleProductRequestResponseSchema,
        },
      },
    },
    requestsController.createProductRequestHandler
  );

  // GET /api/v1/requests/me (Protected: CUSTOMER)
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Requests'],
        summary: 'Get customer submitted requests and vendor quotes',
        security: [{ bearerAuth: [] }],
        response: {
          200: ProductRequestListResponseSchema,
        },
      },
    },
    requestsController.getCustomerRequestsHandler
  );

  // GET /api/v1/requests/vendor/:storeId (Protected: VENDOR, SUPER_ADMIN)
  fastify.get(
    '/vendor/:storeId',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Requests'],
        summary: 'Get open customer requests near vendor store',
        security: [{ bearerAuth: [] }],
      },
    },
    requestsController.getNearbyRequestsForVendorHandler
  );

  // POST /api/v1/requests/:id/quote (Protected: VENDOR, SUPER_ADMIN)
  fastify.post(
    '/:id/quote',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Requests'],
        summary: 'Submit vendor price quote for a customer request',
        security: [{ bearerAuth: [] }],
        body: CreateVendorQuoteSchema,
      },
    },
    requestsController.submitVendorQuoteHandler
  );
};
