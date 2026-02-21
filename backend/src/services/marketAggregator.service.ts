import { prisma } from '../config/database';
import { vendorRegistry } from './vendors/vendorRegistry';
import { priceIntelligenceService } from './priceIntelligence.service';
import { logger } from '../utils/logger';

// --- Types ---

export interface VendorAvailability {
  vendorName: string;
  vendorCode: string;
  quantity: number;
  minPrice: number;
  maxPrice: number;
  condition?: string;
  lastSeen: Date;
}

export interface MarketAvailability {
  partNumber: string;
  totalQuantity: number;
  vendorCount: number;
  vendors: VendorAvailability[];
  lastUpdated: Date;
}

// --- Constants ---

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// --- Helpers ---

function decimalToNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  return Number(val);
}

/**
 * Build a MarketAvailability result from MarketInventory rows.
 */
function buildAvailabilityFromRows(
  partNumber: string,
  rows: Array<{
    vendor: { name: string; code: string };
    quantity: number;
    price: unknown;
    condition: string | null;
    lastSeen: Date;
    updatedAt: Date;
  }>
): MarketAvailability {
  const vendorMap = new Map<
    string,
    { name: string; code: string; prices: number[]; quantities: number[]; conditions: Set<string>; lastSeen: Date }
  >();

  for (const row of rows) {
    const code = row.vendor.code;
    const existing = vendorMap.get(code);
    const price = decimalToNumber(row.price);

    if (existing) {
      existing.prices.push(price);
      existing.quantities.push(row.quantity);
      if (row.condition) existing.conditions.add(row.condition);
      if (row.lastSeen > existing.lastSeen) existing.lastSeen = row.lastSeen;
    } else {
      vendorMap.set(code, {
        name: row.vendor.name,
        code,
        prices: [price],
        quantities: [row.quantity],
        conditions: row.condition ? new Set([row.condition]) : new Set(),
        lastSeen: row.lastSeen,
      });
    }
  }

  const vendors: VendorAvailability[] = [];
  let totalQuantity = 0;

  for (const entry of vendorMap.values()) {
    const qty = entry.quantities.reduce((a, b) => a + b, 0);
    totalQuantity += qty;
    vendors.push({
      vendorName: entry.name,
      vendorCode: entry.code,
      quantity: qty,
      minPrice: Math.min(...entry.prices),
      maxPrice: Math.max(...entry.prices),
      condition: entry.conditions.size > 0 ? Array.from(entry.conditions).join(', ') : undefined,
      lastSeen: entry.lastSeen,
    });
  }

  const latestUpdate = rows.length > 0
    ? new Date(Math.max(...rows.map((r) => r.updatedAt.getTime())))
    : new Date();

  return {
    partNumber,
    totalQuantity,
    vendorCount: vendors.length,
    vendors,
    lastUpdated: latestUpdate,
  };
}

// --- Service ---

