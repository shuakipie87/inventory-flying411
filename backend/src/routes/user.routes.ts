import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/profile', asyncHandler(userController.getProfile));
router.put('/profile', asyncHandler(userController.updateProfile));
router.put('/password', asyncHandler(userController.changePassword));

export default router;
