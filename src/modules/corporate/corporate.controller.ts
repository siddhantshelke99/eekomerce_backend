import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateCorporateAuctionBody, SubmitAuctionBidBody } from './corporate.schema.js';
import { CorporateService } from './corporate.service.js';

export class CorporateController {
  constructor(private corporateService: CorporateService) {}

  createAuctionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const buyerId = request.user.sub;
    const body = request.body as CreateCorporateAuctionBody;
    const result = await this.corporateService.createAuction(buyerId, body);

    return reply.status(201).send({
      success: true,
      data: result,
    });
  };

  submitBidHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const vendorId = request.user.sub;
    const params = request.params as { id: string };
    const body = request.body as SubmitAuctionBidBody;
    const result = await this.corporateService.submitBid(vendorId, params.id, body);

    return reply.status(201).send({
      success: true,
      data: result,
    });
  };

  getAuctionsHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.corporateService.getAuctions();

    return reply.status(200).send({
      success: true,
      data: result,
    });
  };
}
