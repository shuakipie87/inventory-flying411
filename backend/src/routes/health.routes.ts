import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { flying411Service } from '../services/flying411.service';
import { getSyncHealth } from '../services/syncTrigger';
import { logger } from '../utils/logger';

const router = Router();

interface HealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database: HealthStatus;
        redis?: HealthStatus;
        flying411Api: HealthStatus;
        sync: SyncHealthStatus;
    };
}

interface HealthStatus {
    status: 'up' | 'down';
    message?: string;
    responseTime?: number;
}

interface SyncHealthStatus extends HealthStatus {
    metrics?: {
        synced: number;
        pending: number;
        failed: number;
        neverSynced: number;
        successRate: string;
    };
}

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'flying411-inventory-api',
        version: process.env.npm_package_version || '1.0.0',
    });
});

/**
 * GET /api/health/detailed
 * Comprehensive health check with all dependencies
 */
router.get('/detailed', async (_req: Request, res: Response) => {
    const startTime = Date.now();
    const healthCheck: HealthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database: { status: 'down' },
            flying411Api: { status: 'down' },
            sync: { status: 'down' },
        },
    };

    // Check database
    const dbStart = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        healthCheck.checks.database = {
            status: 'up',
            responseTime: Date.now() - dbStart,
        };
    } catch (error: any) {
        healthCheck.checks.database = {
            status: 'down',
            message: error.message,
        };
        healthCheck.status = 'unhealthy';
    }

    // Check Redis (if configured)
    if (process.env.REDIS_URL) {
        const redisStart = Date.now();
        try {
            // Import redis client if available
            const { getRedisClient } = await import('../config/redis');
            const redis = getRedisClient();
            await redis.ping();
            healthCheck.checks.redis = {
                status: 'up',
                responseTime: Date.now() - redisStart,
            };
        } catch (error: any) {
            healthCheck.checks.redis = {
                status: 'down',
                message: error.message,
            };
            healthCheck.status = 'degraded';
        }
    }

    // Check Flying411 API
    const apiStart = Date.now();
    try {
        const isHealthy = await flying411Service.healthCheck();
        healthCheck.checks.flying411Api = {
            status: isHealthy ? 'up' : 'down',
            responseTime: Date.now() - apiStart,
        };
        if (!isHealthy) {
            healthCheck.status = 'degraded';
        }
    } catch (error: any) {
        healthCheck.checks.flying411Api = {
            status: 'down',
            message: error.message,
        };
        healthCheck.status = 'degraded';
    }

    // Check sync system health
    try {
        const syncMetrics = await getSyncHealth();
        healthCheck.checks.sync = {
            status: 'up',
            metrics: syncMetrics,
        };

        // Mark as degraded if too many failures
        if (syncMetrics.failed > 10 || parseFloat(syncMetrics.successRate) < 80) {
            healthCheck.status = 'degraded';
        }
    } catch (error: any) {
        healthCheck.checks.sync = {
            status: 'down',
            message: error.message,
        };
        healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
});

/**
 * GET /api/health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ ready: true });
    } catch (error) {
        res.status(503).json({ ready: false });
    }
});

/**
 * GET /api/health/live
 * Kubernetes liveness probe
 */
router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({ alive: true });
});

export default router;
