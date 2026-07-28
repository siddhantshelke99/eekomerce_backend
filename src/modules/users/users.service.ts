import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../common/errors/app-error.js';

export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found', 'USER_NOT_FOUND');
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
