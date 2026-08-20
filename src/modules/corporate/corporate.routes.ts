import { FastifyPluginAsync } from 'fastify';
import { CorporateService } from './corporate.service.js';
import { CorporateController } from './corporate.controller.js';
import { CreateCorporateAuctionSchema, SubmitAuctionBidSchema } from './corporate.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const corporateRoutes: FastifyPluginAsync = async (fastify) => {
  const corporateService = new CorporateService(fastify.prisma);
  const corporateController = new CorporateController(corporateService);

  // POST /api/v1/corporate/auctions (Protected: CUSTOMER, VENDOR, SUPER_ADMIN, CORPORATE_BUYER)
  fastify.post(
    '/auctions',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Corporate Gifting'],
        summary: 'Submit a new Corporate Bulk Gifting Reverse Auction request',
        security: [{ bearerAuth: [] }],
        body: CreateCorporateAuctionSchema,
      },
    },
    corporateController.createAuctionHandler
  );

  // POST /api/v1/corporate/auctions/:id/bid (Protected: VENDOR, SUPER_ADMIN)
  fastify.post(
    '/auctions/:id/bid',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Corporate Gifting'],
        summary: 'Submit a vendor quote/bid for a corporate bulk gifting auction',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: SubmitAuctionBidSchema,
      },
    },
    corporateController.submitBidHandler
  );

  // GET /api/v1/corporate/auctions (Public: View active reverse auctions & bids)
  fastify.get(
    '/auctions',
    {
      schema: {
        tags: ['Corporate Gifting'],
        summary: 'List active corporate reverse auctions and bids leaderboard',
      },
    },
    corporateController.getAuctionsHandler
  );
};
