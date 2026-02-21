import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const CACHE_PREFIX = 'cache:';

// Default TTL: 5 minutes (in seconds for Redis)
const DEFAULT_TTL = 5 * 60;

/**
 * Generate cache key from request
 */
const getCacheKey = (req: Request): string => {
  return `${CACHE_PREFIX}${req.method}:${req.originalUrl}`;
};

/**
 * Clear cache for a specific pattern, or flush all cache keys.
 */
export const clearCache = async (pattern?: string): Promise<void> => {
  try {
    const redis = getRedisClient();

    if (!pattern) {
      // Delete all cache keys
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return;
    }

    const keys = await redis.keys(`${CACHE_PREFIX}*${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Error clearing cache', { error });
  }
};

/**
 * Caching middleware factory.
 * @param ttl - Time to live in seconds (default 300 = 5 minutes)
 */
export const cacheMiddleware = (ttl: number = DEFAULT_TTL) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = getCacheKey(req);

    try {
      const redis = getRedisClient();
      const cached = await redis.get(key);

      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return res.json(JSON.parse(cached));
      }
    } catch (error) {
      // Redis unavailable — fall through to handler
      logger.warn('Redis cache read failed, skipping cache', { error });
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const redis = getRedisClient();
          redis.set(key, JSON.stringify(body), 'EX', ttl).catch((err) => {
            logger.warn('Redis cache write failed', { error: err });
          });
          logger.debug(`Cache set: ${key}`);
        } catch (error) {
          logger.warn('Redis cache write failed', { error });
        }
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache statistics
 */
export const getCacheStats = async () => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    return {
      size: keys.length,
      keys: keys.slice(0, 20).map((k) => k.replace(CACHE_PREFIX, '')),
    };
  } catch (error) {
    return { size: 0, keys: [], error: 'Redis unavailable' };
  }
};
