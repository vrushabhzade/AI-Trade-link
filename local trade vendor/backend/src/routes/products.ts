import express, { Response } from 'express';
import { PrismaClient, Product as PrismaProduct } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ApiResponse, Product } from '../types';
import { productService, CreateProductData, UpdateProductData, ProductSearchFilters } from '../services/productService';
import { body, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Helper function to convert Prisma Product to API Product
const convertPrismaProductToApiProduct = (prismaProduct: any): Product => {
  return {
    ...prismaProduct,
    basePrice: parseFloat(prismaProduct.basePrice.toString()),
    name: prismaProduct.name as Record<string, string>,
    description: prismaProduct.description as Record<string, string>,
    attributes: prismaProduct.attributes as Record<string, any>
  };
};

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const createProductValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('quantityAvailable').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('sourceLanguage').optional().isLength({ min: 2, max: 10 }).withMessage('Invalid source language code')
];

const updateProductValidation = [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('quantityAvailable').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('sourceLanguage').optional().isLength({ min: 2, max: 10 }).withMessage('Invalid source language code')
];

const searchValidation = [
  query('language').notEmpty().withMessage('Language parameter is required'),
  query('category').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('latitude').optional().isFloat({ min: -90, max: 90 }),
  query('longitude').optional().isFloat({ min: -180, max: 180 }),
  query('radius').optional().isFloat({ min: 0 }),
  query('query').optional().isString()
];

// Helper function to validate request
const validateRequest = (req: express.Request, res: Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors.array(),
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
  next();
};

// Create a new product
router.post('/', authenticateToken, upload.array('images', 10), createProductValidation, validateRequest, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Check if user is a vendor
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only vendors can create products',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Get vendor ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Process uploaded images
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        // In production, you would upload to S3 or similar service
        // For now, we'll use local file paths
        imageUrls.push(`/uploads/products/${file.filename}`);
      }
    }

    const productData: CreateProductData = {
      vendorId: vendor.id,
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      subcategory: req.body.subcategory,
      basePrice: parseFloat(req.body.basePrice),
      currency: req.body.currency || 'USD',
      unit: req.body.unit,
      quantityAvailable: req.body.quantityAvailable ? parseInt(req.body.quantityAvailable) : undefined,
      images: imageUrls,
      attributes: req.body.attributes ? JSON.parse(req.body.attributes) : {},
      sourceLanguage: req.body.sourceLanguage || req.user.preferredLanguage
    };

    const product = await productService.createProduct(productData);

    res.status(201).json({
      success: true,
      data: convertPrismaProductToApiProduct(product)
    } as ApiResponse<Product>);

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_CREATION_FAILED',
        message: 'Failed to create product',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Get product by ID
