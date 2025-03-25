const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const {
    validateCreateReview,
    validateUpdateReview,
    validateGetReviews,
    validateDeleteReview,
    validateHelpfulReview
} = require('../middleware/validation.middleware');
const { cacheMiddleware, CACHE_DURATION } = require('../middleware/cache.middleware');

// Get reviews for a product
router.get('/:productId',
    validateGetReviews,
    cacheMiddleware(CACHE_DURATION.REVIEWS),
    reviewController.getProductReviews
);

// Create a new review
router.post('/',
    validateCreateReview,
    reviewController.createReview
);

// Update a review
router.put('/:id', validateUpdateReview, reviewController.updateReview);

// Delete a review
router.delete('/:id', validateDeleteReview, reviewController.deleteReview);

// Mark a review as helpful
router.post('/:id/helpful', validateHelpfulReview, reviewController.markReviewHelpful);

module.exports = router;
