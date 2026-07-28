import { Type, Static } from '@sinclair/typebox';

export const RequestStatusEnum = Type.Union([
  Type.Literal('OPEN'),
  Type.Literal('FULFILLED'),
  Type.Literal('CLOSED'),
]);

export const CreateProductRequestSchema = Type.Object(
  {
    categoryId: Type.String({ format: 'uuid' }),
    title: Type.String({ minLength: 2, maxLength: 150 }),
    description: Type.Optional(Type.String({ maxLength: 500 })),
    imageUrl: Type.Optional(Type.String()),
    externalUrl: Type.Optional(Type.String()),
    latitude: Type.Number({ minimum: -90, maximum: 90 }),
    longitude: Type.Number({ minimum: -180, maximum: 180 }),
    radiusKm: Type.Optional(Type.Number({ minimum: 0.5, maximum: 50, default: 5.0 })),
  },
  { additionalProperties: false }
);

export type CreateProductRequest = Static<typeof CreateProductRequestSchema>;

export const CreateVendorQuoteSchema = Type.Object(
  {
    storeId: Type.String({ format: 'uuid' }),
    isAvailable: Type.Optional(Type.Boolean({ default: true })),
    offeredPrice: Type.Optional(Type.Number({ minimum: 0 })),
    availableQuantity: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    notes: Type.Optional(Type.String({ maxLength: 300 })),
  },
  { additionalProperties: false }
);

export type CreateVendorQuote = Static<typeof CreateVendorQuoteSchema>;

export const VendorQuoteResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  requestId: Type.String({ format: 'uuid' }),
  storeId: Type.String({ format: 'uuid' }),
  isAvailable: Type.Boolean(),
  offeredPrice: Type.Union([Type.Number(), Type.Null()]),
  availableQuantity: Type.Union([Type.Number(), Type.Null()]),
  notes: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
  store: Type.Optional(
    Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
      address: Type.String(),
      phone: Type.String(),
      distanceKm: Type.Optional(Type.Number()),
    })
  ),
});

export const ProductRequestResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  categoryId: Type.String({ format: 'uuid' }),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  externalUrl: Type.Union([Type.String(), Type.Null()]),
  latitude: Type.Number(),
  longitude: Type.Number(),
  radiusKm: Type.Number(),
  status: RequestStatusEnum,
  createdAt: Type.String({ format: 'date-time' }),
  quotes: Type.Optional(Type.Array(VendorQuoteResponseSchema)),
});

export const ProductRequestListResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(ProductRequestResponseSchema),
});

export const SingleProductRequestResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: ProductRequestResponseSchema,
});
