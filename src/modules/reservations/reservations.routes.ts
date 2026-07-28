import { FastifyPluginAsync } from 'fastify';
import { ReservationsService } from './reservations.service.js';
import { ReservationsController } from './reservations.controller.js';
import {
  CreateReservationBodySchema,
  UpdateReservationStatusBodySchema,
  ReservationListResponseSchema,
  SingleReservationResponseSchema,
} from './reservations.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const reservationsRoutes: FastifyPluginAsync = async (fastify) => {
  const reservationsService = new ReservationsService(fastify.prisma);
  const reservationsController = new ReservationsController(reservationsService);

  // POST /api/v1/reservations (Protected: CUSTOMER, VENDOR, SUPER_ADMIN)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Reservations'],
        summary: 'Reserve item for 2-hour hold at local store',
        security: [{ bearerAuth: [] }],
        body: CreateReservationBodySchema,
        response: {
          201: SingleReservationResponseSchema,
        },
      },
    },
    reservationsController.createReservationHandler
  );

  // GET /api/v1/reservations/me (Protected: CUSTOMER)
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Reservations'],
        summary: 'Get current customer reservations',
        security: [{ bearerAuth: [] }],
        response: {
          200: ReservationListResponseSchema,
        },
      },
    },
    reservationsController.getUserReservationsHandler
  );

  // GET /api/v1/reservations/store/:storeId (Protected: VENDOR, SUPER_ADMIN)
  fastify.get(
    '/store/:storeId',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Reservations'],
        summary: 'Get store reservations for vendor fulfillment',
        security: [{ bearerAuth: [] }],
        response: {
          200: ReservationListResponseSchema,
        },
      },
    },
    reservationsController.getStoreReservationsHandler
  );

  // PATCH /api/v1/reservations/:id/status (Protected: VENDOR, SUPER_ADMIN)
  fastify.patch(
    '/:id/status',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Reservations'],
        summary: 'Update reservation status (COLLECTED, CANCELLED)',
        security: [{ bearerAuth: [] }],
        body: UpdateReservationStatusBodySchema,
        response: {
          200: SingleReservationResponseSchema,
        },
      },
    },
    reservationsController.updateReservationStatusHandler
  );
};
