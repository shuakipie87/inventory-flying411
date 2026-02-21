import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// All AI routes require authentication
router.post('/suggest-price', authenticate, asyncHandler(aiController.suggestPrice));
router.post('/suggest-images', authenticate, asyncHandler(aiController.suggestImages));
router.post('/download-image', authenticate, asyncHandler(aiController.downloadImage));

export default router;
