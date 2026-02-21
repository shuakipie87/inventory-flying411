import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { flying411Service } from '../services/flying411.service';
import { getSyncHealth } from '../services/syncTrigger';
import { logger } from '../utils/logger';

const SYNCABLE_CATEGORIES = ['Aircraft', 'Engines', 'Parts'];

export const getSyncStats = async (req: AuthRequest, res: Response) => {
  try {
    const [health, totalSyncable, synced, unsynced, failed] = await Promise.all([
      getSyncHealth(),
      prisma.listing.count({
        where: { status: 'APPROVED', category: { in: SYNCABLE_CATEGORIES } },
      }),
      prisma.listing.count({
        where: {
          status: 'APPROVED',
          category: { in: SYNCABLE_CATEGORIES },
          syncStatus: 'SYNCED',
        },
      }),
      prisma.listing.count({
        where: {
          status: 'APPROVED',
          category: { in: SYNCABLE_CATEGORIES },
          syncStatus: 'NEVER_SYNCED',
        },
      }),
      prisma.listing.count({
        where: {
          status: 'APPROVED',
          category: { in: SYNCABLE_CATEGORIES },
          syncStatus: 'SYNC_FAILED',
        },
      }),
    ]);

    res.json({
      status: 'success',
      data: { totalSyncable, synced, unsynced, failed, health },
    });
  } catch (error) {
    logger.error('Failed to get sync stats:', error);
    throw error;
  }
};

export const checkApiHealth = async (req: AuthRequest, res: Response) => {
  try {
    const isHealthy = await flying411Service.healthCheck();
    res.json({
      status: 'success',
      data: { healthy: isHealthy, checkedAt: new Date().toISOString() },
    });
  } catch (error) {
    res.json({
      status: 'success',
      data: { healthy: false, checkedAt: new Date().toISOString() },
    });
  }
};

export const getSyncableListings = async (req: AuthRequest, res: Response) => {
  try {
    const {
      syncStatus = 'all',
      search = '',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'APPROVED',
      category: { in: SYNCABLE_CATEGORIES },
    };

    if (syncStatus === 'synced') {
      where.syncStatus = 'SYNCED';
    } else if (syncStatus === 'unsynced') {
      where.syncStatus = 'NEVER_SYNCED';
    } else if (syncStatus === 'failed') {
      where.syncStatus = 'SYNC_FAILED';
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          user: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: {
        listings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get syncable listings:', error);
    throw error;
  }
};

export const syncSingleListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return res.status(404).json({ status: 'error', message: 'Listing not found' });
    }
    if (listing.status !== 'APPROVED') {
      return res.status(400).json({ status: 'error', message: 'Listing must be APPROVED to sync' });
    }
    if (!SYNCABLE_CATEGORIES.includes(listing.category)) {
      return res.status(400).json({ status: 'error', message: `Category "${listing.category}" is not syncable` });
    }

    const result = await flying411Service.syncListing(id);

    if (result.status === 'success') {
      await prisma.auditLog.create({
        data: {
          action: 'sync_listing',
          entityType: 'listing',
          entityId: id,
          adminId: req.user!.id,
          details: { externalId: result.externalId },
        },
      });
    }

    res.json({ status: 'success', data: { result } });
  } catch (error) {
    logger.error('Failed to sync listing:', error);
    throw error;
  }
};

export const unsyncListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return res.status(404).json({ status: 'error', message: 'Listing not found' });
    }
    if (!listing.flying411ListingId) {
      return res.status(400).json({ status: 'error', message: 'Listing is not synced' });
    }

    const result = await flying411Service.deleteListing(listing.flying411ListingId);

    await prisma.listing.update({
      where: { id },
      data: {
        flying411ListingId: null,
        syncedAt: null,
        syncStatus: 'NEVER_SYNCED',
        syncError: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'unsync_listing',
        entityType: 'listing',
        entityId: id,
        adminId: req.user!.id,
        details: { previousExternalId: listing.flying411ListingId },
      },
    });

    res.json({ status: 'success', data: { result } });
  } catch (error) {
    logger.error('Failed to unsync listing:', error);
    throw error;
  }
};

export const syncBulkListings = async (req: AuthRequest, res: Response) => {
  try {
    const { listingIds } = req.body;

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'listingIds array is required' });
    }

    if (listingIds.length > 50) {
      return res.status(400).json({ status: 'error', message: 'Maximum 50 items per batch' });
    }

    // Validate all listings
    const listings = await prisma.listing.findMany({
      where: {
        id: { in: listingIds },
        status: 'APPROVED',
        category: { in: SYNCABLE_CATEGORIES },
      },
      select: { id: true },
    });

    const validIds = listings.map((l) => l.id);
    const results = await flying411Service.syncMultipleListings(validIds);

    // Create audit logs for successful syncs
    for (const result of results) {
      if (result.status === 'success') {
        await prisma.auditLog.create({
          data: {
            action: 'sync_listing',
            entityType: 'listing',
            entityId: result.listingId,
            adminId: req.user!.id,
            details: { externalId: result.externalId, bulk: true },
          },
        });
      }
    }

    const succeeded = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    res.json({
      status: 'success',
      data: { results, summary: { total: results.length, succeeded, failed } },
    });
  } catch (error) {
    logger.error('Failed to bulk sync:', error);
    throw error;
  }
};

export const syncAllUnsynced = async (req: AuthRequest, res: Response) => {
  try {
    const unsynced = await prisma.listing.findMany({
      where: {
        status: 'APPROVED',
        category: { in: SYNCABLE_CATEGORIES },
        syncStatus: 'NEVER_SYNCED',
      },
      select: { id: true },
    });

    if (unsynced.length === 0) {
      return res.json({
        status: 'success',
        data: { results: [], summary: { total: 0, succeeded: 0, failed: 0 } },
      });
    }

    const ids = unsynced.map((l) => l.id);

    // Process in chunks of 50
    const results: any[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const chunkResults = await flying411Service.syncMultipleListings(chunk);
      results.push(...chunkResults);
    }

    for (const result of results) {
      if (result.status === 'success') {
        await prisma.auditLog.create({
          data: {
            action: 'sync_listing',
            entityType: 'listing',
            entityId: result.listingId,
            adminId: req.user!.id,
            details: { externalId: result.externalId, syncAll: true },
          },
        });
      }
    }

    const succeeded = results.filter((r: any) => r.status === 'success').length;
    const failed = results.filter((r: any) => r.status === 'failed').length;

    res.json({
      status: 'success',
      data: { results, summary: { total: results.length, succeeded, failed } },
    });
  } catch (error) {
    logger.error('Failed to sync all:', error);
    throw error;
  }
};
