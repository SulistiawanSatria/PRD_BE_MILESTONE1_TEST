const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { clearCache } = require('../middleware/cache.middleware');

// Fungsi helper untuk menghitung kemiripan ukuran
const calculateSizeSimilarity = (userMeasurements, reviewMeasurements) => {
    if (!userMeasurements || !reviewMeasurements) return 0;

    const weights = {
        waist: 0.25,
        bust: 0.25,
        hips: 0.25,
        height: 0.25
    };

    // Hitung persentase perbedaan untuk setiap measurement
    const waistDiff = Math.abs(1 - Math.abs(userMeasurements.waist - reviewMeasurements.waist) / userMeasurements.waist);
    const bustDiff = Math.abs(1 - Math.abs(userMeasurements.bust - reviewMeasurements.bust) / userMeasurements.bust);
    const hipsDiff = Math.abs(1 - Math.abs(userMeasurements.hips - reviewMeasurements.hips) / userMeasurements.hips);
    const heightDiff = Math.abs(1 - Math.abs(userMeasurements.height - reviewMeasurements.height) / userMeasurements.height);

    // Hitung similarity score (0-1)
    return (
        waistDiff * weights.waist +
        bustDiff * weights.bust +
        hipsDiff * weights.hips +
        heightDiff * weights.height
    );
};

// Get reviews untuk product tertentu
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            sort = 'newest',
            rating,
            sizeSimilarity, // New parameter for size similarity filtering
            measurements // User's measurements for comparison
        } = req.query;

        const skip = (page - 1) * limit;
        
        // Base query
        const query = { product_id: productId };
        
        // Add rating filter if specified
        if (rating) {
            query.rating = parseInt(rating);
        }

        // Base sort options
        let sortOptions = {};
        switch (sort) {
            case 'most_helpful':
                sortOptions = { helpful_count: -1 };
                break;
            case 'highest_rating':
                sortOptions = { rating: -1 };
                break;
            case 'lowest_rating':
                sortOptions = { rating: 1 };
                break;
            default: // 'newest'
                sortOptions = { created_at: -1 };
        }

        // Get total count for pagination
        const totalReviews = await Review.countDocuments(query);

        // Get reviews
        let reviews = await Review.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // If size similarity filtering is requested
        if (sizeSimilarity === 'true' && measurements) {
            const userMeasurements = {
                waist: parseFloat(measurements.waist),
                bust: parseFloat(measurements.bust),
                hips: parseFloat(measurements.hips),
                height: parseFloat(measurements.height)
            };

            // Calculate similarity scores and add to reviews
            reviews = reviews.map(review => ({
                ...review,
                sizeSimilarity: calculateSizeSimilarity(userMeasurements, review.user_measurements)
            }));

            // Sort by similarity if requested
            if (sort === 'size_similarity') {
                reviews.sort((a, b) => b.sizeSimilarity - a.sizeSimilarity);
            }

            // Filter reviews with similarity score above threshold (e.g., 0.8 or 80% similar)
            if (sizeSimilarity === 'true') {
                reviews = reviews.filter(review => review.sizeSimilarity >= 0.8);
            }
        }

        res.json({
            success: true,
            data: reviews,
            totalPages: Math.ceil(totalReviews / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error in getProductReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
};

// Create review baru
exports.createReview = async (req, res) => {
    try {
        const review = new Review(req.body);
        await review.save();

        // Update product statistics
        await Product.findByIdAndUpdate(
            req.body.product_id,
            {
                $inc: { review_count: 1 },
                $push: { reviews: review._id }
            }
        );

        // Recalculate average rating
        const reviews = await Review.find({ product_id: req.body.product_id });
        const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(
            req.body.product_id,
            { average_rating: averageRating }
        );

        // Clear related caches
        await Promise.all([
            clearCache(`GET:/api/products/${req.body.product_id}*`),
            clearCache(`GET:/api/reviews/${req.body.product_id}*`)
        ]);

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Error in createReview:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
};

// Update review yang ada
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Recalculate average rating if rating was updated
        if (req.body.rating) {
            const reviews = await Review.find({ product_id: review.product_id });
            const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

            await Product.findByIdAndUpdate(
                review.product_id,
                { average_rating: averageRating }
            );
        }

        // Clear related caches
        await Promise.all([
            clearCache(`GET:/api/products/${review.product_id}*`),
            clearCache(`GET:/api/reviews/${review.product_id}*`)
        ]);

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Error in updateReview:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Remove review
        await review.remove();

        // Update product statistics
        const product = await Product.findById(review.product_id);
        product.review_count -= 1;
        product.reviews = product.reviews.filter(reviewId => reviewId.toString() !== id);

        // Recalculate average rating
        if (product.review_count > 0) {
            const reviews = await Review.find({ product_id: review.product_id });
            product.average_rating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        } else {
            product.average_rating = 0;
        }

        await product.save();

        // Clear related caches
        await Promise.all([
            clearCache(`GET:/api/products/${review.product_id}*`),
            clearCache(`GET:/api/reviews/${review.product_id}*`)
        ]);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteReview:', error);
        res.status(400).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
};

// Mark review sebagai helpful
exports.markReviewHelpful = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndUpdate(
            id,
            { $inc: { helpful_count: 1 } },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Clear related caches
        await Promise.all([
            clearCache(`GET:/api/products/${review.product_id}*`),
            clearCache(`GET:/api/reviews/${review.product_id}*`)
        ]);

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Error in markReviewHelpful:', error);
        res.status(400).json({
            success: false,
            message: 'Error marking review as helpful',
            error: error.message
        });
    }
};
