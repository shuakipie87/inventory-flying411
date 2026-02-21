import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { geminiService } from '../services/gemini.service';
import { unsplashService } from '../services/unsplash.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export const suggestPrice = async (req: AuthRequest, res: Response) => {
    try {
        const { title, category, condition, description } = req.body;

        if (!title || !category || !condition) {
            return res.status(400).json({
                message: 'Title, category, and condition are required',
            });
        }

        const suggestion = await geminiService.suggestPrice({
            title,
            category,
            condition,
            description,
        });

        res.json({
            status: 200,
            data: { suggestion },
        });
    } catch (error: any) {
        logger.error('Price suggestion error:', error.message);
        res.status(500).json({
            message: error.message || 'Failed to generate price suggestion',
        });
    }
};

export const suggestImages = async (req: AuthRequest, res: Response) => {
    try {
        const { title, category, description } = req.body;

        if (!title || !category) {
            return res.status(400).json({
                message: 'Title and category are required',
            });
        }

        // Use Gemini to generate optimal search keywords
        const { keywords } = await geminiService.generateSearchKeywords({
            title,
            category,
            description,
        });

        // Search Unsplash with the primary keyword
        const primaryQuery = keywords[0] || `${category} aviation`;
        const images = await unsplashService.searchPhotos(primaryQuery, 8);

        res.json({
            status: 200,
            data: { keywords, images },
        });
    } catch (error: any) {
        logger.error('Image suggestion error:', error.message);
        res.status(500).json({
            message: error.message || 'Failed to generate image suggestions',
        });
    }
};

export const downloadImage = async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrl, listingId } = req.body;

        if (!imageUrl || !listingId) {
            return res.status(400).json({
                message: 'imageUrl and listingId are required',
            });
        }

        // Verify listing belongs to user
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: { images: true },
        });

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Download image from Unsplash
        const imageBuffer = await unsplashService.downloadPhoto(imageUrl);

        // Save to uploads directory
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const thumbnailDir = path.join(uploadDir, 'thumbnails');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.mkdir(thumbnailDir, { recursive: true });

        const filename = `${crypto.randomUUID()}.jpg`;
        const filePath = path.join(uploadDir, filename);
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

        // Save and process with sharp
        const sharp = (await import('sharp')).default;

        // Save optimized main image
        await sharp(imageBuffer)
            .resize(1920, null, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toFile(filePath);

        // Create thumbnail
        await sharp(imageBuffer)
            .resize(300, 300, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        // Get file stats
        const stats = await fs.stat(filePath);
        const metadata = await sharp(filePath).metadata();

        // Determine if this should be primary (first image)
        const isPrimary = listing.images.length === 0;

        // Create database record
        const image = await prisma.listingImage.create({
            data: {
                filename,
                originalName: 'unsplash-image.jpg',
                mimeType: 'image/jpeg',
                size: stats.size,
                path: filePath,
                thumbnailPath: path.join('thumbnails', thumbnailFilename),
                isPrimary,
                order: listing.images.length,
                processed: true,
                listingId,
            },
        });

        res.json({
            status: 200,
            message: 'Image downloaded and added to listing',
            data: {
                image: {
                    id: image.id,
                    filename: image.filename,
                    thumbnailPath: image.thumbnailPath,
                    isPrimary: image.isPrimary,
                },
            },
        });
    } catch (error: any) {
        logger.error('Image download error:', error.message);
        res.status(500).json({
            message: error.message || 'Failed to download and save image',
        });
    }
};
