import { Type, Static } from '@sinclair/typebox';

export const FulfillmentTypeEnum = Type.Union([
  Type.Literal('PICKUP'),
  Type.Literal('LOCAL_DELIVERY'),
]);

export const OrderStatusEnum = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('CONFIRMED'),
  Type.Literal('DISPATCHED'),
  Type.Literal('DELIVERED'),
  Type.Literal('CANCELLED'),
]);

export const CreateOrderItemSchema = Type.Object({
  inventoryItemId: Type.String({ format: 'uuid' }),
  quantity: Type.Number({ minimum: 1, default: 1 }),
});

export const CreateOrderBodySchema = Type.Object(
  {
    storeId: Type.String({ format: 'uuid' }),
    fulfillmentType: FulfillmentTypeEnum,
    deliveryAddress: Type.Optional(Type.String({ minLength: 5 })),
    userLatitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90 })),
    userLongitude: Type.Optional(Type.Number({ minimum: -180, maximum: 180 })),
    items: Type.Array(CreateOrderItemSchema, { minItems: 1 }),
  },
  { additionalProperties: false }
);

export type CreateOrderBody = Static<typeof CreateOrderBodySchema>;

export const UpdateOrderStatusBodySchema = Type.Object(
  {
    status: OrderStatusEnum,
  },
  { additionalProperties: false }
);

export type UpdateOrderStatusBody = Static<typeof UpdateOrderStatusBodySchema>;

export const OrderItemResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  inventoryItemId: Type.String({ format: 'uuid' }),
  unitPrice: Type.Number(),
  quantity: Type.Number(),
  productName: Type.Optional(Type.String()),
});

export const OrderResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  orderNumber: Type.String(),
  userId: Type.String({ format: 'uuid' }),
  storeId: Type.String({ format: 'uuid' }),
  fulfillmentType: FulfillmentTypeEnum,
  deliveryAddress: Type.Union([Type.String(), Type.Null()]),
  deliveryFee: Type.Number(),
  totalAmount: Type.Number(),
  status: OrderStatusEnum,
  paymentStatus: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
  store: Type.Optional(
    Type.Object({
      name: Type.String(),
      address: Type.String(),
      phone: Type.String(),
    })
  ),
  items: Type.Optional(Type.Array(OrderItemResponseSchema)),
});

export const OrderListResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(OrderResponseSchema),
});

export const SingleOrderResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: OrderResponseSchema,
});
