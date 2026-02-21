import { Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { triggerUpdateSync } from '../services/syncTrigger';
import { flying411Service } from '../services/flying411.service';
import { priceIntelligenceService } from '../services/priceIntelligence.service';
import { PriceSource } from '@prisma/client';
import { logger } from '../utils/logger';

export const getAllListings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;

    const where: any = { status: 'APPROVED' };

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        images: { orderBy: { order: 'asc' } },
        user: { select: { username: true } },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.listing.count({ where });

    res.json({
      status: 'success',
      data: { listings, pagination: { page: Number(page), limit: Number(limit), total } },
    });
  } catch (error) {
    throw error;
  }
};

export const getListingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        user: { select: { username: true, email: true } },
      },
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({ status: 'success', data: { listing } });
  } catch (error) {
    throw error;
  }
};

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, price, category, subcategory, condition, quantity,
      year, totalTime, engineInfo, location,
      manufacturer, serialNumber, registrationNo, city, state, country, currency,
      aircraftData, engineData, partData,
    } = req.body;

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price,
        category,
        subcategory,
        condition,
        quantity: quantity || 1,
        year: year || undefined,
        totalTime: totalTime || undefined,
        engineInfo: engineInfo || undefined,
        location: location || undefined,
        manufacturer: manufacturer || undefined,
        serialNumber: serialNumber || undefined,
        registrationNo: registrationNo || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        currency: currency || undefined,
        aircraftData: aircraftData || undefined,
        engineData: engineData || undefined,
        partData: partData || undefined,
        userId: req.user!.id,
        status: 'DRAFT',
      },
      include: { images: true },
    });

    // Auto-record price if listing has price and partNumber
    const createdPartNumber = (partData as Record<string, unknown> | undefined)?.partNumber as string | undefined;
    if (price && createdPartNumber) {
      priceIntelligenceService.recordPrice({
        partNumber: createdPartNumber,
        price: Number(price),
        source: PriceSource.INTERNAL,
        listingId: listing.id,
      }).catch((err) => {
        logger.error(`Auto-record price failed for listing ${listing.id}:`, err);
      });
    }

    res.status(201).json({ status: 'success', data: { listing } });
  } catch (error) {
    throw error;
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    if (listing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'title', 'description', 'price', 'category', 'subcategory',
      'condition', 'year', 'totalTime', 'engineInfo', 'location', 'quantity',
      'manufacturer', 'serialNumber', 'registrationNo', 'city', 'state', 'country', 'currency',
      'aircraftData', 'engineData', 'partData',
    ] as const;

    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data,
      include: { images: true },
    });

    if (updated.flying411ListingId) {
        triggerUpdateSync(updated.id).catch((err) => {
            logger.error(`Update sync failed for listing ${updated.id}:`, err);
        });
    }

    // Auto-record price if updated listing has price and partNumber
    const updatedPartData = updated.partData as Record<string, unknown> | null;
    const updatedPartNumber = updatedPartData?.partNumber as string | undefined;
    if (updated.price && updatedPartNumber) {
      priceIntelligenceService.recordPrice({
        partNumber: updatedPartNumber,
        price: Number(updated.price),
        source: PriceSource.INTERNAL,
        listingId: updated.id,
      }).catch((err) => {
        logger.error(`Auto-record price failed for listing ${updated.id}:`, err);
      });
    }

    res.json({ status: 'success', data: { listing: updated } });
  } catch (error) {
    throw error;
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    if (listing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    if (listing.flying411ListingId) {
        await flying411Service.deleteListing(listing.flying411ListingId).catch((err) => {
            logger.error(`Failed to unsync before delete:`, err);
        });
    }

    await prisma.listing.delete({ where: { id } });

    res.json({ status: 'success', message: 'Listing deleted successfully' });
  } catch (error) {
    throw error;
  }
};

export const uploadImages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    // Verify listing exists and user owns it
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    if (listing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    // Import image processor
    const { imageProcessor } = await import('../services/imageProcessor');

    // Process all uploaded images
    const processedImages = await imageProcessor.processMultipleImages(files);

    // Get current max order for this listing
    const maxOrderImage = await prisma.listingImage.findFirst({
      where: { listingId: id },
      orderBy: { order: 'desc' },
    });

    const startOrder = maxOrderImage ? maxOrderImage.order + 1 : 0;

    // Check if listing has any images (first image should be primary)
    const existingImagesCount = await prisma.listingImage.count({
      where: { listingId: id },
    });

    // Create database records
    const imageRecords = await Promise.all(
      processedImages.map((img, index) =>
        prisma.listingImage.create({
          data: {
            listingId: id,
            filename: img.filename,
            originalName: img.originalName,
            mimeType: img.mimeType,
            size: img.size,
            path: img.path,
            thumbnailPath: img.thumbnailPath,
            order: startOrder + index,
            isPrimary: existingImagesCount === 0 && index === 0,
          },
        })
      )
    );

    res.status(201).json({
      status: 'success',
      data: { images: imageRecords },
      message: `${imageRecords.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, imageId } = req.params;

    // Find the image
    const image = await prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: true },
    });

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    if (image.listingId !== id) {
      throw new AppError('Image does not belong to this listing', 400);
    }

    // Check authorization
    if (image.listing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    // Delete from filesystem
    const { imageProcessor } = await import('../services/imageProcessor');
    await imageProcessor.deleteImage(image.filename);

    // If this was the primary image, set another image as primary
    if (image.isPrimary) {
      const nextImage = await prisma.listingImage.findFirst({
        where: {
          listingId: id,
          id: { not: imageId },
        },
        orderBy: { order: 'asc' },
      });

      if (nextImage) {
        await prisma.listingImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    // Delete from database
    await prisma.listingImage.delete({ where: { id: imageId } });

    res.json({
      status: 'success',
      message: 'Image deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

export const submitForApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    if (listing.userId !== req.user!.id) {
      throw new AppError('Unauthorized', 403);
    }

    // Validation: listing must have at least one image
    if (listing.images.length === 0) {
      throw new AppError('Listing must have at least one image before submission', 400);
    }

    // Only DRAFT or REJECTED listings can be submitted
    if (!['DRAFT', 'REJECTED'].includes(listing.status)) {
      throw new AppError(`Cannot submit listing with status: ${listing.status}`, 400);
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        rejectionReason: null, // Clear previous rejection reason
      },
      include: { images: true },
    });

    res.json({
      status: 'success',
      data: { listing: updated },
      message: 'Listing submitted for approval',
    });
  } catch (error) {
    throw error;
  }
};

export const publishListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new AppError('Listing not found', 404);
    }

    if (listing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    // Only APPROVED listings can be published
    if (listing.status !== 'APPROVED') {
      throw new AppError('Only approved listings can be published', 400);
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        publishedAt: new Date(),
      },
      include: { images: true },
    });

    res.json({
      status: 'success',
      data: { listing: updated },
      message: 'Listing published successfully',
    });
  } catch (error) {
    throw error;
  }
};

export const setPrimaryImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, imageId } = req.params;

    // Find the image
    const image = await prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: true },
    });

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    if (image.listingId !== id) {
      throw new AppError('Image does not belong to this listing', 400);
    }

    // Check authorization
    if (image.listing.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    // Update: unset all primary images for this listing, then set the new one
    await prisma.$transaction([
      prisma.listingImage.updateMany({
        where: { listingId: id },
        data: { isPrimary: false },
      }),
      prisma.listingImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    res.json({
      status: 'success',
      message: 'Primary image updated',
    });
  } catch (error) {
    throw error;
  }
};
