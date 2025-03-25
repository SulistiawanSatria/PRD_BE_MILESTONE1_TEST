const request = require('supertest');
const app = require('../../server');
const {
    setupTestDB,
    teardownTestDB,
    createTestProduct,
    createTestReview,
    sampleProduct
} = require('../helpers');

describe('Product Recommendations', () => {
    let productIds = [];
    const testMeasurements = {
        waist: 70,
        bust: 90,
        hips: 95,
        height: 165
    };

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        // Create 5 test products with varying reviews
        for (let i = 0; i < 5; i++) {
            const productId = await createTestProduct({
                ...sampleProduct,
                name: `Test Product ${i + 1}`
            });
            productIds.push(productId);

            // Add reviews with varying measurements and ratings
            const reviewCount = Math.floor(Math.random() * 5) + 1; // 1-5 reviews
            for (let j = 0; j < reviewCount; j++) {
                const variance = Math.floor(Math.random() * 10) - 5; // -5 to +5
                const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
                await createTestReview(productId, undefined, {
                    rating,
                    review_text: `Test review ${j + 1} for product ${i + 1}`,
                    user_measurements: {
                        waist: testMeasurements.waist + variance,
                        bust: testMeasurements.bust + variance,
                        hips: testMeasurements.hips + variance,
                        height: testMeasurements.height + variance
                    }
                });
            }
        }
    });

    describe('GET /api/products/recommendations', () => {
        it('should return recommendations based on measurements', async () => {
            const res = await request(app)
                .get('/api/products/recommendations')
                .query({
                    measurements: testMeasurements
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            
            // Verify each recommendation has required fields
            res.body.data.forEach(recommendation => {
                expect(recommendation).toHaveProperty('_id');
                expect(recommendation).toHaveProperty('name');
                expect(recommendation).toHaveProperty('similarity_score');
                expect(recommendation).toHaveProperty('similar_reviews_count');
                expect(recommendation.similarity_score).toBeGreaterThanOrEqual(0);
                expect(recommendation.similarity_score).toBeLessThanOrEqual(1);
            });

            // Verify recommendations are sorted by score
            const scores = res.body.data.map(r => r.similarity_score);
            for (let i = 1; i < scores.length; i++) {
                expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
            }
        });

        it('should exclude specified product from recommendations', async () => {
            const excludeProductId = productIds[0];
            const res = await request(app)
                .get('/api/products/recommendations')
                .query({
                    measurements: testMeasurements,
                    excludeProductId
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.every(product => product._id !== excludeProductId))
                .toBe(true);
        });

        it('should limit number of recommendations', async () => {
            const limit = 3;
            const res = await request(app)
                .get('/api/products/recommendations')
                .query({
                    measurements: testMeasurements,
                    limit
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeLessThanOrEqual(limit);
        });

        it('should return validation error for invalid measurements', async () => {
            const res = await request(app)
                .get('/api/products/recommendations')
                .query({
                    measurements: {
                        waist: 0, // Invalid: too small
                        bust: 300, // Invalid: too large
                        hips: 95,
                        height: 165
                    }
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });

        it('should return validation error when measurements are missing', async () => {
            const res = await request(app)
                .get('/api/products/recommendations')
                .query({
                    measurements: {
                        waist: 70,
                        // bust missing
                        hips: 95,
                        height: 165
                    }
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('All measurements are required for recommendations');
        });

        it('should return validation error for invalid limit', async () => {
            const res = await request(app)
                .get('/api/products/recommendations')
                .query({
                    measurements: testMeasurements,
                    limit: 50 // Too high
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });
    });
});
