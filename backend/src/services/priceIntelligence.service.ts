import { PriceSource, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// --- Types ---

export interface PriceRange {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
  trend: 'rising' | 'falling' | 'stable';
  currency: string;
  sources: { source: string; count: number }[];
}

export interface PricePoint {
  date: string;
  price: number;
  source: string;
  vendorName?: string;
}

export interface MarketComparison {
  userPrice: number;
  marketAvg: number;
  percentile: number;
  recommendation: string;
}

export interface RecordPriceData {
  partNumber: string;
  price: number;
  currency?: string;
  source: PriceSource;
  vendorId?: string;
  listingId?: string;
}

// --- Helpers ---

function computeMedian(sorted: number[]): number {
  const len = sorted.length;
  if (len === 0) return 0;
  const mid = Math.floor(len / 2);
  return len % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function decimalToNumber(val: Prisma.Decimal | number): number {
  return typeof val === 'number' ? val : Number(val);
}

// --- Service ---

class PriceIntelligenceService {
  /**
   * Aggregate price data for a given part number across PriceHistory,
   * active Listings, and MarketInventory.
   */
  async getPriceRange(partNumber: string, months: number = 12): Promise<PriceRange | null> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    // Find the Part record so we can query PriceHistory (linked by partId)
    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    // 1. PriceHistory prices (requires Part record)
    let historyPrices: { price: number; source: PriceSource }[] = [];
    if (part) {
      const historyRows = await prisma.priceHistory.findMany({
        where: {
          partId: part.id,
          recordedAt: { gte: cutoff },
        },
        select: { price: true, source: true },
      });
      historyPrices = historyRows.map((r) => ({
        price: decimalToNumber(r.price),
        source: r.source,
      }));
    }

    // 2. Active Listing prices where partData JSON contains matching partNumber,
    //    or where serialNumber matches (common pattern for parts)
    const listingRows = await prisma.listing.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { partData: { path: ['partNumber'], equals: partNumber } },
          { serialNumber: partNumber },
        ],
      },
      select: { price: true },
    });
    const listingPrices = listingRows.map((r) => ({
      price: decimalToNumber(r.price),
      source: 'INTERNAL' as PriceSource,
    }));

    // 3. MarketInventory prices (linked by partNumber string directly)
    const marketRows = await prisma.marketInventory.findMany({
      where: { partNumber },
      select: { price: true },
    });
    const marketPrices = marketRows.map((r) => ({
      price: decimalToNumber(r.price),
      source: 'MARKET' as PriceSource,
    }));

    // Combine all sources
    const all = [...historyPrices, ...listingPrices, ...marketPrices];

    if (all.length === 0) {
      return null;
    }

    const prices = all.map((p) => p.price).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);

    // Source breakdown
    const sourceCounts = new Map<string, number>();
    for (const entry of all) {
      const s = entry.source;
      sourceCounts.set(s, (sourceCounts.get(s) || 0) + 1);
    }

    // Trend: compare avg of last 3 months vs previous 3 months using PriceHistory only
    const trend = part ? await this.computeTrend(part.id) : 'stable' as const;

    return {
      min: prices[0],
      max: prices[prices.length - 1],
      avg: Math.round((sum / prices.length) * 100) / 100,
      median: Math.round(computeMedian(prices) * 100) / 100,
      count: prices.length,
      trend,
      currency: 'USD',
      sources: Array.from(sourceCounts.entries()).map(([source, count]) => ({ source, count })),
    };
  }

  /**
   * Return chronological price points from PriceHistory for a given part number.
   */
  async getPriceTimeline(partNumber: string, months: number = 12): Promise<PricePoint[]> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (!part) {
      return [];
    }

    const rows = await prisma.priceHistory.findMany({
      where: {
        partId: part.id,
        recordedAt: { gte: cutoff },
      },
      orderBy: { recordedAt: 'asc' },
      include: {
        vendor: { select: { name: true } },
      },
    });

    return rows.map((r) => ({
      date: r.recordedAt.toISOString(),
      price: decimalToNumber(r.price),
      source: r.source,
      vendorName: r.vendor?.name ?? undefined,
    }));
  }

  /**
   * Insert a new price record into PriceHistory.
   */
  async recordPrice(data: RecordPriceData): Promise<void> {
    const part = await prisma.part.findUnique({
      where: { partNumber: data.partNumber },
    });

    if (!part) {
      throw new Error(`Part not found for partNumber: ${data.partNumber}`);
    }

    await prisma.priceHistory.create({
      data: {
        partId: part.id,
        price: data.price,
        source: data.source,
        condition: 'used', // default; callers can extend if needed
        vendorId: data.vendorId ?? undefined,
      },
    });

    logger.info(`Recorded price for part ${data.partNumber}: ${data.price} (${data.source})`);
  }

  /**
   * Compare a user's price against the market for a given part number.
   */
  async getMarketComparison(partNumber: string, userPrice: number): Promise<MarketComparison | null> {
    const range = await this.getPriceRange(partNumber);

    if (!range || range.count === 0) {
      return null;
    }

    // Collect all individual prices to compute percentile accurately
    const allPrices = await this.collectAllPrices(partNumber);
    const sorted = allPrices.sort((a, b) => a - b);

    // Percentile: fraction of prices that are <= userPrice
    const belowOrEqual = sorted.filter((p) => p <= userPrice).length;
    const percentile = Math.round((belowOrEqual / sorted.length) * 100);

    let recommendation: string;
    if (userPrice < range.avg * 0.9) {
      recommendation = 'Below market average - competitive price';
    } else if (userPrice > range.avg * 1.1) {
      recommendation = 'Above market average - consider lowering';
    } else {
      recommendation = 'At market average';
    }

    return {
      userPrice,
      marketAvg: range.avg,
      percentile,
      recommendation,
    };
  }

  // --- Private helpers ---

  /**
   * Compute trend by comparing avg price of the last 3 months vs the previous 3 months.
   * Rising if >5% increase, falling if >5% decrease, stable otherwise.
   */
  private async computeTrend(partId: string): Promise<'rising' | 'falling' | 'stable'> {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const [recentRows, previousRows] = await Promise.all([
      prisma.priceHistory.findMany({
        where: {
          partId,
          recordedAt: { gte: threeMonthsAgo, lte: now },
        },
        select: { price: true },
      }),
      prisma.priceHistory.findMany({
        where: {
          partId,
          recordedAt: { gte: sixMonthsAgo, lt: threeMonthsAgo },
        },
        select: { price: true },
      }),
    ]);

    if (recentRows.length === 0 || previousRows.length === 0) {
      return 'stable';
    }

    const recentAvg =
      recentRows.reduce((s, r) => s + decimalToNumber(r.price), 0) / recentRows.length;
    const previousAvg =
      previousRows.reduce((s, r) => s + decimalToNumber(r.price), 0) / previousRows.length;

    if (previousAvg === 0) return 'stable';

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (changePercent > 5) return 'rising';
    if (changePercent < -5) return 'falling';
    return 'stable';
  }

  /**
   * Collect raw price numbers from all three sources for percentile calculation.
   */
  private async collectAllPrices(partNumber: string): Promise<number[]> {
    const part = await prisma.part.findUnique({ where: { partNumber } });

    const prices: number[] = [];

    if (part) {
      const historyRows = await prisma.priceHistory.findMany({
        where: { partId: part.id },
        select: { price: true },
      });
      for (const r of historyRows) {
        prices.push(decimalToNumber(r.price));
      }
    }

    const listingRows = await prisma.listing.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { partData: { path: ['partNumber'], equals: partNumber } },
          { serialNumber: partNumber },
        ],
      },
      select: { price: true },
    });
    for (const r of listingRows) {
      prices.push(decimalToNumber(r.price));
    }

    const marketRows = await prisma.marketInventory.findMany({
      where: { partNumber },
      select: { price: true },
    });
    for (const r of marketRows) {
      prices.push(decimalToNumber(r.price));
    }

    return prices;
  }
}

export const priceIntelligenceService = new PriceIntelligenceService();
