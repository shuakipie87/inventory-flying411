import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

export interface ProcessedImage {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  thumbnailPath: string;
  width: number;
  height: number;
}

export class ImageProcessor {
  private uploadDir: string;
  private thumbnailDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
  }

  async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating directories:', error);
      throw error;
    }
  }

  async processImage(file: Express.Multer.File): Promise<ProcessedImage> {
    const filePath = file.path;
    const filename = file.filename;
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
    const tmpPath = filePath + '.tmp';

    try {
      await this.ensureDirectories();

      // Get image metadata
      const metadata = await sharp(filePath).metadata();

      // Process main image: optimize and resize if too large
      const maxWidth = 1920;

      let imageProcessing = sharp(filePath);

      if (metadata.width && metadata.width > maxWidth) {
        imageProcessing = imageProcessing.resize(maxWidth, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Optimize and save main image to a temp file first
      await imageProcessing
        .jpeg({ quality: 85, progressive: true })
        .toFile(tmpPath);

      // Replace original with optimized
      await fs.rename(tmpPath, filePath);

      // Create thumbnail (300x300)
      await sharp(filePath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Get final file size
      const stats = await fs.stat(filePath);
      const finalMetadata = await sharp(filePath).metadata();

      return {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: stats.size,
        path: filePath,
        thumbnailPath: path.join('thumbnails', thumbnailFilename),
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
      };
    } catch (error) {
      // Clean up any partial files left behind by a failed processing step
      for (const partialFile of [tmpPath, thumbnailPath]) {
        try {
          await fs.unlink(partialFile);
        } catch {
          // File may not exist if failure happened before it was created
        }
      }
      logger.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  async processMultipleImages(
    files: Express.Multer.File[]
  ): Promise<ProcessedImage[]> {
    const processed: ProcessedImage[] = [];

    for (const file of files) {
      try {
        const processedImage = await this.processImage(file);
        processed.push(processedImage);
      } catch (error) {
        logger.error(`Error processing file ${file.originalname}:`, error);
        // Continue processing other files
      }
    }

    return processed;
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}`);

      // Delete main image
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.warn(`Could not delete main image: ${filename}`);
      }

      // Delete thumbnail
      try {
        await fs.unlink(thumbnailPath);
      } catch (error) {
        logger.warn(`Could not delete thumbnail: ${filename}`);
      }
    } catch (error) {
      logger.error('Error deleting image:', error);
      throw error;
    }
  }

  async deleteMultipleImages(filenames: string[]): Promise<void> {
    for (const filename of filenames) {
      try {
        await this.deleteImage(filename);
      } catch (error) {
        logger.error(`Error deleting image ${filename}:`, error);
      }
    }
  }
}

export const imageProcessor = new ImageProcessor();
