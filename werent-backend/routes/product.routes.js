const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { validateGetProduct, validateGetRecommendations } = require('../middleware/validation.middleware');
const { cacheMiddleware, CACHE_DURATION } = require('../middleware/cache.middleware');

// Get product recommendations berdasarkan ukuran
router.get('/recommendations', 
    validateGetRecommendations,
    cacheMiddleware(CACHE_DURATION.PRODUCT),
    productController.getProductRecommendations
);

// Get product details dengan reviews
router.get('/:id', 
    validateGetProduct,
    cacheMiddleware(CACHE_DURATION.PRODUCT),
    productController.getProductDetails
);

// Get product review statistics
router.get('/:id/stats', 
    validateGetProduct,
    cacheMiddleware(CACHE_DURATION.STATS),
    productController.getProductReviewStats
);

module.exports = router;
