import { PrismaClient } from '@prisma/client';
import { CreateProductRequest, CreateVendorQuote } from './requests.schema.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/app-error.js';
import { MessagingService } from '../../common/services/sms.service.js';

export class RequestsService {
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

  async createProductRequest(userId: string, input: CreateProductRequest) {
    const radius = input.radiusKm ?? 5.0;

    const request = await this.prisma.productRequest.create({
      data: {
        userId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        externalUrl: input.externalUrl ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusKm: radius,
        status: 'OPEN',
      },
    });

    // Spatial broadcast: Notify all shopkeepers within radius
    const allStores = await this.prisma.store.findMany();
    const nearbyStores = allStores.filter(
      (store) =>
        this.calculateDistanceKm(input.latitude, input.longitude, store.latitude, store.longitude) <= radius
    );

    for (const store of nearbyStores) {
      void this.messagingService.sendSms({
        toPhoneNumber: store.phone,
        message: `[ASK NEARBY STORES] A customer near you is asking for: "${input.title}". Open your Vendor Portal to respond with your price!`,
      });
    }

    return {
      ...request,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async getCustomerRequests(userId: string) {
    const requests = await this.prisma.productRequest.findMany({
      where: { userId },
      include: {
        category: true,
        quotes: {
          include: {
            store: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => ({
      ...req,
      createdAt: req.createdAt.toISOString(),
      quotes: req.quotes.map((q) => ({
        ...q,
        createdAt: q.createdAt.toISOString(),
        store: {
          ...q.store,
          distanceKm: this.calculateDistanceKm(req.latitude, req.longitude, q.store.latitude, q.store.longitude),
        },
      })),
    }));
  }

  async getNearbyRequestsForVendor(userId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.ownerId !== userId) {
      throw new ForbiddenError('Unauthorized store access', 'FORBIDDEN');
    }

    const openRequests = await this.prisma.productRequest.findMany({
      where: { status: 'OPEN' },
      include: {
        category: true,
        quotes: {
          where: { storeId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const nearbyRequests = openRequests
      .map((req) => {
        const distanceKm = this.calculateDistanceKm(
          req.latitude,
          req.longitude,
          store.latitude,
          store.longitude
        );
        return {
          ...req,
          distanceKm,
          createdAt: req.createdAt.toISOString(),
        };
      })
      .filter((req) => req.distanceKm <= req.radiusKm);

    return nearbyRequests;
  }

  async submitVendorQuote(userId: string, requestId: string, input: CreateVendorQuote) {
    const store = await this.prisma.store.findUnique({ where: { id: input.storeId } });
    if (!store || store.ownerId !== userId) {
      throw new ForbiddenError('Unauthorized store access', 'FORBIDDEN');
    }

    const request = await this.prisma.productRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundError('Product request not found', 'REQUEST_NOT_FOUND');
    }

    const quote = await this.prisma.vendorQuote.upsert({
      where: {
        requestId_storeId: {
          requestId,
          storeId: input.storeId,
        },
      },
      update: {
        isAvailable: input.isAvailable ?? true,
        offeredPrice: input.offeredPrice ?? null,
        availableQuantity: input.availableQuantity ?? 1,
        notes: input.notes ?? null,
      },
      create: {
        requestId,
        storeId: input.storeId,
        isAvailable: input.isAvailable ?? true,
        offeredPrice: input.offeredPrice ?? null,
        availableQuantity: input.availableQuantity ?? 1,
        notes: input.notes ?? null,
      },
      include: {
        store: true,
      },
    });

    return {
      ...quote,
      createdAt: quote.createdAt.toISOString(),
    };
  }
}