class MarketAggregatorService {
  /**
   * Get market availability for a part number.
   * Returns cached data from MarketInventory if fresh (within 24h),
   * otherwise queries active vendor adapters and caches results.
   */
  async getMarketAvailability(partNumber: string): Promise<MarketAvailability> {
    const cutoff = new Date(Date.now() - CACHE_TTL_MS);

    // Check for fresh cached data
    const cachedRows = await prisma.marketInventory.findMany({
      where: {
        partNumber,
        updatedAt: { gte: cutoff },
      },
      include: {
        vendor: { select: { name: true, code: true } },
      },
    });

    if (cachedRows.length > 0) {
      logger.debug(`Market availability cache hit for ${partNumber}`);
      return buildAvailabilityFromRows(partNumber, cachedRows);
    }

    // Cache miss or stale — refresh from vendors
    logger.debug(`Market availability cache miss for ${partNumber}, querying vendors`);
    await this.refreshMarketData(partNumber);

    // Re-read from DB after refresh
    const freshRows = await prisma.marketInventory.findMany({
      where: { partNumber },
      include: {
        vendor: { select: { name: true, code: true } },
      },
    });

    if (freshRows.length > 0) {
      return buildAvailabilityFromRows(partNumber, freshRows);
    }

    // No data from any vendor
    return {
      partNumber,
      totalQuantity: 0,
      vendorCount: 0,
      vendors: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Force-refresh market data for a part number by querying all active vendor adapters.
   * Upserts results into MarketInventory and records prices to PriceHistory.
   */
  async refreshMarketData(partNumber: string): Promise<void> {
    const activeAdapters = await vendorRegistry.getActiveAdapters();

    if (activeAdapters.length === 0) {
      logger.warn(`No active vendor adapters available for market refresh of ${partNumber}`);
      return;
    }

    for (const adapter of activeAdapters) {
      const info = adapter.getVendorInfo();

      try {
        // Ensure vendor record exists in DB (find-or-skip — vendor must be seeded)
        const vendorRecord = await prisma.vendor.findUnique({
          where: { code: info.code },
        });

        if (!vendorRecord) {
          logger.warn(`Vendor record not found in DB for code "${info.code}" — skipping`);
          continue;
        }

        const parts = await adapter.searchParts({ partNumber });

        if (parts.length === 0) {
          logger.debug(`No results from vendor ${info.code} for ${partNumber}`);
          continue;
        }

        for (const part of parts) {
          // Upsert into MarketInventory using the unique constraint [partNumber, vendorId, vendorPartId]
          await prisma.marketInventory.upsert({
            where: {
              partNumber_vendorId_vendorPartId: {
                partNumber,
                vendorId: vendorRecord.id,
                vendorPartId: part.vendorPartId || '',
              },
            },
            update: {
              price: part.price,
              currency: part.currency,
              quantity: part.quantity,
              condition: part.condition ?? null,
              lastSeen: new Date(),
              sourceUrl: part.sourceUrl ?? null,
            },
            create: {
              partNumber,
              vendorId: vendorRecord.id,
              vendorPartId: part.vendorPartId || '',
              price: part.price,
              currency: part.currency,
              quantity: part.quantity,
              condition: part.condition ?? null,
              lastSeen: new Date(),
              sourceUrl: part.sourceUrl ?? null,
            },
          });

          // Record price to PriceHistory via priceIntelligence
          try {
            await priceIntelligenceService.recordPrice({
              partNumber,
              price: part.price,
              currency: part.currency,
              source: 'MARKET',
              vendorId: vendorRecord.id,
            });
          } catch (priceErr) {
            // Part may not exist in Part table — log and continue
            logger.debug(
              `Could not record price for ${partNumber} from ${info.code}: ${(priceErr as Error).message}`
            );
          }
        }

        logger.info(`Refreshed market data for ${partNumber} from ${info.code}: ${parts.length} result(s)`);
      } catch (err) {
        logger.error(`Error refreshing market data from ${info.code} for ${partNumber}`, {
          error: (err as Error).message,
        });
      }
    }
  }

  /**
   * Batch query: get market availability for multiple part numbers.
   * Uses cached MarketInventory data (no force refresh).
   */
  async getMarketOverview(partNumbers: string[]): Promise<Map<string, MarketAvailability>> {
    const result = new Map<string, MarketAvailability>();

    if (partNumbers.length === 0) {
      return result;
    }

    const rows = await prisma.marketInventory.findMany({
      where: {
        partNumber: { in: partNumbers },
      },
      include: {
        vendor: { select: { name: true, code: true } },
      },
    });

    // Group rows by partNumber
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      const existing = grouped.get(row.partNumber);
      if (existing) {
        existing.push(row);
      } else {
        grouped.set(row.partNumber, [row]);
      }
    }

    // Build availability for each part number (including those with no data)
    for (const pn of partNumbers) {
      const pnRows = grouped.get(pn);
      if (pnRows && pnRows.length > 0) {
        result.set(pn, buildAvailabilityFromRows(pn, pnRows));
      } else {
        result.set(pn, {
          partNumber: pn,
          totalQuantity: 0,
          vendorCount: 0,
          vendors: [],
          lastUpdated: new Date(),
        });
      }
    }

    return result;
  }
}

export const marketAggregatorService = new MarketAggregatorService();
