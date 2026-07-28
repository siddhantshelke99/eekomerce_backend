import { PrismaClient, ReservationStatus } from '@prisma/client';
import { CreateReservationBody } from './reservations.schema.js';
import { AppError, NotFoundError, ForbiddenError } from '../../common/errors/app-error.js';
import { MailService } from '../../common/services/mail.service.js';
import { MessagingService } from '../../common/services/sms.service.js';

export class ReservationsService {
  private mailService = new MailService();
  private messagingService = new MessagingService();

  constructor(private prisma: PrismaClient) {}

  private generateReservationCode(): string {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RES-${randomHex}`;
  }

  async createReservation(userId: string, input: CreateReservationBody) {
    const qty = input.quantity ?? 1;

    // 1. Fetch inventory item with store & product
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
      include: {
        store: true,
        product: true,
      },
    });

    if (!inventoryItem || !inventoryItem.isAvailable) {
      throw new NotFoundError('Item is not available for reservation', 'ITEM_UNAVAILABLE');
    }

    if (inventoryItem.stockQuantity < qty) {
      throw new AppError(
        `Insufficient stock. Only ${inventoryItem.stockQuantity} units available.`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    // 2. Fetch customer details
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // 3. Set 2-Hour Hold Expiration
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + TWO_HOURS_MS);
    const reservationCode = this.generateReservationCode();

    // 4. Create Reservation in Database
    const reservation = await this.prisma.reservation.create({
      data: {
        reservationCode,
        userId,
        storeId: inventoryItem.storeId,
        inventoryItemId: inventoryItem.id,
        quantity: qty,
        status: 'CONFIRMED',
        expiresAt,
        notes: input.notes ?? null,
      },
      include: {
        store: true,
        inventoryItem: {
          include: {
            product: true,
          },
        },
      },
    });

    // 5. Trigger Transactional Email & SMS Notifications
    void this.mailService.sendReservationReceipt(user.email, {
      reservationCode,
      productName: inventoryItem.product.name,
      storeName: inventoryItem.store.name,
      storeAddress: inventoryItem.store.address,
      expiresAt: expiresAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      localPrice: `₹${inventoryItem.localPrice}`,
    });

    void this.messagingService.sendSms({
      toPhoneNumber: inventoryItem.store.phone,
      message: `[PROJECT LOCAL ALERT] New 2-hour reservation! Code: ${reservationCode} for ${inventoryItem.product.name} (Qty: ${qty}).`,
    });

    return {
      ...reservation,
      createdAt: reservation.createdAt.toISOString(),
      expiresAt: reservation.expiresAt.toISOString(),
    };
  }

  async getUserReservations(userId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId },
      include: {
        store: true,
        inventoryItem: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservations.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));
  }

  async getStoreReservations(userId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.ownerId !== userId) {
      throw new ForbiddenError('Unauthorized access to store reservations', 'FORBIDDEN');
    }

    const reservations = await this.prisma.reservation.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inventoryItem: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservations.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));
  }

  async updateReservationStatus(_userId: string, reservationId: string, status: ReservationStatus) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { store: true, inventoryItem: true },
    });

    if (!reservation) {
      throw new NotFoundError('Reservation not found', 'RESERVATION_NOT_FOUND');
    }

    // If customer collecting item in store, decrement inventory stock quantity
    if (status === 'COLLECTED' && reservation.status !== 'COLLECTED') {
      await this.prisma.inventoryItem.update({
        where: { id: reservation.inventoryItemId },
        data: {
          stockQuantity: {
            decrement: reservation.quantity,
          },
        },
      });
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
      include: {
        store: true,
        inventoryItem: { include: { product: true } },
      },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      expiresAt: updated.expiresAt.toISOString(),
    };
  }
}
