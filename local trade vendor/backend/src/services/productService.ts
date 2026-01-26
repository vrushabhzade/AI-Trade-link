import { prisma } from '../config/database';
import { Product } from '@prisma/client';
import { getMultilingualService, MultilingualContent } from './multilingualService';
import { TranslationContext } from './translationService';

export interface CreateProductData {
  vendorId: string;
  name: Record<string, string> | string;
  description?: Record<string, string> | string;
  category: string;
  subcategory?: string;
  basePrice: number;
  currency?: string;
  unit?: string;
  quantityAvailable?: number;
  images?: string[];
  attributes?: Record<string, any>;
  sourceLanguage?: string;
}

export interface UpdateProductData {
  name?: Record<string, string> | string;
  description?: Record<string, string> | string;
  category?: string;
  subcategory?: string;
  basePrice?: number;
  currency?: string;
  unit?: string;
  quantityAvailable?: number;
  images?: string[];
  attributes?: Record<string, any>;
  isActive?: boolean;
  sourceLanguage?: string;
}

export interface ProductSearchFilters {
  category?: string;
  subcategory?: string;
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  language: string;
  minPrice?: number;
  maxPrice?: number;
  vendorId?: string;
  query?: string;
  isActive?: boolean;
}

export class ProductService {
  private multilingualService = getMultilingualService();

  async createProduct(productData: CreateProductData): Promise<Product> {
    const sourceLanguage = productData.sourceLanguage || 'en';
    
    // Handle multilingual name
    let nameContent: MultilingualContent;
    if (typeof productData.name === 'string') {
      nameContent = await this.multilingualService.createMultilingualContent(
        productData.name,
        sourceLanguage,
        { type: 'product', productName: productData.name }
      );
    } else {
      nameContent = productData.name;
    }

    // Handle multilingual description
    let descriptionContent: MultilingualContent = {};
    if (productData.description) {
      if (typeof productData.description === 'string') {
        descriptionContent = await this.multilingualService.createMultilingualContent(
          productData.description,
          sourceLanguage,
          { type: 'product', productName: typeof productData.name === 'string' ? productData.name : productData.name[sourceLanguage] }
        );
      } else {
        descriptionContent = productData.description;
      }
    }

    return prisma.product.create({
      data: {
        vendorId: productData.vendorId,
        name: nameContent,
        description: descriptionContent,
        category: productData.category,
        subcategory: productData.subcategory,
        basePrice: productData.basePrice,
        currency: productData.currency || 'USD',
        unit: productData.unit,
        quantityAvailable: productData.quantityAvailable,
        images: productData.images || [],
        attributes: productData.attributes || {},
      },
      include: {
        vendor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getProductById(id: string, language?: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!product) return null;

    if (language) {
      // Ensure translations exist for the requested language
      const nameContent = product.name as MultilingualContent;
      const descriptionContent = product.description as MultilingualContent;

      const updatedNameContent = await this.multilingualService.ensureLanguageExists(
        nameContent,
        language,
        { type: 'product', productName: this.multilingualService.getContentInLanguage(nameContent, language) }
      );

      const updatedDescriptionContent = await this.multilingualService.ensureLanguageExists(
        descriptionContent,
        language,
        { type: 'product', productName: this.multilingualService.getContentInLanguage(nameContent, language) }
      );

      // Update the product if new translations were generated
      if (JSON.stringify(updatedNameContent) !== JSON.stringify(nameContent) ||
          JSON.stringify(updatedDescriptionContent) !== JSON.stringify(descriptionContent)) {
        await prisma.product.update({
          where: { id },
          data: {
            name: updatedNameContent,
            description: updatedDescriptionContent,
          },
        });

        // Return updated product
        return {
          ...product,
          name: updatedNameContent,
          description: updatedDescriptionContent,
        };
      }
    }

    return product;
  }

  async updateProduct(id: string, productData: UpdateProductData): Promise<Product> {
    const sourceLanguage = productData.sourceLanguage || 'en';
    const updateData: any = { ...productData };

    // Get existing product for context
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Handle multilingual name update
    if (productData.name) {
      if (typeof productData.name === 'string') {
        const existingNameContent = existingProduct.name as MultilingualContent;
        updateData.name = await this.multilingualService.updateMultilingualContent(
          existingNameContent,
          productData.name,
          sourceLanguage,
          { type: 'product', productName: productData.name }
        );
      } else {
        updateData.name = productData.name;
      }
    }

    // Handle multilingual description update
    if (productData.description) {
      if (typeof productData.description === 'string') {
        const existingDescriptionContent = existingProduct.description as MultilingualContent;
        const productName = updateData.name ? 
          this.multilingualService.getContentInLanguage(updateData.name, sourceLanguage) :
          this.multilingualService.getContentInLanguage(existingProduct.name as MultilingualContent, sourceLanguage);
        
        updateData.description = await this.multilingualService.updateMultilingualContent(
          existingDescriptionContent,
          productData.description,
          sourceLanguage,
          { type: 'product', productName }
        );
      } else {
        updateData.description = productData.description;
      }
    }

    // Remove sourceLanguage from update data as it's not a database field
    delete updateData.sourceLanguage;

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        vendor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async searchProducts(filters: ProductSearchFilters): Promise<Product[]> {
    let whereClause = 'WHERE p.is_active = true';
    const params: any[] = [];

    if (filters.category) {
      whereClause += ` AND p.category = $${params.length + 1}`;
      params.push(filters.category);
    }

    if (filters.subcategory) {
      whereClause += ` AND p.subcategory = $${params.length + 1}`;
      params.push(filters.subcategory);
    }

    if (filters.minPrice !== undefined) {
      whereClause += ` AND p.base_price >= $${params.length + 1}`;
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      whereClause += ` AND p.base_price <= $${params.length + 1}`;
      params.push(filters.maxPrice);
    }

    if (filters.vendorId) {
      whereClause += ` AND p.vendor_id = $${params.length + 1}`;
      params.push(filters.vendorId);
    }

    if (filters.query) {
      // Search in multilingual names and descriptions
      whereClause += ` AND (
        p.name::text ILIKE $${params.length + 1} OR 
        p.description::text ILIKE $${params.length + 1}
      )`;
      params.push(`%${filters.query}%`);
    }

    let locationJoin = '';
    let locationOrder = 'ORDER BY p.created_at DESC';

    if (filters.location) {
      const { latitude, longitude, radiusKm } = filters.location;
      locationJoin = `
        , ST_Distance(v.location, ST_Point($${params.length + 1}, $${params.length + 2})) as distance
      `;
      whereClause += ` AND ST_DWithin(v.location, ST_Point($${params.length + 1}, $${params.length + 2}), $${params.length + 3})`;
      locationOrder = 'ORDER BY distance ASC, p.created_at DESC';
      params.push(longitude, latitude, radiusKm * 1000); // Convert km to meters
    }

    const query = `
      SELECT p.*, v.business_name, v.rating, v.verified, u.full_name as vendor_name
      ${locationJoin}
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      ${whereClause}
      ${locationOrder}
      LIMIT 50
    `;

    const results = await prisma.$queryRawUnsafe(query, ...params) as Product[];

    // Ensure translations exist for requested language
    if (filters.language) {
      for (const product of results) {
        const nameContent = product.name as MultilingualContent;
        const descriptionContent = product.description as MultilingualContent;

        // Check if translation exists, if not, generate it
        if (!nameContent[filters.language] || !descriptionContent[filters.language]) {
          const updatedNameContent = await this.multilingualService.ensureLanguageExists(
            nameContent,
            filters.language,
            { type: 'product', productName: this.multilingualService.getContentInLanguage(nameContent, filters.language) }
          );

          const updatedDescriptionContent = await this.multilingualService.ensureLanguageExists(
            descriptionContent,
            filters.language,
            { type: 'product', productName: this.multilingualService.getContentInLanguage(nameContent, filters.language) }
          );

          // Update in database if new translations were generated
          if (JSON.stringify(updatedNameContent) !== JSON.stringify(nameContent) ||
              JSON.stringify(updatedDescriptionContent) !== JSON.stringify(descriptionContent)) {
            await prisma.product.update({
              where: { id: product.id },
              data: {
                name: updatedNameContent,
                description: updatedDescriptionContent,
              },
            });

            // Update the result
            product.name = updatedNameContent;
            product.description = updatedDescriptionContent;
          }
        }
      }
    }

    return results;
  }

  async getProductsByVendor(vendorId: string, isActive: boolean = true): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        vendorId,
        isActive,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getProductsByCategory(category: string, language: string, limit: number = 20): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        category,
        isActive: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          include: {
            user: true,
          },
        },
      },
    });

