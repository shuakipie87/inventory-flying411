import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { documentUpload } from '../middleware/upload';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Session management
router.get('/sessions', asyncHandler(uploadController.listSessions));
router.get('/session/:id', asyncHandler(uploadController.getSession));

// Upload flow
router.post(
  '/session',
  documentUpload.single('file'),
  asyncHandler(uploadController.createSession)
);
router.post('/session/:id/parse', asyncHandler(uploadController.parseSession));
router.post('/session/:id/map', asyncHandler(uploadController.mapColumns));
router.put('/session/:id/mapping', asyncHandler(uploadController.saveMapping));
router.post('/session/:id/match', asyncHandler(uploadController.matchRows));
router.post('/session/:id/import', asyncHandler(uploadController.importRows));

// Row management
router.get('/session/:id/rows', asyncHandler(uploadController.getRows));
router.put('/session/:id/rows/:rowId', asyncHandler(uploadController.editRow));

export default router;
