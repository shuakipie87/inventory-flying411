import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as partsController from '../controllers/parts.controller';

const router = Router();

// Public routes
router.get('/search', asyncHandler(partsController.searchParts));
router.get('/:partNumber', asyncHandler(partsController.getPartByNumber));
router.get('/:partNumber/pricing', asyncHandler(partsController.getPricingSuggestion));

// Market availability (requires auth)
router.get('/:partNumber/market-availability', authenticate, asyncHandler(partsController.getMarketAvailability));
router.post('/:partNumber/market-refresh', authenticate, asyncHandler(partsController.refreshMarketData));

// Price intelligence (requires auth)
router.get('/:partNumber/price-range', authenticate, asyncHandler(partsController.getPriceRange));
router.get('/:partNumber/price-timeline', authenticate, asyncHandler(partsController.getPriceTimeline));
router.get('/:partNumber/market-comparison', authenticate, asyncHandler(partsController.getMarketComparison));

// Admin routes
router.post('/', authenticate, requireAdmin, asyncHandler(partsController.createPart));
router.post('/:partNumber/pricing', authenticate, requireAdmin, asyncHandler(partsController.addPriceHistory));

export default router;
