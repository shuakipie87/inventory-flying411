import { prisma } from '../config/database';
import { addSyncJob } from '../queue/syncQueue';
import { flying411Service } from './flying411.service';
import { logger } from '../utils/logger';

export type SyncStatus = 'pending' | 'synced' | 'failed';

/**
 * Trigger sync when a listing is approved — queues via Bull
 */
export const triggerApprovalSync = async (listingId: string): Promise<void> => {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { id: true, status: true },
        });

        if (!listing || listing.status !== 'APPROVED') {
            logger.warn(`Cannot sync listing ${listingId}: not approved`);
            return;
        }

        await addSyncJob(listingId);
        logger.info(`Listing ${listingId} queued for approval sync`);
    } catch (error) {
        logger.error(`Failed to queue approval sync for listing ${listingId}:`, error);
        throw error;
    }
};

/**
 * Trigger sync when listing is updated (price change, etc.) — queues via Bull
 */
export const triggerUpdateSync = async (listingId: string): Promise<void> => {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { id: true, status: true, flying411ListingId: true },
        });

        if (!listing || listing.status !== 'APPROVED' || !listing.flying411ListingId) {
            logger.debug(`Skipping update sync for listing ${listingId}`);
            return;
        }

        await addSyncJob(listingId);
        logger.info(`Listing ${listingId} queued for update sync`);
    } catch (error) {
        logger.error(`Failed to queue update sync for listing ${listingId}:`, error);
    }
};

/**
 * Trigger sync when listing is marked as sold
 */
export const triggerSoldSync = async (listingId: string): Promise<void> => {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
        });

        if (!listing?.flying411ListingId) {
            return;
        }

        await flying411Service.deleteListing(listing.flying411ListingId);
        logger.info(`Listing ${listingId} marked as sold on Flying411`);
    } catch (error) {
        logger.error(`Failed to sync sold status for listing ${listingId}:`, error);
    }
};

/**
 * Get sync health metrics
 */
export const getSyncHealth = async () => {
    const [synced, pending, failed, neverSynced] = await Promise.all([
        prisma.listing.count({ where: { syncStatus: 'SYNCED' } }),
        prisma.listing.count({ where: { syncStatus: { in: ['PENDING_SYNC', 'SYNCING'] } } }),
        prisma.listing.count({ where: { syncStatus: 'SYNC_FAILED' } }),
        prisma.listing.count({ where: { status: 'APPROVED', syncStatus: 'NEVER_SYNCED' } }),
    ]);

    const total = synced + pending + failed + neverSynced;
    return {
        synced,
        pending,
        failed,
        neverSynced,
        successRate: total > 0 ? ((synced / total) * 100).toFixed(1) : '0',
    };
};
