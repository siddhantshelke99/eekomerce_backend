import { Type, Static } from '@sinclair/typebox';

export const UpsertInventoryBodySchema = Type.Object(
  {
    storeId: Type.String({ format: 'uuid' }),
    productId: Type.String({ format: 'uuid' }),
    variantId: Type.Optional(Type.String({ format: 'uuid' })),
    localPrice: Type.Number({ minimum: 0 }),
    comparePrice: Type.Optional(Type.Number({ minimum: 0 })),
    stockQuantity: Type.Number({ minimum: 0 }),
    isAvailable: Type.Optional(Type.Boolean({ default: true })),
    activeOffer: Type.Optional(Type.String()),
  },
  { additionalProperties: false }
);

export type UpsertInventoryBody = Static<typeof UpsertInventoryBodySchema>;

export const NearbyInventoryQuerySchema = Type.Object(
  {
    lat: Type.Number({ minimum: -90, maximum: 90 }),
    lng: Type.Number({ minimum: -180, maximum: 180 }),
    radius: Type.Optional(Type.Number({ minimum: 0.5, maximum: 50, default: 5.0 })),
    search: Type.Optional(Type.String()),
    categoryId: Type.Optional(Type.String({ format: 'uuid' })),
  },
  { additionalProperties: false }
);

export type NearbyInventoryQuery = Static<typeof NearbyInventoryQuerySchema>;

export const InventoryItemResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  storeId: Type.String({ format: 'uuid' }),
  productId: Type.String({ format: 'uuid' }),
  localPrice: Type.Number(),
  comparePrice: Type.Union([Type.Number(), Type.Null()]),
  stockQuantity: Type.Number(),
  isAvailable: Type.Boolean(),
  activeOffer: Type.Union([Type.String(), Type.Null()]),
  lastStockUpdate: Type.String({ format: 'date-time' }),
  store: Type.Optional(
    Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
      address: Type.String(),
      latitude: Type.Number(),
      longitude: Type.Number(),
      distanceKm: Type.Optional(Type.Number()),
      phone: Type.String(),
    })
  ),
  product: Type.Optional(
    Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
      brand: Type.String(),
      imageUrl: Type.Union([Type.String(), Type.Null()]),
    })
  ),
});

export const InventoryListResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(InventoryItemResponseSchema),
});