router.get('/:id', async (req: express.Request, res: Response) => {
  try {
    const { id } = req.params;
    const { language } = req.query;

    const product = await productService.getProductById(id, language as string);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: convertPrismaProductToApiProduct(product)
    } as ApiResponse<Product>);

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_FETCH_FAILED',
        message: 'Failed to fetch product',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Update product
router.put('/:id', authenticateToken, upload.array('images', 10), updateProductValidation, validateRequest, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    const { id } = req.params;

    // Check if product exists and user owns it
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Get vendor to check ownership
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    });

    if (!vendor || existingProduct.vendorId !== vendor.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own products',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Process uploaded images
    let imageUrls: string[] | undefined;
    if (req.files && Array.isArray(req.files)) {
      imageUrls = [];
      for (const file of req.files) {
        imageUrls.push(`/uploads/products/${file.filename}`);
      }
    }

    const updateData: UpdateProductData = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.subcategory !== undefined) updateData.subcategory = req.body.subcategory;
    if (req.body.basePrice !== undefined) updateData.basePrice = parseFloat(req.body.basePrice);
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;
    if (req.body.unit !== undefined) updateData.unit = req.body.unit;
    if (req.body.quantityAvailable !== undefined) updateData.quantityAvailable = parseInt(req.body.quantityAvailable);
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === 'true';
    if (imageUrls) updateData.images = imageUrls;
    if (req.body.attributes !== undefined) updateData.attributes = JSON.parse(req.body.attributes);
    if (req.body.sourceLanguage !== undefined) updateData.sourceLanguage = req.body.sourceLanguage;

    const product = await productService.updateProduct(id, updateData);

    res.json({
      success: true,
      data: convertPrismaProductToApiProduct(product)
    } as ApiResponse<Product>);

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_UPDATE_FAILED',
        message: 'Failed to update product',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Delete product (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    const { id } = req.params;

    // Check if product exists and user owns it
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Get vendor to check ownership
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    });

    if (!vendor || existingProduct.vendorId !== vendor.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own products',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    await productService.deleteProduct(id);

    res.json({
      success: true,
      data: { message: 'Product deleted successfully' }
    } as ApiResponse<{ message: string }>);

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_DELETION_FAILED',
        message: 'Failed to delete product',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Search products with filters
router.get('/', searchValidation, validateRequest, async (req: express.Request, res: Response) => {
  try {
    const {
      language,
      category,
      subcategory,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      radius,
      query: searchQuery,
      vendorId
    } = req.query;

    const filters: ProductSearchFilters = {
      language: language as string,
      category: category as string,
      subcategory: subcategory as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      vendorId: vendorId as string,
      query: searchQuery as string,
      isActive: true
    };

    // Add location filter if coordinates are provided
    if (latitude && longitude) {
      filters.location = {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radiusKm: radius ? parseFloat(radius as string) : 10 // Default 10km radius
      };
    }

    const products = await productService.searchProducts(filters);

    res.json({
      success: true,
      data: products.map(convertPrismaProductToApiProduct)
    } as ApiResponse<Product[]>);

  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCT_SEARCH_FAILED',
        message: 'Failed to search products',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Get products by category
router.get('/category/:category', async (req: express.Request, res: Response) => {
  try {
    const { category } = req.params;
    const { language, limit } = req.query;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_LANGUAGE',
          message: 'Language parameter is required',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    const products = await productService.getProductsByCategory(
      category,
      language as string,
      limit ? parseInt(limit as string) : 20
    );

    res.json({
      success: true,
      data: products.map(convertPrismaProductToApiProduct)
    } as ApiResponse<Product[]>);

  } catch (error) {
    console.error('Category products fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_FETCH_FAILED',
        message: 'Failed to fetch products by category',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Get popular products
router.get('/popular', async (req: express.Request, res: Response) => {
  try {
    const { limit } = req.query;
    
    const products = await productService.getPopularProducts(
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: products.map(convertPrismaProductToApiProduct)
    } as ApiResponse<Product[]>);

  } catch (error) {
    console.error('Popular products fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'POPULAR_FETCH_FAILED',
        message: 'Failed to fetch popular products',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Get vendor's products
router.get('/vendor/:vendorId', async (req: express.Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const { includeInactive } = req.query;

    const products = await productService.getProductsByVendor(
      vendorId,
      includeInactive !== 'true'
    );

    res.json({
      success: true,
      data: products.map(convertPrismaProductToApiProduct)
    } as ApiResponse<Product[]>);

  } catch (error) {
    console.error('Vendor products fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VENDOR_PRODUCTS_FETCH_FAILED',
        message: 'Failed to fetch vendor products',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Get current vendor's products
router.get('/vendor', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only vendors can access this endpoint',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Get vendor ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor profile not found',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    const { includeInactive } = req.query;

    const products = await productService.getProductsByVendor(
      vendor.id,
      includeInactive !== 'true'
    );

    res.json({
      success: true,
      data: products.map(convertPrismaProductToApiProduct)
    } as ApiResponse<Product[]>);

  } catch (error) {
    console.error('Current vendor products fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VENDOR_PRODUCTS_FETCH_FAILED',
        message: 'Failed to fetch vendor products',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

// Update inventory
router.patch('/:id/inventory', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be a non-negative number',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Check if product exists and user owns it
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    // Get vendor to check ownership
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    });

    if (!vendor || existingProduct.vendorId !== vendor.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update inventory for your own products',
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<never>);
    }

    const product = await productService.updateInventory(id, quantity);

    res.json({
      success: true,
      data: convertPrismaProductToApiProduct(product)
    } as ApiResponse<Product>);

  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INVENTORY_UPDATE_FAILED',
        message: 'Failed to update inventory',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<never>);
  }
});

export default router;