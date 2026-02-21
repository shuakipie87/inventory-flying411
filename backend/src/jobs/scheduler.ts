import cron from 'node-cron';
import { collectPrices } from './priceCollector.job';
import { logger } from '../utils/logger';

/**
 * Initializes all scheduled jobs.
 * Call once after routes are registered in server.ts.
 */
export function initScheduler(): void {
  const priceCollectionCron = process.env.PRICE_COLLECTION_CRON || '0 2 * * *';

  if (!cron.validate(priceCollectionCron)) {
    logger.error(`Invalid PRICE_COLLECTION_CRON expression: "${priceCollectionCron}" — scheduler not started`);
    return;
  }

  cron.schedule(priceCollectionCron, async () => {
    logger.info('Scheduled price collection job triggered');
    try {
      await collectPrices();
    } catch (err) {
      logger.error('Scheduled price collection job failed:', err);
    }
  });

  logger.info(`Scheduler initialized — price collection cron: "${priceCollectionCron}"`);
}
