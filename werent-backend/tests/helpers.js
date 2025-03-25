const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');

// Sample data untuk testing
const sampleProduct = {
    name: "Test Evening Gown",
    description: "A beautiful gown for testing"
};

const sampleReview = {
    rating: 5,
    review_text: "This is a test review with proper length",
    user_measurements: {
        waist: 70,
        bust: 90,
        hips: 95,
        height: 165
    },
    images: ["https://example.com/test-image.jpg"]
};

// Setup database untuk testing
const setupTestDB = async () => {
    try {
        // Connect ke database test
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear collections
        await Promise.all([
            Product.deleteMany({}),
            Review.deleteMany({})
        ]);
    } catch (error) {
        console.error('Test database setup error:', error);
        throw error;
    }
};

// Create test product dan return ID-nya
const createTestProduct = async (productData = sampleProduct) => {
    const product = await Product.create(productData);
    return product._id;
};

// Create test review dan return ID-nya
const createTestReview = async (productId, userData = { _id: new mongoose.Types.ObjectId() }, reviewData = sampleReview) => {
    const review = await Review.create({
        ...reviewData,
        product_id: productId,
        user_id: userData._id
    });

    // Update product statistics
    await Product.findByIdAndUpdate(productId, {
        $inc: { review_count: 1 },
        $push: { reviews: review._id }
    });

    return review._id;
};

// Create multiple test reviews dengan ukuran tubuh yang berbeda
const createTestReviews = async (productId, count = 5) => {
    const reviews = [];
    for (let i = 0; i < count; i++) {
        const variance = Math.floor(Math.random() * 10) - 5; // -5 to +5
        const reviewData = {
            ...sampleReview,
            rating: Math.floor(Math.random() * 3) + 3, // 3-5
            review_text: `Test review number ${i + 1}`,
            user_measurements: {
                waist: sampleReview.user_measurements.waist + variance,
                bust: sampleReview.user_measurements.bust + variance,
                hips: sampleReview.user_measurements.hips + variance,
                height: sampleReview.user_measurements.height + variance
            },
            helpful_count: Math.floor(Math.random() * 10)
        };
        const reviewId = await createTestReview(productId, { _id: new mongoose.Types.ObjectId() }, reviewData);
        reviews.push(reviewId);
    }
    return reviews;
};

// Clean up database setelah testing
const teardownTestDB = async () => {
    try {
        await Promise.all([
            Product.deleteMany({}),
            Review.deleteMany({})
        ]);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Test database teardown error:', error);
        throw error;
    }
};

module.exports = {
    setupTestDB,
    teardownTestDB,
    createTestProduct,
    createTestReview,
    createTestReviews,
    sampleProduct,
    sampleReview
};
