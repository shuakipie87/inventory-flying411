import Redis from 'ioredis';
import { logger } from '../utils/logger';

const BLACKLIST_PREFIX = 'bl:';

let redisClient: Redis | null = null;

/**
 * Get or create the singleton Redis client.
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });
  }
  return redisClient;
};

/**
 * Add a token to the blacklist with a TTL (in seconds).
 * The TTL should match the token's remaining lifetime so the key
 * auto-expires once the token would have expired anyway.
 */
export const blacklistToken = async (token: string, ttlSeconds: number): Promise<void> => {
  const client = getRedisClient();
  const key = `${BLACKLIST_PREFIX}${token}`;
  await client.set(key, '1', 'EX', ttlSeconds);
};

/**
 * Check whether a token has been blacklisted.
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const client = getRedisClient();
  const key = `${BLACKLIST_PREFIX}${token}`;
  const result = await client.get(key);
  return result !== null;
};

/**
 * Gracefully close the Redis connection (for shutdown hooks).
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
