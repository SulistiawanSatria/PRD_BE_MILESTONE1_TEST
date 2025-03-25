const Product = require('../models/Product');
const Review = require('../models/Review');
const { calculateSizeSimilarity } = require('../utils/similarity');
const { client: redisClient } = require('../config/redis');
const { invalidateCache } = require('../middleware/cache.middleware');

// Get product details dengan reviews
exports.getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get reviews untuk product ini
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ product_id: product._id })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const totalReviews = await Review.countDocuments({ product_id: product._id });

        // Hitung statistik measurements
        const allReviews = await Review.find({ product_id: product._id });
        const measurementStats = {
            waist: { total: 0, count: 0 },
            bust: { total: 0, count: 0 },
            hips: { total: 0, count: 0 },
            height: { total: 0, count: 0 }
        };

        allReviews.forEach(review => {
            if (review.user_measurements) {
                Object.keys(measurementStats).forEach(measurement => {
                    if (review.user_measurements[measurement]) {
                        measurementStats[measurement].total += review.user_measurements[measurement];
                        measurementStats[measurement].count++;
                    }
                });
            }
        });

        // Convert totals to averages
        const measurementAverages = {};
        Object.keys(measurementStats).forEach(measurement => {
            measurementAverages[measurement] = {
                average: measurementStats[measurement].count > 0 
                    ? measurementStats[measurement].total / measurementStats[measurement].count 
                    : 0,
                count: measurementStats[measurement].count
            };
        });

        res.json({
            success: true,
            data: {
                product: {
                    ...product.toObject(),
                    measurement_stats: measurementAverages
                },
                reviews: {
                    items: reviews,
                    total: totalReviews,
                    totalPages: Math.ceil(totalReviews / limit),
                    currentPage: page
                }
            }
        });
    } catch (error) {
        console.error('Error in getProductDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product details',
            error: error.message
        });
    }
};

// Get statistik review untuk product
exports.getProductReviewStats = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const reviews = await Review.find({ product_id: product._id });

        // Hitung distribusi rating
        const ratingDistribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };

        reviews.forEach(review => {
            ratingDistribution[review.rating]++;
        });

        res.json({
            success: true,
            data: {
                total_reviews: reviews.length,
                average_rating: product.average_rating,
                rating_distribution: ratingDistribution
            }
        });
    } catch (error) {
        console.error('Error in getProductReviewStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product review stats',
            error: error.message
        });
    }
};

// Get rekomendasi produk berdasarkan ukuran
exports.getProductRecommendations = async (req, res) => {
    try {
        const { measurements, excludeProductId, limit = 10 } = req.query;

        // Cari semua review dengan ukuran yang mirip
        const reviews = await Review.find({})
            .populate('product_id')
            .lean();

        // Hitung similarity score untuk setiap review
        const productScores = {};
        reviews.forEach(review => {
            if (!review.product_id || 
                (excludeProductId && review.product_id._id.toString() === excludeProductId)) {
                return;
            }

            const similarityScore = calculateSizeSimilarity(measurements, review.user_measurements);
            const productId = review.product_id._id.toString();

            if (!productScores[productId]) {
                productScores[productId] = {
                    _id: review.product_id._id,
                    name: review.product_id.name,
                    similarity_score: 0,
                    similar_reviews_count: 0,
                    total_similarity: 0,
                    average_rating: review.product_id.average_rating || 0
                };
            }

            if (similarityScore >= 0.8) { // Hanya pertimbangkan review dengan similarity tinggi
                productScores[productId].similar_reviews_count++;
                productScores[productId].total_similarity += similarityScore;
            }
        });

        // Hitung rata-rata similarity score dan skor akhir
        const recommendations = Object.values(productScores)
            .filter(product => product.similar_reviews_count > 0)
            .map(product => {
                const avgSimilarity = product.total_similarity / product.similar_reviews_count;
                // Skor akhir = 70% similarity + 30% rating
                const finalScore = (avgSimilarity * 0.7) + ((product.average_rating / 5) * 0.3);
                return {
                    ...product,
                    similarity_score: finalScore
                };
            })
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, limit);

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error getting product recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting product recommendations',
            error: error.message
        });
    }
};

// Get rekomendasi produk berdasarkan ukuran
exports.getProductRecommendationsOld = async (req, res) => {
    try {
        const { measurements } = req.query;
        const excludeProductId = req.query.excludeProductId; // Optional: exclude current product
        const limit = parseInt(req.query.limit) || 5;

        if (!measurements) {
            return res.status(400).json({
                success: false,
                message: 'Measurements are required'
            });
        }

        // Get all products with their reviews
        const products = await Product.find(
            excludeProductId ? { _id: { $ne: excludeProductId } } : {}
        ).lean();

        const productScores = await Promise.all(products.map(async (product) => {
            // Get reviews for this product
            const reviews = await Review.find({ 
                product_id: product._id,
                rating: { $gte: 4 } // Only consider positive reviews (rating >= 4)
            });

            if (reviews.length === 0) {
                return {
                    product,
                    score: 0,
                    similarReviewsCount: 0
                };
            }

            // Calculate average similarity score from reviews
            let totalSimilarity = 0;
            let similarReviewsCount = 0;

            reviews.forEach(review => {
                const similarity = calculateSizeSimilarity(measurements, review.user_measurements);
                if (similarity >= 0.8) {
                    totalSimilarity += similarity;
                    similarReviewsCount++;
                }
            });

            // Calculate final score based on:
            // 1. Average similarity (40%)
            // 2. Product rating (30%)
            // 3. Number of similar reviews (30%)
            const avgSimilarity = similarReviewsCount > 0 ? totalSimilarity / similarReviewsCount : 0;
            const ratingScore = product.average_rating / 5;
            const reviewCountScore = Math.min(similarReviewsCount / 10, 1); // Cap at 10 reviews

            const score = (
                (avgSimilarity * 0.4) +
                (ratingScore * 0.3) +
                (reviewCountScore * 0.3)
            );

            return {
                product,
                score,
                similarReviewsCount,
                avgSimilarity,
                ratingScore
            };
        }));

        // Sort by score and get top recommendations
        const recommendations = productScores
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => ({
                ...item.product,
                similarity_score: item.avgSimilarity,
                similar_reviews_count: item.similarReviewsCount
            }));

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error in getProductRecommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product recommendations',
            error: error.message
        });
    }
};
