import Queue from 'bull';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Redis connection for job queue
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create image processing queue
export const imageQueue = new Queue('image-processing', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// Job types
interface ImageProcessJob {
    imageId: string;
    filePath: string;
    operations: ('optimize' | 'thumbnail' | 'webp')[];
}

// Constants
const WEBP_QUALITY = 85;
const THUMBNAIL_SIZE = 300;
const MAX_WIDTH = 2000;
const MAX_FILE_SIZE = 500 * 1024; // 500KB

/**
 * Add an image to the processing queue
 */
export const queueImageProcessing = async (
    imageId: string,
    filePath: string,
    operations: ('optimize' | 'thumbnail' | 'webp')[] = ['optimize', 'thumbnail', 'webp']
) => {
    const job = await imageQueue.add('process', {
        imageId,
        filePath,
        operations,
    } as ImageProcessJob);

    logger.info(`Image queued for processing: ${imageId}, job: ${job.id}`);
    return job;
};

// Process jobs
imageQueue.process('process', async (job) => {
    const { imageId, filePath, operations } = job.data as ImageProcessJob;
    logger.info(`Processing image: ${imageId}`);

    try {
        const image = await prisma.listingImage.findUnique({
            where: { id: imageId },
        });

        if (!image) {
            throw new Error(`Image not found: ${imageId}`);
        }

        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);

        // Load image with sharp
        let sharpInstance = sharp(filePath);
        const metadata = await sharpInstance.metadata();

        const updates: Partial<{ thumbnailPath: string; path: string }> = {};

        // Optimize: resize if too large
        if (operations.includes('optimize') && metadata.width && metadata.width > MAX_WIDTH) {
            await job.progress(20);
            sharpInstance = sharpInstance.resize(MAX_WIDTH, null, {
                withoutEnlargement: true,
            });
        }

        // Convert to WebP
        if (operations.includes('webp')) {
            await job.progress(40);
            const webpPath = path.join(dir, `${baseName}.webp`);

            await sharpInstance
                .webp({ quality: WEBP_QUALITY })
                .toFile(webpPath);

            updates.path = webpPath;
            logger.info(`Converted to WebP: ${webpPath}`);
        }

        // Generate thumbnail
        if (operations.includes('thumbnail')) {
            await job.progress(70);
            const thumbPath = path.join(dir, `${baseName}_thumb.webp`);

            await sharp(filePath)
                .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
                    fit: 'cover',
                    position: 'center',
                })
                .webp({ quality: 80 })
                .toFile(thumbPath);

            updates.thumbnailPath = thumbPath;
            logger.info(`Generated thumbnail: ${thumbPath}`);
        }

        // Update database
        if (Object.keys(updates).length > 0) {
            await prisma.listingImage.update({
                where: { id: imageId },
                data: updates,
            });
        }

        await job.progress(100);
        logger.info(`Image processing complete: ${imageId}`);

        return { imageId, updates };
    } catch (error) {
        logger.error(`Image processing failed: ${imageId}`, error);
        throw error;
    }
});

// Queue event handlers
imageQueue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed:`, result);
});

imageQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err.message);
});

imageQueue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled`);
});

// Queue health check
export const getQueueHealth = async () => {
    const [waiting, active, completed, failed] = await Promise.all([
        imageQueue.getWaitingCount(),
        imageQueue.getActiveCount(),
        imageQueue.getCompletedCount(),
        imageQueue.getFailedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        isPaused: await imageQueue.isPaused(),
    };
};

// Graceful shutdown
export const closeQueue = async () => {
    await imageQueue.close();
};
