import { Prisma, PriceSource } from '@prisma/client';
import { prisma } from '../config/database';
import { priceIntelligenceService } from '../services/priceIntelligence.service';
import { logger } from '../utils/logger';

/**
 * Collects prices from all APPROVED listings that have a price and a partNumber
 * (stored in partData JSON). Skips recording if the price is unchanged since the
 * last PriceHistory entry for the same part + INTERNAL source.
 */
export async function collectPrices(): Promise<void> {
  logger.info('Price collection job started');

  const listings = await prisma.listing.findMany({
    where: {
      status: 'APPROVED',
      price: { gt: 0 },
      NOT: { partData: { equals: Prisma.DbNull } },
    },
    select: {
      id: true,
      price: true,
      partData: true,
      condition: true,
    },
  });

  let recorded = 0;
  let skipped = 0;
  let errors = 0;

  for (const listing of listings) {
    try {
      const partData = listing.partData as Record<string, unknown> | null;
      const partNumber = partData?.partNumber as string | undefined;

      if (!partNumber) {
        skipped++;
        continue;
      }

      const price = Number(listing.price);
      if (isNaN(price) || price <= 0) {
        skipped++;
        continue;
      }

      // Look up the Part record so we can check for duplicates
      const part = await prisma.part.findUnique({
        where: { partNumber },
      });

      if (!part) {
        skipped++;
        continue;
      }

      // Dedup: check if the latest PriceHistory entry for this part+INTERNAL
      // already has the same price — no need to record again
      const latestEntry = await prisma.priceHistory.findFirst({
        where: {
          partId: part.id,
          source: PriceSource.INTERNAL,
        },
        orderBy: { recordedAt: 'desc' },
      });

      if (latestEntry && Number(latestEntry.price) === price) {
        skipped++;
        continue;
      }

      await priceIntelligenceService.recordPrice({
        partNumber,
        price,
        source: PriceSource.INTERNAL,
        listingId: listing.id,
      });

      recorded++;
    } catch (err) {
      errors++;
      logger.error(`Price collection error for listing ${listing.id}:`, err);
    }
  }

  logger.info(
    `Price collection job completed: ${recorded} recorded, ${skipped} skipped, ${errors} errors (${listings.length} total listings)`
  );
}
