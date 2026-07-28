import { FastifyReply, FastifyRequest } from 'fastify';
import { UsersService } from './users.service.js';

export class UsersController {
  constructor(private usersService: UsersService) {}

  getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.sub;
    const userProfile = await this.usersService.getUserProfile(userId);

    return reply.status(200).send({
      success: true,
      data: userProfile,
    });
  };
}
