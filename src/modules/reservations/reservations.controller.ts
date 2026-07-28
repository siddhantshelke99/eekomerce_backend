import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateReservationBody, UpdateReservationStatusBody } from './reservations.schema.js';
import { ReservationsService } from './reservations.service.js';

export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  createReservationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const body = request.body as CreateReservationBody;
    const reservation = await this.reservationsService.createReservation(userId, body);

    return reply.status(201).send({
      success: true,
      data: reservation,
    });
  };

  getUserReservationsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const reservations = await this.reservationsService.getUserReservations(userId);

    return reply.status(200).send({
      success: true,
      data: reservations,
    });
  };

  getStoreReservationsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const params = request.params as { storeId: string };
    const reservations = await this.reservationsService.getStoreReservations(userId, params.storeId);

    return reply.status(200).send({
      success: true,
      data: reservations,
    });
  };

  updateReservationStatusHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const params = request.params as { id: string };
    const body = request.body as UpdateReservationStatusBody;
    const reservation = await this.reservationsService.updateReservationStatus(userId, params.id, body.status);

    return reply.status(200).send({
      success: true,
      data: reservation,
    });
  };
}