    // Ensure translations exist for the requested language
    for (const product of products) {
      const nameContent = product.name as MultilingualContent;
      const descriptionContent = product.description as MultilingualContent;

      if (!nameContent[language] || !descriptionContent[language]) {
        const updatedNameContent = await this.multilingualService.ensureLanguageExists(
          nameContent,
          language,
          { type: 'product', productName: this.multilingualService.getContentInLanguage(nameContent, language) }
        );

        const updatedDescriptionContent = await this.multilingualService.ensureLanguageExists(
          descriptionContent,
          language,
          { type: 'product', productName: this.multilingualService.getContentInLanguage(nameContent, language) }
        );

        if (JSON.stringify(updatedNameContent) !== JSON.stringify(nameContent) ||
            JSON.stringify(updatedDescriptionContent) !== JSON.stringify(descriptionContent)) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              name: updatedNameContent,
              description: updatedDescriptionContent,
            },
          });

          product.name = updatedNameContent;
          product.description = updatedDescriptionContent;
        }
      }
    }

    return products;
  }

  async updateInventory(id: string, quantity: number): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        quantityAvailable: quantity,
      },
    });
  }

  async decrementInventory(id: string, amount: number): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        quantityAvailable: {
          decrement: amount,
        },
      },
    });
  }

  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    // This would typically be based on sales data, views, or other metrics
    // For now, we'll use creation date and vendor rating as proxy
    const query = `
      SELECT p.*, v.business_name, v.rating, v.total_sales
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      WHERE p.is_active = true
      ORDER BY v.rating DESC, v.total_sales DESC, p.created_at DESC
      LIMIT $1
    `;

    return prisma.$queryRawUnsafe(query, limit) as Promise<Product[]>;
  }

  /**
   * Get content in a specific language with fallback
   */
  getLocalizedContent(content: MultilingualContent, language: string): string {
    return this.multilingualService.getContentInLanguage(content, language);
  }

  /**
   * Check if product has translation for a specific language
   */
  hasTranslation(product: Product, language: string): boolean {
    const nameContent = product.name as MultilingualContent;
    const descriptionContent = product.description as MultilingualContent;
    
    return !!(nameContent[language] && descriptionContent[language]);
  }

  /**
   * Get missing languages for a product
   */
  getMissingLanguages(product: Product): string[] {
    const nameContent = product.name as MultilingualContent;
    const descriptionContent = product.description as MultilingualContent;
    
    const nameMissing = this.multilingualService.getMissingLanguages(nameContent);
    const descriptionMissing = this.multilingualService.getMissingLanguages(descriptionContent);
    
    // Return union of missing languages
    return [...new Set([...nameMissing, ...descriptionMissing])];
  }
}

export const productService = new ProductService();