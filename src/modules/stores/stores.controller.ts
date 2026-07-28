import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateStoreBody, NearbyStoresQuery } from './stores.schema.js';
import { StoresService } from './stores.service.js';

export class StoresController {
  constructor(private storesService: StoresService) {}

  createStoreHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const ownerId = request.user.sub;
    const body = request.body as CreateStoreBody;
    const store = await this.storesService.createStore(ownerId, body);

    return reply.status(201).send({
      success: true,
      data: store,
    });
  };

  findNearbyStoresHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as NearbyStoresQuery;
    const stores = await this.storesService.findNearbyStores(query);

    return reply.status(200).send({
      success: true,
      data: stores,
    });
  };

  getStoreByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id: string };
    const store = await this.storesService.getStoreById(params.id);

    return reply.status(200).send({
      success: true,
      data: store,
    });
  };

  getStoreBySlugHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { slug: string };
    const store = await this.storesService.getStoreBySlug(params.slug);

    return reply.status(200).send({
      success: true,
      data: store,
    });
  };
}
