import { Type, Static } from '@sinclair/typebox';

export const ReservationStatusEnum = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('CONFIRMED'),
  Type.Literal('COLLECTED'),
  Type.Literal('EXPIRED'),
  Type.Literal('CANCELLED'),
]);

export const CreateReservationBodySchema = Type.Object(
  {
    inventoryItemId: Type.String({ format: 'uuid' }),
    quantity: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    notes: Type.Optional(Type.String({ maxLength: 200 })),
  },
  { additionalProperties: false }
);

export type CreateReservationBody = Static<typeof CreateReservationBodySchema>;

export const UpdateReservationStatusBodySchema = Type.Object(
  {
    status: ReservationStatusEnum,
  },
  { additionalProperties: false }
);

export type UpdateReservationStatusBody = Static<typeof UpdateReservationStatusBodySchema>;

export const ReservationResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  reservationCode: Type.String(),
  userId: Type.String({ format: 'uuid' }),
  storeId: Type.String({ format: 'uuid' }),
  inventoryItemId: Type.String({ format: 'uuid' }),
  quantity: Type.Number(),
  status: ReservationStatusEnum,
  expiresAt: Type.String({ format: 'date-time' }),
  notes: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
  store: Type.Optional(
    Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
      address: Type.String(),
      phone: Type.String(),
    })
  ),
  inventoryItem: Type.Optional(
    Type.Object({
      id: Type.String({ format: 'uuid' }),
      localPrice: Type.Number(),
      product: Type.Object({
        name: Type.String(),
        brand: Type.String(),
      }),
    })
  ),
});

export const ReservationListResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(ReservationResponseSchema),
});

export const SingleReservationResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: ReservationResponseSchema,
});
