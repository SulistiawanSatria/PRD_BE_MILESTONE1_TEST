const { body, param, query, validationResult } = require('express-validator');

// Validation middleware untuk memastikan request valid
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Validasi measurements
const validateMeasurements = [
    query('measurements.waist')
        .optional()
        .isFloat({ min: 50, max: 200 })
        .withMessage('Waist measurement must be between 50-200 cm'),
    query('measurements.bust')
        .optional()
        .isFloat({ min: 50, max: 200 })
        .withMessage('Bust measurement must be between 50-200 cm'),
    query('measurements.hips')
        .optional()
        .isFloat({ min: 50, max: 200 })
        .withMessage('Hips measurement must be between 50-200 cm'),
    query('measurements.height')
        .optional()
        .isFloat({ min: 130, max: 230 })
        .withMessage('Height must be between 130-230 cm')
];

// Validasi untuk pembuatan review
exports.validateCreateReview = [
    body('product_id')
        .isMongoId()
        .withMessage('Invalid product ID'),
    body('user_id')
        .isMongoId()
        .withMessage('Invalid user ID'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1-5'),
    body('review_text')
        .isString()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Review text must be between 10-1000 characters'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array'),
    body('images.*')
        .optional()
        .isURL()
        .withMessage('Each image must be a valid URL'),
    body('user_measurements')
        .isObject()
        .withMessage('User measurements are required'),
    body('user_measurements.waist')
        .isFloat({ min: 50, max: 200 })
        .withMessage('Waist measurement must be between 50-200 cm'),
    body('user_measurements.bust')
        .isFloat({ min: 50, max: 200 })
        .withMessage('Bust measurement must be between 50-200 cm'),
    body('user_measurements.hips')
        .isFloat({ min: 50, max: 200 })
        .withMessage('Hips measurement must be between 50-200 cm'),
    body('user_measurements.height')
        .isFloat({ min: 130, max: 230 })
        .withMessage('Height must be between 130-230 cm'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validasi untuk update review
exports.validateUpdateReview = [
    param('id')
        .isMongoId()
        .withMessage('Invalid review ID'),
    body('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('review_text')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Review text must be between 10 and 1000 characters'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array'),
    body('images.*')
        .optional()
        .isURL()
        .withMessage('Each image must be a valid URL'),
    validateRequest
];

// Validasi untuk get reviews
exports.validateGetReviews = [
    param('productId')
        .isMongoId()
        .withMessage('Invalid product ID'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    query('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1-5'),
    query('sort')
        .optional()
        .isIn(['newest', 'most_helpful', 'size_similarity'])
        .withMessage('Invalid sort option'),
    query('sizeSimilarity')
        .optional()
        .isBoolean()
        .withMessage('sizeSimilarity must be a boolean'),
    ...validateMeasurements,
    (req, res, next) => {
        // Jika sizeSimilarity true, measurements harus ada
        if (req.query.sizeSimilarity === 'true') {
            const measurements = req.query.measurements || {};
            if (!measurements.waist || !measurements.bust || 
                !measurements.hips || !measurements.height) {
                return res.status(400).json({
                    success: false,
                    message: 'All measurements are required when using size similarity'
                });
            }
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validasi untuk delete review
exports.validateDeleteReview = [
    param('id')
        .isMongoId()
        .withMessage('Invalid review ID'),
    validateRequest
];

// Validasi untuk helpful review
exports.validateHelpfulReview = [
    param('id')
        .isMongoId()
        .withMessage('Invalid review ID'),
    validateRequest
];

// Validasi untuk get product
exports.validateGetProduct = [
    param('id')
        .isMongoId()
        .withMessage('Invalid product ID'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validasi untuk get recommendations
exports.validateGetRecommendations = [
    query('excludeProductId')
        .optional()
        .isMongoId()
        .withMessage('Invalid product ID to exclude'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Limit must be between 1-20'),
    ...validateMeasurements,
    (req, res, next) => {
        // Measurements wajib untuk rekomendasi
        const measurements = req.query.measurements || {};
        if (!measurements.waist || !measurements.bust || 
            !measurements.hips || !measurements.height) {
            return res.status(400).json({
                success: false,
                message: 'All measurements are required for recommendations'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];
