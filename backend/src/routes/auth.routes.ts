import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator';
import { authLimiter } from '../middleware/rateLimit';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 30 }).trim(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one digit'),
    validate,
  ],
  asyncHandler(authController.register)
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  asyncHandler(authController.login)
);

// Logout
router.post('/logout', asyncHandler(authController.logout));

// Refresh token
router.post('/refresh', asyncHandler(authController.refreshToken));

// Get current user (requires authentication)
router.get('/me', authenticate, asyncHandler(authController.getCurrentUser));

export default router;
