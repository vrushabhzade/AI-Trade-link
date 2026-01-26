import { prisma } from '../config/database';
import { Vendor } from '@prisma/client';
import { getMultilingualService, MultilingualContent } from './multilingualService';

export interface CreateVendorData {
  userId: string;
  businessName: Record<string, string> | string;
  description?: Record<string, string> | string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  languages?: string[];
  avatarUrl?: string;
  bannerUrl?: string;
  sourceLanguage?: string;
}

export interface UpdateVendorData {
  businessName?: Record<string, string> | string;
  description?: Record<string, string> | string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  languages?: string[];
  avatarUrl?: string;
  bannerUrl?: string;
  sourceLanguage?: string;
}

export interface VendorSearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  languages?: string[];
  verified?: boolean;
  minRating?: number;
  requestedLanguage?: string;
}

export class VendorService {
  private multilingualService = getMultilingualService();

  async createVendor(vendorData: CreateVendorData): Promise<Vendor> {
    const sourceLanguage = vendorData.sourceLanguage || 'en';
    
    // Handle multilingual business name
    let businessNameContent: MultilingualContent;
    if (typeof vendorData.businessName === 'string') {
      businessNameContent = await this.multilingualService.createMultilingualContent(
        vendorData.businessName,
        sourceLanguage,
        { type: 'general' }
      );
    } else {
      businessNameContent = vendorData.businessName;
    }

    // Handle multilingual description
    let descriptionContent: MultilingualContent = {};
    if (vendorData.description) {
      if (typeof vendorData.description === 'string') {
        descriptionContent = await this.multilingualService.createMultilingualContent(
          vendorData.description,
          sourceLanguage,
          { type: 'general' }
        );
      } else {
        descriptionContent = vendorData.description;
      }
    }

    const locationPoint = vendorData.location 
      ? `POINT(${vendorData.location.longitude} ${vendorData.location.latitude})`
      : null;

    // Create vendor with raw SQL to handle PostGIS location
    await prisma.$executeRaw`
      INSERT INTO vendors (
        id, user_id, business_name, description, address, location, 
        languages, avatar_url, banner_url, created_at
      ) VALUES (
        gen_random_uuid()::text, ${vendorData.userId}, ${JSON.stringify(businessNameContent)}::jsonb,
        ${Object.keys(descriptionContent).length > 0 ? JSON.stringify(descriptionContent) : null}::jsonb,
        ${vendorData.address}, ${locationPoint ? prisma.$queryRaw`ST_GeomFromText(${locationPoint}, 4326)` : null},
        ${vendorData.languages || ['en']}::text[], ${vendorData.avatarUrl}, 
        ${vendorData.bannerUrl}, NOW()
      )
    `;

    return this.getVendorByUserId(vendorData.userId) as Promise<Vendor>;
  }

  async getVendorById(id: string, language?: string): Promise<Vendor | null> {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: true,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) return null;

    if (language) {
      // Ensure translations exist for the requested language
      const businessNameContent = vendor.businessName as MultilingualContent;
      const descriptionContent = vendor.description as MultilingualContent || {};

      const updatedBusinessNameContent = await this.multilingualService.ensureLanguageExists(
        businessNameContent,
        language,
        { type: 'general' }
      );

      const updatedDescriptionContent = Object.keys(descriptionContent).length > 0 
        ? await this.multilingualService.ensureLanguageExists(descriptionContent, language, { type: 'general' })
        : descriptionContent;

      // Update the vendor if new translations were generated
      if (JSON.stringify(updatedBusinessNameContent) !== JSON.stringify(businessNameContent) ||
          JSON.stringify(updatedDescriptionContent) !== JSON.stringify(descriptionContent)) {
        await prisma.vendor.update({
          where: { id },
          data: {
            businessName: updatedBusinessNameContent,
            description: Object.keys(updatedDescriptionContent).length > 0 ? updatedDescriptionContent : undefined,
          },
        });

        // Return updated vendor
        return {
          ...vendor,
          businessName: updatedBusinessNameContent,
          description: updatedDescriptionContent,
        };
      }
    }

