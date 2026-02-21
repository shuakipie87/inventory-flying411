import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as syncController from '../controllers/sync.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/stats', asyncHandler(syncController.getSyncStats));
router.get('/health', asyncHandler(syncController.checkApiHealth));
router.get('/listings', asyncHandler(syncController.getSyncableListings));
router.post('/listings/:id', asyncHandler(syncController.syncSingleListing));
router.delete('/listings/:id', asyncHandler(syncController.unsyncListing));
router.post('/bulk', asyncHandler(syncController.syncBulkListings));
router.post('/all', asyncHandler(syncController.syncAllUnsynced));

export default router;
