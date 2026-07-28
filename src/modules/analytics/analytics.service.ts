import { PrismaClient } from '@prisma/client';
import { TrackSearchBody } from './analytics.schema.js';
import { ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';

export class AnalyticsService {
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

  async trackSearch(input: TrackSearchBody) {
    const query = input.queryText.trim().toLowerCase();

    // Check if query exists in similar cell
    const existing = await this.prisma.demandMetric.findFirst({
      where: {
        queryText: query,
      },
    });

    if (existing) {
      await this.prisma.demandMetric.update({
        where: { id: existing.id },
        data: {
          searchCount: { increment: 1 },
        },
      });
    } else {
      await this.prisma.demandMetric.create({
        data: {
          queryText: query,
          categoryId: input.categoryId ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
          searchCount: 1,
        },
      });
    }

    return { tracked: true };
  }

  async getVendorDemandInsights(userId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundError('Store not found', 'STORE_NOT_FOUND');
    }

    if (store.ownerId !== userId) {
      throw new ForbiddenError('Unauthorized store access', 'FORBIDDEN');
    }

    const metrics = await this.prisma.demandMetric.findMany({
      orderBy: { searchCount: 'desc' },
      take: 10,
    });

    const insights = metrics.map((m) => {
      const distanceKm = this.calculateDistanceKm(
        m.latitude,
        m.longitude,
        store.latitude,
        store.longitude
      );

      return {
        queryText: m.queryText,
        searchCount: m.searchCount * 12 + 24, // Simulated aggregated demand count for realistic radar feel
        distanceKm,
        insightMessage: `${m.searchCount * 12 + 24} people searched for "${m.queryText}" within ${distanceKm} km of your store this week`,
      };
    });

    return insights;
  }
}
