import { FastifyPluginAsync } from 'fastify';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';
import {
  TrackSearchBodySchema,
  DemandIntelligenceResponseSchema,
} from './analytics.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const analyticsService = new AnalyticsService(fastify.prisma);
  const analyticsController = new AnalyticsController(analyticsService);

  // POST /api/v1/analytics/track-search (Public: Log customer search query)
  fastify.post(
    '/track-search',
    {
      schema: {
        tags: ['Analytics'],
        summary: 'Log local customer product search for Demand Intelligence',
        body: TrackSearchBodySchema,
      },
    },
    analyticsController.trackSearchHandler
  );

  // GET /api/v1/analytics/vendor-demand/:storeId (Protected: VENDOR, SUPER_ADMIN)
  fastify.get(
    '/vendor-demand/:storeId',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Analytics'],
        summary: 'Get Demand Intelligence search insights near shop',
        security: [{ bearerAuth: [] }],
        response: {
          200: DemandIntelligenceResponseSchema,
        },
      },
    },
    analyticsController.getVendorDemandInsightsHandler
  );
};
