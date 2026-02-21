import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as adminController from '../controllers/admin.controller';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Review management
router.get('/listings/pending', asyncHandler(adminController.getPendingListings));
router.post('/listings/:id/approve', asyncHandler(adminController.approveListing));
router.post('/listings/:id/reject', asyncHandler(adminController.rejectListing));

// User management
router.get('/users', asyncHandler(adminController.getAllUsers));
router.patch('/users/:id/toggle-status', asyncHandler(adminController.toggleUserStatus));

// Statistics & Analytics
router.get('/stats', asyncHandler(adminController.getAdminStats));
router.get('/health', asyncHandler(analyticsController.getPlatformHealth));
router.get('/analytics', asyncHandler(analyticsController.getAnalytics));
router.get('/audit-log', asyncHandler(analyticsController.getAuditLog));

// CSV Exports
router.get('/export/listings', asyncHandler(analyticsController.exportListingsCsv));
router.get('/export/audit-log', asyncHandler(analyticsController.exportAuditLogCsv));

export default router;
