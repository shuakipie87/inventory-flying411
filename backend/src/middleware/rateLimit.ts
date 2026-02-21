import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Rate limiter for authentication endpoints
 * 5 attempts per minute per IP
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: {
        status: 'error',
        message: 'Too many authentication attempts. Please try again in 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        logger.warn(`Rate limit exceeded for auth: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many authentication attempts. Please try again in 1 minute.',
        });
    },
});

/**
 * Rate limiter for listing creation
 * 20 listings per hour per user
 */
export const listingCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        status: 'error',
        message: 'Listing creation limit reached. Maximum 20 listings per hour.',
    },
    keyGenerator: (req: Request) => {
        // Use user ID from auth if available, fallback to IP
        return (req as any).user?.id || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        logger.warn(`Rate limit exceeded for listings: ${(req as any).user?.id || req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Listing creation limit reached. Maximum 20 listings per hour.',
        });
    },
});

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: {
        status: 'error',
        message: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stricter limiter for sensitive operations
 * 10 per minute
 */
export const sensitiveOpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        status: 'error',
        message: 'Rate limit exceeded for this operation.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
