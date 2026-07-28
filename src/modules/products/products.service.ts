import { PrismaClient } from '@prisma/client';
import { CreateCategoryBody, CreateProductBody } from './products.schema.js';
import { ConflictError, NotFoundError } from '../../common/errors/app-error.js';

export class ProductsService {
  constructor(private prisma: PrismaClient) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async createCategory(input: CreateCategoryBody) {
    const slug = this.slugify(input.name);

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictError('Category already exists', 'CATEGORY_EXISTS');
    }

    return this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        icon: input.icon ?? null,
        description: input.description ?? null,
      },
    });
  }

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createProduct(input: CreateProductBody) {
    const category = await this.prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    }

    const baseSlug = this.slugify(`${input.brand}-${input.name}`);
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug: baseSlug },
    });

    const slug = existingSlug
      ? `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`
      : baseSlug;

    return this.prisma.product.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug,
        brand: input.brand,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      },
      include: {
        category: true,
      },
    });
  }

  async listProducts(categoryId?: string, search?: string) {
    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