    return vendor;
  }

  async getVendorByUserId(userId: string, language?: string): Promise<Vendor | null> {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: true,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) return null;

    if (language) {
      // Ensure translations exist for the requested language
      const businessNameContent = vendor.businessName as MultilingualContent;
      const descriptionContent = vendor.description as MultilingualContent || {};

      const updatedBusinessNameContent = await this.multilingualService.ensureLanguageExists(
        businessNameContent,
        language,
        { type: 'general' }
      );

      const updatedDescriptionContent = Object.keys(descriptionContent).length > 0 
        ? await this.multilingualService.ensureLanguageExists(descriptionContent, language, { type: 'general' })
        : descriptionContent;

      // Update the vendor if new translations were generated
      if (JSON.stringify(updatedBusinessNameContent) !== JSON.stringify(businessNameContent) ||
          JSON.stringify(updatedDescriptionContent) !== JSON.stringify(descriptionContent)) {
        await prisma.vendor.update({
          where: { id: vendor.id },
          data: {
            businessName: updatedBusinessNameContent,
            description: Object.keys(updatedDescriptionContent).length > 0 ? updatedDescriptionContent : undefined,
          },
        });

        // Return updated vendor
        return {
          ...vendor,
          businessName: updatedBusinessNameContent,
          description: updatedDescriptionContent,
        };
      }
    }

    return vendor;
  }

  async updateVendor(id: string, vendorData: UpdateVendorData): Promise<Vendor> {
    const sourceLanguage = vendorData.sourceLanguage || 'en';
    const updateData: any = { ...vendorData };

    // Get existing vendor for context
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      throw new Error('Vendor not found');
    }

    // Handle multilingual business name update
    if (vendorData.businessName) {
      if (typeof vendorData.businessName === 'string') {
        const existingBusinessNameContent = existingVendor.businessName as MultilingualContent;
        updateData.businessName = await this.multilingualService.updateMultilingualContent(
          existingBusinessNameContent,
          vendorData.businessName,
          sourceLanguage,
          { type: 'general' }
        );
      } else {
        updateData.businessName = vendorData.businessName;
      }
    }

    // Handle multilingual description update
    if (vendorData.description) {
      if (typeof vendorData.description === 'string') {
        const existingDescriptionContent = existingVendor.description as MultilingualContent || {};
        updateData.description = await this.multilingualService.updateMultilingualContent(
          existingDescriptionContent,
          vendorData.description,
          sourceLanguage,
          { type: 'general' }
        );
      } else {
        updateData.description = vendorData.description;
      }
    }

    // Handle location update separately due to PostGIS
    if (vendorData.location) {
      const locationPoint = `POINT(${vendorData.location.longitude} ${vendorData.location.latitude})`;
      
      await prisma.$executeRaw`
        UPDATE vendors 
        SET location = ST_GeomFromText(${locationPoint}, 4326)
        WHERE id = ${id}
      `;
      
      delete updateData.location;
    }

    // Remove sourceLanguage from update data as it's not a database field
    delete updateData.sourceLanguage;

    return prisma.vendor.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async searchVendors(filters: VendorSearchFilters): Promise<Vendor[]> {
    let whereClause = '';
    const params: any[] = [];

    if (filters.verified !== undefined) {
      whereClause += ` AND verified = $${params.length + 1}`;
      params.push(filters.verified);
    }

    if (filters.minRating) {
      whereClause += ` AND rating >= $${params.length + 1}`;
      params.push(filters.minRating);
    }

    if (filters.languages && filters.languages.length > 0) {
      whereClause += ` AND languages && $${params.length + 1}::text[]`;
      params.push(filters.languages);
    }

    let locationClause = '';
    let fromClause = 'FROM vendors v';
    let orderClause = 'ORDER BY v.rating DESC, v.total_sales DESC';

    if (filters.location) {
      const { latitude, longitude, radiusKm } = filters.location;
      locationClause = `, ST_Distance(v.location, ST_Point($${params.length + 1}, $${params.length + 2})) as distance`;
      whereClause += ` AND ST_DWithin(v.location, ST_Point($${params.length + 1}, $${params.length + 2}), $${params.length + 3})`;
      orderClause = 'ORDER BY distance ASC';
      params.push(longitude, latitude, radiusKm * 1000); // Convert km to meters
    }

    const query = `
      SELECT v.*, u.full_name, u.email, u.preferred_language
      ${locationClause}
      ${fromClause}
      JOIN users u ON v.user_id = u.id
      WHERE 1=1
      ${whereClause}
      ${orderClause}
      LIMIT 50
    `;

    const results = await prisma.$queryRawUnsafe(query, ...params) as Vendor[];

    // Ensure translations exist for requested language
    if (filters.requestedLanguage) {
      for (const vendor of results) {
        const businessNameContent = vendor.businessName as MultilingualContent;
        const descriptionContent = vendor.description as MultilingualContent || {};

        // Check if translation exists, if not, generate it
        if (!businessNameContent[filters.requestedLanguage] || 
            (Object.keys(descriptionContent).length > 0 && !descriptionContent[filters.requestedLanguage])) {
          
          const updatedBusinessNameContent = await this.multilingualService.ensureLanguageExists(
            businessNameContent,
            filters.requestedLanguage,
            { type: 'general' }
          );

          const updatedDescriptionContent = Object.keys(descriptionContent).length > 0 
            ? await this.multilingualService.ensureLanguageExists(descriptionContent, filters.requestedLanguage, { type: 'general' })
            : descriptionContent;

          // Update in database if new translations were generated
          if (JSON.stringify(updatedBusinessNameContent) !== JSON.stringify(businessNameContent) ||
              JSON.stringify(updatedDescriptionContent) !== JSON.stringify(descriptionContent)) {
            await prisma.vendor.update({
              where: { id: vendor.id },
              data: {
                businessName: updatedBusinessNameContent,
                description: Object.keys(updatedDescriptionContent).length > 0 ? updatedDescriptionContent : undefined,
              },
            });

            // Update the result
            vendor.businessName = updatedBusinessNameContent;
            vendor.description = updatedDescriptionContent;
          }
        }
      }
    }

    return results;
  }

  async updateRating(id: string, newRating: number): Promise<void> {
    await prisma.vendor.update({
      where: { id },
      data: { rating: newRating },
    });
  }

  async incrementSales(id: string): Promise<void> {
    await prisma.vendor.update({
      where: { id },
      data: {
        totalSales: {
          increment: 1,
        },
      },
    });
  }

  async verifyVendor(id: string): Promise<void> {
    await prisma.vendor.update({
      where: { id },
      data: { verified: true },
    });
  }

  /**
   * Get content in a specific language with fallback
   */
  getLocalizedContent(content: MultilingualContent, language: string): string {
    return this.multilingualService.getContentInLanguage(content, language);
  }

  /**
   * Check if vendor has translation for a specific language
   */
  hasTranslation(vendor: Vendor, language: string): boolean {
    const businessNameContent = vendor.businessName as MultilingualContent;
    const descriptionContent = vendor.description as MultilingualContent || {};
    
    return !!(businessNameContent[language] && 
             (Object.keys(descriptionContent).length === 0 || descriptionContent[language]));
  }

  /**
   * Get missing languages for a vendor
   */
  getMissingLanguages(vendor: Vendor): string[] {
    const businessNameContent = vendor.businessName as MultilingualContent;
    const descriptionContent = vendor.description as MultilingualContent || {};
    
    const businessNameMissing = this.multilingualService.getMissingLanguages(businessNameContent);
    const descriptionMissing = Object.keys(descriptionContent).length > 0 
      ? this.multilingualService.getMissingLanguages(descriptionContent)
      : [];
    
    // Return union of missing languages
    return [...new Set([...businessNameMissing, ...descriptionMissing])];
  }
}

export const vendorService = new VendorService();