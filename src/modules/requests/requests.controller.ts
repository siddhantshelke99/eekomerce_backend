import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateProductRequest, CreateVendorQuote } from './requests.schema.js';
import { RequestsService } from './requests.service.js';

export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  createProductRequestHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const body = request.body as CreateProductRequest;
    const prodReq = await this.requestsService.createProductRequest(userId, body);

    return reply.status(201).send({
      success: true,
      data: prodReq,
    });
  };

  getCustomerRequestsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const requests = await this.requestsService.getCustomerRequests(userId);

    return reply.status(200).send({
      success: true,
      data: requests,
    });
  };

  getNearbyRequestsForVendorHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const params = request.params as { storeId: string };
    const requests = await this.requestsService.getNearbyRequestsForVendor(userId, params.storeId);

    return reply.status(200).send({
      success: true,
      data: requests,
    });
  };

  submitVendorQuoteHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const params = request.params as { id: string };
    const body = request.body as CreateVendorQuote;
    const quote = await this.requestsService.submitVendorQuote(userId, params.id, body);

    return reply.status(200).send({
      success: true,
      data: quote,
    });
  };
}
