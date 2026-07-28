import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateOrderBody, UpdateOrderStatusBody } from './orders.schema.js';
import { OrdersService } from './orders.service.js';

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  createOrderHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const body = request.body as CreateOrderBody;
    const order = await this.ordersService.createOrder(userId, body);

    return reply.status(201).send({
      success: true,
      data: order,
    });
  };

  getUserOrdersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const orders = await this.ordersService.getUserOrders(userId);

    return reply.status(200).send({
      success: true,
      data: orders,
    });
  };

  getStoreOrdersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const params = request.params as { storeId: string };
    const orders = await this.ordersService.getStoreOrders(userId, params.storeId);

    return reply.status(200).send({
      success: true,
      data: orders,
    });
  };

  updateOrderStatusHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const params = request.params as { id: string };
    const body = request.body as UpdateOrderStatusBody;
    const order = await this.ordersService.updateOrderStatus(userId, params.id, body.status);

    return reply.status(200).send({
      success: true,
      data: order,
    });
  };
}
