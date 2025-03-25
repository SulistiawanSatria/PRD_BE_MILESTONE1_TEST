const request = require('supertest');
const app = require('../../server');
const {
    setupTestDB,
    teardownTestDB,
    createTestProduct,
    createTestReviews,
    sampleReview
} = require('../helpers');

describe('Review Controller', () => {
    let productId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        productId = await createTestProduct();
        await createTestReviews(productId, 10); // Create 10 reviews with varying measurements
    });

    describe('GET /api/reviews/:productId', () => {
        it('should return reviews with pagination', async () => {
            const res = await request(app)
                .get(`/api/reviews/${productId}`)
                .query({ page: 1, limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(5);
            expect(res.body.totalPages).toBe(2);
            expect(res.body.currentPage).toBe(1);
        });

        it('should filter reviews by rating', async () => {
            const res = await request(app)
                .get(`/api/reviews/${productId}`)
                .query({ rating: 5 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.every(review => review.rating === 5)).toBe(true);
        });

        it('should sort reviews by newest first', async () => {
            const res = await request(app)
                .get(`/api/reviews/${productId}`)
                .query({ sort: 'newest' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const dates = res.body.data.map(review => new Date(review.created_at));
            for (let i = 1; i < dates.length; i++) {
                expect(dates[i - 1] >= dates[i]).toBe(true);
            }
        });

        it('should sort reviews by most helpful', async () => {
            const res = await request(app)
                .get(`/api/reviews/${productId}`)
                .query({ sort: 'most_helpful' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const helpfulCounts = res.body.data.map(review => review.helpful_count);
            for (let i = 1; i < helpfulCounts.length; i++) {
                expect(helpfulCounts[i - 1] >= helpfulCounts[i]).toBe(true);
            }
        });

        describe('Size Similarity Filtering', () => {
            const testMeasurements = {
                waist: 70,
                bust: 90,
                hips: 95,
                height: 165
            };

            it('should return reviews with similarity scores when sizeSimilarity is true', async () => {
                const res = await request(app)
                    .get(`/api/reviews/${productId}`)
                    .query({
                        sizeSimilarity: true,
                        measurements: testMeasurements
                    });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.data[0]).toHaveProperty('sizeSimilarity');
                expect(res.body.data[0].sizeSimilarity).toBeGreaterThanOrEqual(0);
                expect(res.body.data[0].sizeSimilarity).toBeLessThanOrEqual(1);
            });

            it('should sort reviews by size similarity when specified', async () => {
                const res = await request(app)
                    .get(`/api/reviews/${productId}`)
                    .query({
                        sizeSimilarity: true,
                        measurements: testMeasurements,
                        sort: 'size_similarity'
                    });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                const similarities = res.body.data.map(review => review.sizeSimilarity);
                for (let i = 1; i < similarities.length; i++) {
                    expect(similarities[i - 1] >= similarities[i]).toBe(true);
                }
            });

            it('should filter out reviews with similarity score < 0.8', async () => {
                const res = await request(app)
                    .get(`/api/reviews/${productId}`)
                    .query({
                        sizeSimilarity: true,
                        measurements: testMeasurements
                    });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.data.every(review => review.sizeSimilarity >= 0.8)).toBe(true);
            });

            it('should return validation error when measurements are invalid', async () => {
                const res = await request(app)
                    .get(`/api/reviews/${productId}`)
                    .query({
                        sizeSimilarity: true,
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
        });
    });

    describe('POST /api/reviews', () => {
        it('should create a new review', async () => {
            const reviewData = {
                ...sampleReview,
                product_id: productId,
                user_id: '507f1f77bcf86cd799439011' // Dummy MongoDB ObjectId
            };

            const res = await request(app)
                .post('/api/reviews')
                .send(reviewData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toMatchObject({
                product_id: productId.toString(),
                rating: reviewData.rating,
                review_text: reviewData.review_text,
                user_measurements: reviewData.user_measurements
            });
        });

        it('should validate user measurements', async () => {
            const reviewData = {
                ...sampleReview,
                product_id: productId,
                user_id: '507f1f77bcf86cd799439011',
                user_measurements: {
                    waist: 0, // Invalid: too small
                    bust: 300, // Invalid: too large
                    hips: 95,
                    height: 165
                }
            };

            const res = await request(app)
                .post('/api/reviews')
                .send(reviewData);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });
    });
});
