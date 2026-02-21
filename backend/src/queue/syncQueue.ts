import Queue from 'bull';
import { prisma } from '../config/database';
import { flying411Service } from '../services/flying411.service';
import { logger } from '../utils/logger';

// Redis connection for job queue
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Job data types
interface SyncListingJob {
    type: 'sync-listing';
    listingId: string;
}

interface PullPricingJob {
    type: 'pull-pricing';
    partNumber: string;
}

interface BulkSyncJob {
    type: 'bulk-sync';
    listingIds: string[];
}

type SyncJobData = SyncListingJob | PullPricingJob | BulkSyncJob;

// Create sync queue
export const syncQueue = new Queue<SyncJobData>('flying411-sync', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 10000,
        },
        removeOnComplete: 50,
        removeOnFail: 50,
    },
});

/**
 * Add a single listing sync job to the queue
 */
export const addSyncJob = async (listingId: string) => {
    const job = await syncQueue.add('sync', {
        type: 'sync-listing',
        listingId,
    });

    logger.info(`Sync job queued for listing ${listingId}, job: ${job.id}`);
    return job;
};

/**
 * Add a pull-pricing job to the queue
 */
export const addPullPricingJob = async (partNumber: string) => {
    const job = await syncQueue.add('sync', {
        type: 'pull-pricing',
        partNumber,
    });

    logger.info(`Pull pricing job queued for part ${partNumber}, job: ${job.id}`);
    return job;
};

/**
 * Add a bulk sync job to the queue
 */
export const addBulkSyncJob = async (listingIds: string[]) => {
    const job = await syncQueue.add('sync', {
        type: 'bulk-sync',
        listingIds,
    });

    logger.info(`Bulk sync job queued for ${listingIds.length} listings, job: ${job.id}`);
    return job;
};

// Process jobs
syncQueue.process('sync', async (job) => {
    const { type } = job.data;

    switch (type) {
        case 'sync-listing': {
            const { listingId } = job.data as SyncListingJob;
            logger.info(`Processing sync for listing ${listingId}`);

            // Mark as PENDING_SYNC before processing
            await prisma.listing.update({
                where: { id: listingId },
                data: { syncStatus: 'PENDING_SYNC' },
            });

            await job.progress(20);

            const result = await flying411Service.syncListing(listingId);

            await job.progress(100);

            if (result.status === 'failed') {
                throw new Error(result.error || 'Sync failed');
            }

            return { listingId, externalId: result.externalId, status: result.status };
        }

        case 'pull-pricing': {
            const { partNumber } = job.data as PullPricingJob;
            logger.info(`Processing pull pricing for part ${partNumber}`);

            await job.progress(20);

            const pricing = await flying411Service.fetchMarketPricing(partNumber);

            await job.progress(100);

            return { partNumber, results: pricing.length };
        }

        case 'bulk-sync': {
            const { listingIds } = job.data as BulkSyncJob;
            logger.info(`Processing bulk sync for ${listingIds.length} listings`);

            const results = [];
            for (let i = 0; i < listingIds.length; i++) {
                const listingId = listingIds[i];

                await prisma.listing.update({
                    where: { id: listingId },
                    data: { syncStatus: 'PENDING_SYNC' },
                }).catch(() => {
                    // Listing may not exist; skip silently
                });

                const result = await flying411Service.syncListing(listingId);
                results.push(result);

                const progress = Math.round(((i + 1) / listingIds.length) * 100);
                await job.progress(progress);

                // Small delay between requests to avoid rate limiting
                if (i < listingIds.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }

            const succeeded = results.filter((r) => r.status === 'success').length;
            const failed = results.filter((r) => r.status === 'failed').length;

            logger.info(`Bulk sync complete: ${succeeded} succeeded, ${failed} failed`);
            return { total: listingIds.length, succeeded, failed };
        }

        default:
            throw new Error(`Unknown sync job type: ${type}`);
    }
});

// Queue event handlers
syncQueue.on('completed', async (job, result) => {
    const { type } = job.data;
    logger.info(`Sync job ${job.id} (${type}) completed:`, result);

    // For sync-listing jobs, ensure SYNCED status (syncListing already handles this,
    // but this is a safety net)
    if (type === 'sync-listing') {
        const { listingId } = job.data as SyncListingJob;
        try {
            const listing = await prisma.listing.findUnique({
                where: { id: listingId },
                select: { syncStatus: true },
            });
            if (listing && listing.syncStatus !== 'SYNCED') {
                await prisma.listing.update({
                    where: { id: listingId },
                    data: { syncStatus: 'SYNCED', syncError: null },
                });
            }
        } catch (err) {
            logger.error(`Failed to update sync status after completion for listing ${listingId}`, err);
        }
    }
});

syncQueue.on('failed', async (job, err) => {
    const { type } = job.data;
    logger.error(`Sync job ${job.id} (${type}) failed:`, err.message);

    // For sync-listing jobs, update status to SYNC_FAILED and create SyncLog entry on final failure
    if (type === 'sync-listing' && job.attemptsMade >= (job.opts.attempts || 3)) {
        const { listingId } = job.data as SyncListingJob;
        try {
            await prisma.listing.update({
                where: { id: listingId },
                data: {
                    syncStatus: 'SYNC_FAILED',
                    syncError: err.message,
                },
            });

            await prisma.syncLog.create({
                data: {
                    listingId,
                    action: 'sync',
                    direction: 'outbound',
                    status: 'failed',
                    error: `Queue job failed after ${job.attemptsMade} attempts: ${err.message}`,
                },
            });
        } catch (updateErr) {
            logger.error(`Failed to update sync status after failure for listing ${listingId}`, updateErr);
        }
    }
});

syncQueue.on('stalled', (job) => {
    logger.warn(`Sync job ${job.id} stalled`);
});

// Queue health check
export const getSyncQueueHealth = async () => {
    const [waiting, active, completed, failed] = await Promise.all([
        syncQueue.getWaitingCount(),
        syncQueue.getActiveCount(),
        syncQueue.getCompletedCount(),
        syncQueue.getFailedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        isPaused: await syncQueue.isPaused(),
    };
};

// Graceful shutdown
export const closeSyncQueue = async () => {
    await syncQueue.close();
};
