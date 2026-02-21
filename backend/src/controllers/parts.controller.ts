import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { priceIntelligenceService } from '../services/priceIntelligence.service';
import { marketAggregatorService } from '../services/marketAggregator.service';

/**
 * Search parts by query (fuzzy matching on part number, description, manufacturer)
 * GET /api/parts/search?q=query
 */
export const searchParts = async (req: Request, res: Response) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json({
                status: 'success',
                data: { parts: [] },
            });
        }

        const searchQuery = q.toLowerCase();
        const limitNum = Math.min(Number(limit), 50);

        // Search using ILIKE for fuzzy matching
        const parts = await prisma.part.findMany({
            where: {
                OR: [
                    { partNumber: { contains: searchQuery, mode: 'insensitive' } },
                    { description: { contains: searchQuery, mode: 'insensitive' } },
                    { manufacturer: { contains: searchQuery, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                partNumber: true,
                manufacturer: true,
                description: true,
                category: true,
                model: true,
            },
            take: limitNum,
            orderBy: [
                { partNumber: 'asc' },
            ],
        });

        res.json({
            status: 'success',
            data: { parts },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Get pricing suggestions for a part by condition
 * GET /api/parts/:partNumber/pricing?condition=new
 */
export const getPricingSuggestion = async (req: Request, res: Response) => {
    try {
        const { partNumber } = req.params;
        const { condition = 'used' } = req.query;

        // Find the part
        const part = await prisma.part.findUnique({
            where: { partNumber },
            include: {
                priceHistory: {
                    where: condition !== 'all' ? { condition: String(condition) } : undefined,
                    orderBy: { recordedAt: 'desc' },
                    take: 20,
                },
            },
        });

        if (!part) {
            return res.status(404).json({
                status: 'error',
                message: 'Part not found',
            });
        }

        // Calculate price range from history
        const prices = part.priceHistory.map((ph) => Number(ph.price));

        if (prices.length === 0) {
            return res.json({
                status: 'success',
                data: {
                    partNumber,
                    condition,
                    suggestion: null,
                    message: 'No pricing data available',
                },
            });
        }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

        res.json({
            status: 'success',
            data: {
                partNumber,
                condition,
                suggestion: {
                    min: minPrice.toFixed(2),
                    max: maxPrice.toFixed(2),
                    average: avgPrice.toFixed(2),
                    dataPoints: prices.length,
                },
            },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Get part details by part number
 * GET /api/parts/:partNumber
 */
export const getPartByNumber = async (req: Request, res: Response) => {
    try {
        const { partNumber } = req.params;

        const part = await prisma.part.findUnique({
            where: { partNumber },
            include: {
                priceHistory: {
                    orderBy: { recordedAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!part) {
            return res.status(404).json({
                status: 'error',
                message: 'Part not found',
            });
        }

        res.json({
            status: 'success',
            data: { part },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Add a new part to master database (admin only)
 * POST /api/parts
 */
export const createPart = async (req: AuthRequest, res: Response) => {
    try {
        const { partNumber, manufacturer, description, category, model, alternates } = req.body;

        // Check if part already exists
        const existing = await prisma.part.findUnique({
            where: { partNumber },
        });

        if (existing) {
            return res.status(400).json({
                status: 'error',
                message: 'Part number already exists',
            });
        }

        const part = await prisma.part.create({
            data: {
                partNumber,
                manufacturer,
                description,
                category,
                model,
                alternates: alternates || [],
            },
        });

        res.status(201).json({
            status: 'success',
            data: { part },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Add price history for a part
 * POST /api/parts/:partNumber/pricing
 */
export const addPriceHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { partNumber } = req.params;
        const { condition, price, source } = req.body;

        const part = await prisma.part.findUnique({
            where: { partNumber },
        });

        if (!part) {
            return res.status(404).json({
                status: 'error',
                message: 'Part not found',
            });
        }

        const priceHistory = await prisma.priceHistory.create({
            data: {
                partId: part.id,
                condition,
                price,
                source: source || 'manual',
            },
        });

        res.status(201).json({
            status: 'success',
            data: { priceHistory },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Get market availability for a part across all vendors
 * GET /api/parts/:partNumber/market-availability
 */
export const getMarketAvailability = async (req: AuthRequest, res: Response) => {
    const { partNumber } = req.params;

    if (!partNumber || typeof partNumber !== 'string') {
        return res.status(400).json({
            status: 'error',
            message: 'Part number is required',
        });
    }

    const availability = await marketAggregatorService.getMarketAvailability(partNumber);

    res.json({
        status: 'success',
        data: { availability },
    });
};

/**
 * Force-refresh market data for a part and return updated availability
 * POST /api/parts/:partNumber/market-refresh
 */
export const refreshMarketData = async (req: AuthRequest, res: Response) => {
    const { partNumber } = req.params;

    if (!partNumber || typeof partNumber !== 'string') {
        return res.status(400).json({
            status: 'error',
            message: 'Part number is required',
        });
    }

    await marketAggregatorService.refreshMarketData(partNumber);
    const availability = await marketAggregatorService.getMarketAvailability(partNumber);

    res.json({
        status: 'success',
        data: { availability },
    });
};

/**
 * Get aggregated price range for a part
 * GET /api/parts/:partNumber/price-range?months=12
 */
export const getPriceRange = async (req: AuthRequest, res: Response) => {
    const { partNumber } = req.params;
    const months = Math.max(1, Math.min(120, Number(req.query.months) || 12));

    const range = await priceIntelligenceService.getPriceRange(partNumber, months);

    if (!range) {
        return res.json({
            status: 'success',
            data: { priceRange: null, message: 'No pricing data available' },
        });
    }

    res.json({
        status: 'success',
        data: { priceRange: range },
    });
};

/**
 * Get chronological price timeline for a part
 * GET /api/parts/:partNumber/price-timeline?months=12
 */
export const getPriceTimeline = async (req: AuthRequest, res: Response) => {
    const { partNumber } = req.params;
    const months = Math.max(1, Math.min(120, Number(req.query.months) || 12));

    const timeline = await priceIntelligenceService.getPriceTimeline(partNumber, months);

    res.json({
        status: 'success',
        data: { timeline },
    });
};

/**
 * Compare a user's price against market data for a part
 * GET /api/parts/:partNumber/market-comparison?price=1000
 */
export const getMarketComparison = async (req: AuthRequest, res: Response) => {
    const { partNumber } = req.params;
    const price = Number(req.query.price);

    if (!req.query.price || isNaN(price) || price <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Query parameter "price" is required and must be a positive number',
        });
    }

    const comparison = await priceIntelligenceService.getMarketComparison(partNumber, price);

    if (!comparison) {
        return res.json({
            status: 'success',
            data: { comparison: null, message: 'No market data available for comparison' },
        });
    }

    res.json({
        status: 'success',
        data: { comparison },
    });
};
