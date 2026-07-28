import { FastifyReply, FastifyRequest } from 'fastify';
import { UpsertInventoryBody, NearbyInventoryQuery } from './inventory.schema.js';
import { InventoryService } from './inventory.service.js';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  upsertInventoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const userRole = request.user.role;
    const body = request.body as UpsertInventoryBody;
    const item = await this.inventoryService.upsertInventoryItem(userId, userRole, body);

    return reply.status(200).send({
      success: true,
      data: item,
    });
  };

  findNearbyInventoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as NearbyInventoryQuery;
    const items = await this.inventoryService.findNearbyInventory(query);

    return reply.status(200).send({
      success: true,
      data: items,
    });
  };
}
