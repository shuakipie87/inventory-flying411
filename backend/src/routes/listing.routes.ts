import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { asyncHandler } from '../utils/asyncHandler';
import * as listingController from '../controllers/listing.controller';
import { upload } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', asyncHandler(listingController.getAllListings));
router.get('/:id', asyncHandler(listingController.getListingById));

// Protected routes
router.use(authenticate);

router.post(
  '/',
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('price').isFloat({ min: 0 }),
    body('category').notEmpty(),
    body('condition').notEmpty(),
    body('quantity').optional().isInt({ min: 1 }),
    validate,
  ],
  asyncHandler(listingController.createListing)
);

router.put('/:id', asyncHandler(listingController.updateListing));
router.delete('/:id', asyncHandler(listingController.deleteListing));

// Image upload
router.post(
  '/:id/images',
  upload.array('images', 10),
  asyncHandler(listingController.uploadImages)
);

router.delete('/:id/images/:imageId', asyncHandler(listingController.deleteImage));

// Set primary image
router.patch('/:id/images/:imageId/primary', asyncHandler(listingController.setPrimaryImage));

// Status management
router.patch('/:id/submit', asyncHandler(listingController.submitForApproval));
router.patch('/:id/publish', asyncHandler(listingController.publishListing));

export default router;
