import { Type, Static } from '@sinclair/typebox';

export const CreateCorporateAuctionSchema = Type.Object(
  {
    categoryId: Type.String({ format: 'uuid' }),
    title: Type.String({ minLength: 5, maxLength: 200 }),
    description: Type.Optional(Type.String({ maxLength: 1000 })),
    imageUrl: Type.Optional(Type.String()),
    referenceUrl: Type.Optional(Type.String()),
    quantity: Type.Number({ minimum: 1 }),
    targetBudget: Type.Optional(Type.Number({ minimum: 0 })),
    latitude: Type.Optional(Type.Number({ default: 12.9784 })),
    longitude: Type.Optional(Type.Number({ default: 77.6408 })),
    radiusKm: Type.Optional(Type.Number({ default: 25.0 })),
    durationHours: Type.Optional(Type.Number({ minimum: 1, maximum: 168, default: 24 })),
  },
  { additionalProperties: false }
);

export type CreateCorporateAuctionBody = Static<typeof CreateCorporateAuctionSchema>;

export const SubmitAuctionBidSchema = Type.Object(
  {
    storeId: Type.String({ format: 'uuid' }),
    unitPrice: Type.Number({ minimum: 0 }),
    lotTotalPrice: Type.Number({ minimum: 0 }),
    deliveryDays: Type.Optional(Type.Number({ minimum: 1, default: 2 })),
    notes: Type.Optional(Type.String({ maxLength: 500 })),
  },
  { additionalProperties: false }
);

export type SubmitAuctionBidBody = Static<typeof SubmitAuctionBidSchema>;
