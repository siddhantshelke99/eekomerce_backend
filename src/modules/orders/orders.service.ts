import { PrismaClient, OrderStatus } from '@prisma/client';
import { CreateOrderBody } from './orders.schema.js';
import { AppError, NotFoundError, ForbiddenError } from '../../common/errors/app-error.js';
import { MailService } from '../../common/services/mail.service.js';
import { MessagingService } from '../../common/services/sms.service.js';

export class OrdersService {
  private mailService = new MailService();
  private messagingService = new MessagingService();

  constructor(private prisma: PrismaClient) {}

  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  private generateOrderNumber(): string {
    return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  async createOrder(userId: string, input: CreateOrderBody) {
    const store = await this.prisma.store.findUnique({ where: { id: input.storeId } });
    if (!store) {
      throw new NotFoundError('Store not found', 'STORE_NOT_FOUND');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // Calculate Delivery Fee
    let deliveryFee = 0;
    if (input.fulfillmentType === 'LOCAL_DELIVERY') {
      if (!input.deliveryAddress) {
        throw new AppError('Delivery address is required for 60-min local delivery', 400, 'ADDRESS_REQUIRED');
      }

      if (input.userLatitude && input.userLongitude) {
        const distanceKm = this.calculateDistanceKm(
          input.userLatitude,
          input.userLongitude,
          store.latitude,
          store.longitude
        );
        deliveryFee = 39 + Math.ceil(distanceKm) * 10; // ₹39 base + ₹10 per km
      } else {
        deliveryFee = 49;
      }
    }

    // Validate inventory items & calculate subtotal
    let subtotal = 0;
    const orderItemsData: { inventoryItemId: string; unitPrice: number; quantity: number }[] = [];

    for (const itemInput of input.items) {
      const invItem = await this.prisma.inventoryItem.findUnique({
        where: { id: itemInput.inventoryItemId },
        include: { product: true },
      });

      if (!invItem || !invItem.isAvailable) {
        throw new NotFoundError('One or more items are out of stock', 'ITEM_UNAVAILABLE');
      }

      if (invItem.stockQuantity < itemInput.quantity) {
        throw new AppError(
          `Insufficient stock for ${invItem.product.name}. Available: ${invItem.stockQuantity}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      subtotal += invItem.localPrice * itemInput.quantity;
      orderItemsData.push({
        inventoryItemId: invItem.id,
        unitPrice: invItem.localPrice,
        quantity: itemInput.quantity,
      });

      // Auto-decrement store inventory
      await this.prisma.inventoryItem.update({
        where: { id: invItem.id },
        data: {
          stockQuantity: {
            decrement: itemInput.quantity,
          },
        },
      });
    }

    const totalAmount = subtotal + deliveryFee;
    const orderNumber = this.generateOrderNumber();

    // Create Order with nested items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        storeId: store.id,
        fulfillmentType: input.fulfillmentType,
        deliveryAddress: input.deliveryAddress ?? null,
        deliveryFee,
        totalAmount,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        store: true,
        items: {
          include: {
            inventoryItem: {
              include: { product: true },
            },
          },
        },
      },
    });

    // Send notifications
    void this.mailService.sendWelcomeEmail(user.email, user.name);

    void this.messagingService.sendSms({
      toPhoneNumber: store.phone,
      message: `[NEARRBUY ORDER ALERT] New ${order.fulfillmentType} Order ${orderNumber}! Total: ₹${totalAmount}. Check Vendor Portal to prepare order.`,
    });

    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
    };
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        store: true,
        items: {
          include: {
            inventoryItem: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async getStoreOrders(userId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.ownerId !== userId) {
      throw new ForbiddenError('Unauthorized store access', 'FORBIDDEN');
    }

    const orders = await this.prisma.order.findMany({
      where: { storeId },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            inventoryItem: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async updateOrderStatus(_userId: string, orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        store: true,
        items: {
          include: {
            inventoryItem: {
              include: { product: true },
            },
          },
        },
      },
    });

    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
