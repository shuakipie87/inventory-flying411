import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(dashboardController.getUserStats));
router.get('/listings', asyncHandler(dashboardController.getUserListings));

export default router;
