import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateCategoryBody, CreateProductBody } from './products.schema.js';
import { ProductsService } from './products.service.js';

export class ProductsController {
  constructor(private productsService: ProductsService) {}

  createCategoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateCategoryBody;
    const category = await this.productsService.createCategory(body);
    return reply.status(201).send({
      success: true,
      data: category,
    });
  };

  listCategoriesHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    const categories = await this.productsService.listCategories();
    return reply.status(200).send({
      success: true,
      data: categories,
    });
  };

  createProductHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateProductBody;
    const product = await this.productsService.createProduct(body);
    return reply.status(201).send({
      success: true,
      data: product,
    });
  };

  listProductsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { categoryId?: string; search?: string };
    const products = await this.productsService.listProducts(query.categoryId, query.search);
    return reply.status(200).send({
      success: true,
      data: products,
    });
  };
}
