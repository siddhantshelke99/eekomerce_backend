import { FastifyReply, FastifyRequest } from 'fastify';
import { TrackSearchBody } from './analytics.schema.js';
import { AnalyticsService } from './analytics.service.js';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  trackSearchHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as TrackSearchBody;
    await this.analyticsService.trackSearch(body);

    return reply.status(200).send({
      success: true,
    });
  };

  getVendorDemandInsightsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const params = request.params as { storeId: string };
    const insights = await this.analyticsService.getVendorDemandInsights(userId, params.storeId);

    return reply.status(200).send({
      success: true,
      data: insights,
    });
  };
}
