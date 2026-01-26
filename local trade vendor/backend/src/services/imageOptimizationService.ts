/**
 * Image Optimization Service for TradeLink Marketplace
 * Handles image compression and optimization
 * Requirements: System performance optimization
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface OptimizedImage {
  originalPath: string;
  optimizedPath: string;
  thumbnailPath?: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

export class ImageOptimizationService {
  private uploadDir: string;
  private optimizedDir: string;
  private thumbnailDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.optimizedDir = path.join(this.uploadDir, 'optimized');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  /**
   * Optimize a single image
   */
  async optimizeImage(
    inputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 80,
      format = 'jpeg',
      generateThumbnail = true,
      thumbnailSize = 300,
    } = options;

    try {
      // Get original file size
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Generate output filename
      const filename = path.basename(inputPath, path.extname(inputPath));
      const optimizedFilename = `${filename}_optimized.${format}`;
      const optimizedPath = path.join(this.optimizedDir, optimizedFilename);

      // Optimize main image
      await sharp(inputPath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat(format, { quality })
        .toFile(optimizedPath);

      // Get optimized file size
      const optimizedStats = await fs.stat(optimizedPath);
      const optimizedSize = optimizedStats.size;

      const result: OptimizedImage = {
        originalPath: inputPath,
        optimizedPath,
        originalSize,
        optimizedSize,
        compressionRatio: ((originalSize - optimizedSize) / originalSize) * 100,
      };

      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailFilename = `${filename}_thumb.${format}`;
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

        await sharp(inputPath)
          .resize(thumbnailSize, thumbnailSize, {
            fit: 'cover',
            position: 'center',
          })
          .toFormat(format, { quality: 70 })
          .toFile(thumbnailPath);

        result.thumbnailPath = thumbnailPath;
      }

      return result;
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw new Error(`Failed to optimize image: ${error}`);
    }
  }

  /**
   * Optimize multiple images in batch
   */
  async optimizeBatch(
    inputPaths: string[],
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage[]> {
    const results: OptimizedImage[] = [];

    for (const inputPath of inputPaths) {
      try {
        const result = await this.optimizeImage(inputPath, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to optimize ${inputPath}:`, error);
      }
    }

    return results;
  }

  /**
   * Convert image to WebP format for better compression
   */
  async convertToWebP(inputPath: string, quality: number = 80): Promise<string> {
    try {
      const filename = path.basename(inputPath, path.extname(inputPath));
      const webpFilename = `${filename}.webp`;
      const webpPath = path.join(this.optimizedDir, webpFilename);

      await sharp(inputPath)
        .webp({ quality })
        .toFile(webpPath);

      return webpPath;
    } catch (error) {
      console.error('Error converting to WebP:', error);
      throw new Error(`Failed to convert to WebP: ${error}`);
    }
  }

  /**
   * Generate responsive image sizes
   */
  async generateResponsiveSizes(
    inputPath: string,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    try {
      const filename = path.basename(inputPath, path.extname(inputPath));

      for (const size of sizes) {
        const outputFilename = `${filename}_${size}w.jpeg`;
        const outputPath = path.join(this.optimizedDir, outputFilename);

        await sharp(inputPath)
          .resize(size, null, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        results[`${size}w`] = outputPath;
      }

      return results;
    } catch (error) {
      console.error('Error generating responsive sizes:', error);
      throw new Error(`Failed to generate responsive sizes: ${error}`);
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(inputPath: string): Promise<sharp.Metadata> {
    try {
      return await sharp(inputPath).metadata();
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw new Error(`Failed to get image metadata: ${error}`);
    }
  }

  /**
   * Compress image without resizing
   */
  async compressImage(
    inputPath: string,
    quality: number = 80
  ): Promise<OptimizedImage> {
    try {
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      const filename = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath).substring(1);
      const compressedFilename = `${filename}_compressed.${ext}`;
      const compressedPath = path.join(this.optimizedDir, compressedFilename);

      // Compress based on format
      const image = sharp(inputPath);
      
      if (ext === 'jpg' || ext === 'jpeg') {
        await image.jpeg({ quality }).toFile(compressedPath);
      } else if (ext === 'png') {
        await image.png({ quality }).toFile(compressedPath);
      } else if (ext === 'webp') {
        await image.webp({ quality }).toFile(compressedPath);
      } else {
        throw new Error(`Unsupported image format: ${ext}`);
      }

      const compressedStats = await fs.stat(compressedPath);
      const compressedSize = compressedStats.size;

      return {
        originalPath: inputPath,
        optimizedPath: compressedPath,
        originalSize,
        optimizedSize: compressedSize,
        compressionRatio: ((originalSize - compressedSize) / originalSize) * 100,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error(`Failed to compress image: ${error}`);
    }
  }

  /**
   * Delete optimized images
   */
  async deleteOptimizedImages(originalPath: string): Promise<void> {
    try {
      const filename = path.basename(originalPath, path.extname(originalPath));
      
      // Delete optimized versions
      const optimizedPattern = path.join(this.optimizedDir, `${filename}*`);
      const thumbnailPattern = path.join(this.thumbnailDir, `${filename}*`);

      // Note: In production, use a proper file deletion strategy
      // This is a simplified version
      console.log(`Would delete files matching: ${optimizedPattern}, ${thumbnailPattern}`);
    } catch (error) {
      console.error('Error deleting optimized images:', error);
    }
  }
}

// Singleton instance
export const imageOptimizationService = new ImageOptimizationService();
