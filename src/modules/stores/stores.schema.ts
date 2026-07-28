import { Type, Static } from '@sinclair/typebox';

export const CreateStoreBodySchema = Type.Object(
  {
    name: Type.String({ minLength: 2, maxLength: 100 }),
    description: Type.Optional(Type.String({ maxLength: 500 })),
    address: Type.String({ minLength: 5 }),
    latitude: Type.Number({ minimum: -90, maximum: 90 }),
    longitude: Type.Number({ minimum: -180, maximum: 180 }),
    radiusKm: Type.Optional(Type.Number({ minimum: 0.5, maximum: 50, default: 5.0 })),
    phone: Type.String({ minLength: 7, maxLength: 20 }),
    email: Type.Optional(Type.String({ format: 'email' })),
    openingTime: Type.Optional(Type.String({ default: '09:00' })),
    closingTime: Type.Optional(Type.String({ default: '21:00' })),
    supportsPickup: Type.Optional(Type.Boolean({ default: true })),
    supportsDelivery: Type.Optional(Type.Boolean({ default: true })),
  },
  { additionalProperties: false }
);

export type CreateStoreBody = Static<typeof CreateStoreBodySchema>;

export const NearbyStoresQuerySchema = Type.Object(
  {
    lat: Type.Number({ minimum: -90, maximum: 90 }),
    lng: Type.Number({ minimum: -180, maximum: 180 }),
    radius: Type.Optional(Type.Number({ minimum: 0.5, maximum: 50, default: 5.0 })),
  },
  { additionalProperties: false }
);

export type NearbyStoresQuery = Static<typeof NearbyStoresQuerySchema>;

export const StoreResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  ownerId: Type.String({ format: 'uuid' }),
  name: Type.String(),
  slug: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  address: Type.String(),
  latitude: Type.Number(),
  longitude: Type.Number(),
  distanceKm: Type.Optional(Type.Number()),
  radiusKm: Type.Number(),
  phone: Type.String(),
  email: Type.Union([Type.String(), Type.Null()]),
  isVerified: Type.Boolean(),
  openingTime: Type.String(),
  closingTime: Type.String(),
  supportsPickup: Type.Boolean(),
  supportsDelivery: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
});

export const StoreListResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(StoreResponseSchema),
});

export const SingleStoreResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: StoreResponseSchema,
});
