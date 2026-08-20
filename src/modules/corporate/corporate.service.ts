import { PrismaClient } from '@prisma/client';
import { CreateCorporateAuctionBody, SubmitAuctionBidBody } from './corporate.schema.js';
import { NotFoundError } from '../../common/errors/app-error.js';

export class CorporateService {
  constructor(private prisma: PrismaClient) {}

  async createAuction(buyerId: string, input: CreateCorporateAuctionBody) {
    const durationHours = input.durationHours ?? 24;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const auction = await this.prisma.corporateAuction.create({
      data: {
        buyerId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        referenceUrl: input.referenceUrl ?? null,
        quantity: input.quantity,
        targetBudget: input.targetBudget ?? null,
        latitude: input.latitude ?? 12.9784,
        longitude: input.longitude ?? 77.6408,
        radiusKm: input.radiusKm ?? 25.0,
        expiresAt,
      },
      include: {
        category: true,
        buyer: { select: { id: true, name: true, email: true, companyName: true } },
      },
    });

    console.log(`🏷️ [Corporate Auction Created] ${input.title} (Qty: ${input.quantity}, Timer: ${durationHours}h)`);

    return {
      ...auction,
      createdAt: auction.createdAt.toISOString(),
      expiresAt: auction.expiresAt.toISOString(),
    };
  }

  async submitBid(vendorId: string, auctionId: string, input: SubmitAuctionBidBody) {
    const auction = await this.prisma.corporateAuction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundError('Corporate auction not found', 'AUCTION_NOT_FOUND');
    }

    const bid = await this.prisma.auctionBid.upsert({
      where: {
        auctionId_storeId: {
          auctionId,
          storeId: input.storeId,
        },
      },
      update: {
        unitPrice: input.unitPrice,
        lotTotalPrice: input.lotTotalPrice,
        deliveryDays: input.deliveryDays ?? 2,
        notes: input.notes ?? null,
      },
      create: {
        auctionId,
        vendorId,
        storeId: input.storeId,
        unitPrice: input.unitPrice,
        lotTotalPrice: input.lotTotalPrice,
        deliveryDays: input.deliveryDays ?? 2,
        notes: input.notes ?? null,
      },
      include: {
        store: { select: { name: true, address: true, phone: true } },
      },
    });

    console.log(`⚡ [Auction Bid Received] Vendor ${vendorId} submitted lot quote ₹${input.lotTotalPrice} for Auction #${auctionId}`);

    return {
      ...bid,
      createdAt: bid.createdAt.toISOString(),
    };
  }

  async getAuctions() {
    const auctions = await this.prisma.corporateAuction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        buyer: { select: { name: true, companyName: true } },
        bids: {
          orderBy: { lotTotalPrice: 'asc' },
          include: {
            store: { select: { name: true, address: true, phone: true, isVerified: true } },
          },
        },
      },
    });

    return auctions.map((auc) => ({
      ...auc,
      createdAt: auc.createdAt.toISOString(),
      expiresAt: auc.expiresAt.toISOString(),
      lowestBid: auc.bids.length > 0 ? auc.bids[0].lotTotalPrice : null,
    }));
  }
}
