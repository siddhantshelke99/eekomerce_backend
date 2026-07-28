import { FastifyPluginAsync } from 'fastify';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import {
  CreateCategoryBodySchema,
  CategoryListResponseSchema,
  CreateProductBodySchema,
  ProductListResponseSchema,
} from './products.schema.js';
import { authorizeRoles } from '../../common/middleware/rbac.js';

export const productsRoutes: FastifyPluginAsync = async (fastify) => {
  const productsService = new ProductsService(fastify.prisma);
  const productsController = new ProductsController(productsService);

  // POST /api/v1/products/categories (Protected: SUPER_ADMIN)
  fastify.post(
    '/categories',
    {
      onRequest: [fastify.authenticate, authorizeRoles('SUPER_ADMIN')],
      schema: {
        tags: ['Products'],
        summary: 'Create a new product category',
        body: CreateCategoryBodySchema,
      },
    },
    productsController.createCategoryHandler
  );

  // GET /api/v1/products/categories (Public)
  fastify.get(
    '/categories',
    {
      schema: {
        tags: ['Products'],
        summary: 'List all product categories',
        response: {
          200: CategoryListResponseSchema,
        },
      },
    },
    productsController.listCategoriesHandler
  );

  // POST /api/v1/products (Protected: VENDOR, SUPER_ADMIN)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate, authorizeRoles('VENDOR', 'SUPER_ADMIN')],
      schema: {
        tags: ['Products'],
        summary: 'Create a new master product',
        body: CreateProductBodySchema,
      },
    },
    productsController.createProductHandler
  );

  // GET /api/v1/products (Public)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Products'],
        summary: 'List and filter master products',
        response: {
          200: ProductListResponseSchema,
        },
      },
    },
    productsController.listProductsHandler
  );
};
