import { Type, Static } from '@sinclair/typebox';

export const CreateCategoryBodySchema = Type.Object(
  {
    name: Type.String({ minLength: 2 }),
    icon: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
  },
  { additionalProperties: false }
);

export type CreateCategoryBody = Static<typeof CreateCategoryBodySchema>;

export const CreateProductBodySchema = Type.Object(
  {
    categoryId: Type.String({ format: 'uuid' }),
    name: Type.String({ minLength: 2 }),
    brand: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String()),
    imageUrl: Type.Optional(Type.String()),
  },
  { additionalProperties: false }
);

export type CreateProductBody = Static<typeof CreateProductBodySchema>;

export const CategoryResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  slug: Type.String(),
  icon: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
});

export const ProductResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  categoryId: Type.String({ format: 'uuid' }),
  name: Type.String(),
  slug: Type.String(),
  brand: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  category: Type.Optional(CategoryResponseSchema),
});

export const CategoryListResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(CategoryResponseSchema),
});

export const ProductListResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(ProductResponseSchema),
});
