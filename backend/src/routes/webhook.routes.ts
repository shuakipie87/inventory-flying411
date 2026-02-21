import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * Webhook secret for verifying requests from Flying411
 */
const WEBHOOK_SECRET = process.env.FLYING411_WEBHOOK_SECRET || '';

/**
 * Verify webhook signature using HMAC-SHA256
 */
const verifyWebhookSignature = (req: Request): boolean => {
    const signature = req.headers['x-flying411-signature'] as string;

    if (!WEBHOOK_SECRET) {
        logger.warn('Webhook secret not configured, rejecting request');
        return false;
    }

    if (!signature) {
        return false;
    }

    const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
};

/**
 * Zod schema for webhook payload validation
 */
const webhookPayloadSchema = z.object({
    event: z.enum([
        'listing.published',
        'listing.sold',
        'listing.expired',
        'listing.removed',
        'listing.updated',
    ]),
    data: z.object({
        externalId: z.string(),
        publishedAt: z.string().optional(),
        reason: z.string().optional(),
        updates: z.record(z.unknown()).optional(),
    }),
    timestamp: z.number().optional(),
});

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/webhooks/flying411
 * Receive status updates from Flying411
 */
router.post('/flying411', asyncHandler(async (req: Request, res: Response) => {
    // Verify webhook authenticity
    if (!verifyWebhookSignature(req)) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // Validate payload with Zod
    const parsed = webhookPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.warn('Invalid webhook payload', { errors: parsed.error.flatten() });
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const { event, data, timestamp } = parsed.data;

    // Replay protection
    if (timestamp) {
        const age = Date.now() - timestamp;
        if (age > REPLAY_WINDOW_MS) {
            logger.warn('Webhook replay detected', { timestamp, age });
            return res.status(400).json({ error: 'Request expired' });
        }
    }

    logger.info(`Received Flying411 webhook: ${event}`, { data });

    switch (event) {
        case 'listing.published':
            await handleListingPublished(data);
            break;

        case 'listing.sold':
            await handleListingSold(data);
            break;

        case 'listing.expired':
            await handleListingExpired(data);
            break;

        case 'listing.removed':
            await handleListingRemoved(data);
            break;

        case 'listing.updated':
            await handleListingUpdated(data);
            break;
    }

    // Create SyncLog for webhook event
    const listing = await prisma.listing.findFirst({
        where: { flying411ListingId: data.externalId },
        select: { id: true },
    });

    if (listing) {
        await prisma.syncLog.create({
            data: {
                listingId: listing.id,
                action: event,
                direction: 'inbound',
                status: 'success',
                externalId: data.externalId,
                metadata: data as any,
            },
        });
    }

    res.json({ received: true, event });
}));

/**
 * Handle listing.published event
 */
async function handleListingPublished(data: { externalId: string; publishedAt?: string }) {
    const { externalId, publishedAt } = data;

    await prisma.listing.updateMany({
        where: { flying411ListingId: externalId },
        data: {
            publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        },
    });

    logger.info(`Listing ${externalId} marked as published`);
}

/**
 * Handle listing.sold event
 */
async function handleListingSold(data: { externalId: string }) {
    const { externalId } = data;

    const listing = await prisma.listing.findFirst({
        where: { flying411ListingId: externalId },
    });

    if (listing) {
        await prisma.listing.update({
            where: { id: listing.id },
            data: {
                status: 'SOLD',
            },
        });

        logger.info(`Listing ${externalId} marked as sold`);
    }
}

/**
 * Handle listing.expired event
 */
async function handleListingExpired(data: { externalId: string }) {
    const { externalId } = data;

    await prisma.listing.updateMany({
        where: { flying411ListingId: externalId },
        data: {
            status: 'ARCHIVED',
        },
    });

    logger.info(`Listing ${externalId} marked as expired/archived`);
}

/**
 * Handle listing.removed event
 */
async function handleListingRemoved(data: { externalId: string; reason?: string }) {
    const { externalId, reason } = data;

    await prisma.listing.updateMany({
        where: { flying411ListingId: externalId },
        data: {
            status: 'DRAFT',
            flying411ListingId: null,
        },
    });

    logger.info(`Listing ${externalId} removed from Flying411: ${reason}`);
}

/**
 * Handle listing.updated event
 */
async function handleListingUpdated(data: { externalId: string; updates?: Record<string, unknown> }) {
    const { externalId, updates } = data;

    // Log updates but don't auto-update local data to prevent conflicts
    logger.info(`Listing ${externalId} updated on Flying411:`, updates);
}

/**
 * GET /api/webhooks/flying411/health
 * Health check for webhook endpoint
 */
router.get('/flying411/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        configured: !!WEBHOOK_SECRET,
        timestamp: new Date().toISOString(),
    });
});

export default router;
