import { Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { addSyncJob } from '../queue/syncQueue';
import { logger } from '../utils/logger';

export const getPendingListings = async (req: AuthRequest, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        images: { orderBy: { order: 'asc' } },
        user: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ status: 'success', data: { listings } });
  } catch (error) {
    throw error;
  }
};

export const approveListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        status: 'APPROVED',
        publishedAt: new Date(),
      },
    });

    await prisma.review.create({
      data: {
        listingId: id,
        reviewerId: req.user!.id,
        action: 'APPROVE',
        comment: comment || 'Approved',
      },
    });

    // Record price to PriceHistory if listing has a matching part
    if (listing.serialNumber) {
        prisma.part.findUnique({ where: { partNumber: listing.serialNumber } })
            .then((part) => {
                if (part) {
                    return prisma.priceHistory.create({
                        data: {
                            partId: part.id,
                            price: listing.price,
                            condition: listing.condition,
                            source: 'INTERNAL',
                        },
                    });
                }
            })
            .catch((err) => {
                logger.error(`Failed to record price history for listing ${listing.id}:`, err);
            });
    }

    // Queue non-blocking sync for syncable categories
    const SYNCABLE_CATEGORIES = ['Aircraft', 'Engines', 'Parts'];
    if (SYNCABLE_CATEGORIES.includes(listing.category)) {
        addSyncJob(listing.id).catch((err) => {
            logger.error(`Failed to queue sync for listing ${listing.id}:`, err);
        });
    }

    res.json({ status: 'success', data: { listing } });
  } catch (error) {
    throw error;
  }
};

export const rejectListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    await prisma.review.create({
      data: {
        listingId: id,
        reviewerId: req.user!.id,
        action: 'REJECT',
        comment: reason,
      },
    });

    res.json({ status: 'success', data: { listing } });
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ status: 'success', data: { users } });
  } catch (error) {
    throw error;
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, username: true, isActive: true },
    });

    res.json({ status: 'success', data: { user: updated } });
  } catch (error) {
    throw error;
  }
};

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalListings, pendingListings, approvedListings] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.listing.count({ where: { status: 'APPROVED' } }),
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          totalListings,
          pendingListings,
          approvedListings,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};
