import { PrismaClient } from '@prisma/client';
import { CreateStoreBody, NearbyStoresQuery } from './stores.schema.js';
import { NotFoundError } from '../../common/errors/app-error.js';

export class StoresService {
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

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async createStore(ownerId: string, input: CreateStoreBody) {
    const baseSlug = this.slugify(input.name);
    const existingSlug = await this.prisma.store.findUnique({
      where: { slug: baseSlug },
    });

    const slug = existingSlug
      ? `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`
      : baseSlug;

    const store = await this.prisma.store.create({
      data: {
        ownerId,
        name: input.name,
        slug,
        description: input.description ?? null,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusKm: input.radiusKm ?? 5.0,
        phone: input.phone,
        email: input.email ?? null,
        openingTime: input.openingTime ?? '09:00',
        closingTime: input.closingTime ?? '21:00',
        supportsPickup: input.supportsPickup ?? true,
        supportsDelivery: input.supportsDelivery ?? true,
      },
    });

    return {
      ...store,
      createdAt: store.createdAt.toISOString(),
    };
  }

  async findNearbyStores(query: NearbyStoresQuery) {
    const radius = query.radius ?? 5.0;

    const allStores = await this.prisma.store.findMany();

    const nearbyStores = allStores
      .map((store) => {
        const distanceKm = this.calculateDistanceKm(
          query.lat,
          query.lng,
          store.latitude,
          store.longitude
        );
        return {
          ...store,
          distanceKm,
          createdAt: store.createdAt.toISOString(),
        };
      })
      .filter((store) => store.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearbyStores;
  }

  async getStoreById(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        inventoryItems: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store not found', 'STORE_NOT_FOUND');
    }

    return {
      ...store,
      createdAt: store.createdAt.toISOString(),
    };
  }

  async getStoreBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        owner: { select: { name: true, email: true } },
        inventoryItems: {
          where: { isAvailable: true },
          include: {
            product: {
              include: { category: true },
            },
            variant: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store storefront not found', 'STORE_NOT_FOUND');
    }

    return {
      ...store,
      createdAt: store.createdAt.toISOString(),
    };
  }
}
