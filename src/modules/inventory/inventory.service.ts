import { PrismaClient } from '@prisma/client';
import { UpsertInventoryBody, NearbyInventoryQuery } from './inventory.schema.js';
import { ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';

export class InventoryService {
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

  async upsertInventoryItem(userId: string, userRole: string, input: UpsertInventoryBody) {
    const store = await this.prisma.store.findUnique({
      where: { id: input.storeId },
    });

    if (!store) {
      throw new NotFoundError('Store not found', 'STORE_NOT_FOUND');
    }

    if (userRole !== 'SUPER_ADMIN' && store.ownerId !== userId) {
      throw new ForbiddenError('You do not own this store', 'FORBIDDEN_STORE_ACCESS');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const inventoryItem = await this.prisma.inventoryItem.upsert({
      where: {
        storeId_productId_variantId: {
          storeId: input.storeId,
          productId: input.productId,
          variantId: input.variantId ?? '',
        },
      },
      update: {
        localPrice: input.localPrice,
        comparePrice: input.comparePrice ?? null,
        stockQuantity: input.stockQuantity,
        isAvailable: input.isAvailable ?? true,
        activeOffer: input.activeOffer ?? null,
        lastStockUpdate: new Date(),
      },
      create: {
        storeId: input.storeId,
        productId: input.productId,
        variantId: input.variantId ?? null,
        localPrice: input.localPrice,
        comparePrice: input.comparePrice ?? null,
        stockQuantity: input.stockQuantity,
        isAvailable: input.isAvailable ?? true,
        activeOffer: input.activeOffer ?? null,
      },
      include: {
        store: true,
        product: true,
      },
    });

    return {
      ...inventoryItem,
      lastStockUpdate: inventoryItem.lastStockUpdate.toISOString(),
    };
  }

  async findNearbyInventory(query: NearbyInventoryQuery) {
    const radius = query.radius ?? 5.0;

    const whereProduct: any = {};
    if (query.categoryId) {
      whereProduct.categoryId = query.categoryId;
    }
    if (query.search) {
      whereProduct.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.inventoryItem.findMany({
      where: {
        isAvailable: true,
        stockQuantity: { gt: 0 },
        product: Object.keys(whereProduct).length > 0 ? whereProduct : undefined,
      },
      include: {
        store: true,
        product: true,
      },
    });

    const nearbyItems = items
      .map((item) => {
        const distanceKm = this.calculateDistanceKm(
          query.lat,
          query.lng,
          item.store.latitude,
          item.store.longitude
        );
        return {
          ...item,
          lastStockUpdate: item.lastStockUpdate.toISOString(),
          store: {
            ...item.store,
            distanceKm,
          },
        };
      })
      .filter((item) => item.store.distanceKm <= radius)
      .sort((a, b) => a.store.distanceKm - b.store.distanceKm);

    return nearbyItems;
  }
}
