const request = require('supertest');
const app = require('../../server');
const {
    setupTestDB,
    teardownTestDB,
    createTestProduct,
    createTestReviews,
    sampleProduct
} = require('../helpers');

describe('Product Controller', () => {
    let productId;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        productId = await createTestProduct();
        await createTestReviews(productId, 5); // Create 5 reviews
    });

    describe('GET /api/products/:id', () => {
        it('should return product details with reviews', async () => {
            const res = await request(app)
                .get(`/api/products/${productId}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.product).toMatchObject({
                name: sampleProduct.name,
                review_count: 5,
                average_rating: expect.any(Number)
            });
            expect(res.body.data.reviews.items).toHaveLength(5);
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/products/${fakeId}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('should return measurement statistics', async () => {
            const res = await request(app)
                .get(`/api/products/${productId}`);

            expect(res.status).toBe(200);
            expect(res.body.data.product.measurement_stats).toBeDefined();
            expect(res.body.data.product.measurement_stats).toMatchObject({
                waist: { average: expect.any(Number), count: expect.any(Number) },
                bust: { average: expect.any(Number), count: expect.any(Number) },
                hips: { average: expect.any(Number), count: expect.any(Number) },
                height: { average: expect.any(Number), count: expect.any(Number) }
            });
        });
    });

    describe('GET /api/products/:id/stats', () => {
        it('should return review statistics', async () => {
            const res = await request(app)
                .get(`/api/products/${productId}/stats`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toMatchObject({
                total_reviews: 5,
                average_rating: expect.any(Number),
                rating_distribution: expect.any(Object)
            });
        });

        it('should have correct rating distribution', async () => {
            const res = await request(app)
                .get(`/api/products/${productId}/stats`);

            expect(res.status).toBe(200);
            const distribution = res.body.data.rating_distribution;
            const totalReviews = Object.values(distribution).reduce((a, b) => a + b, 0);
            expect(totalReviews).toBe(5);

            // Verify rating keys exist
            expect(distribution).toHaveProperty('1');
            expect(distribution).toHaveProperty('2');
            expect(distribution).toHaveProperty('3');
            expect(distribution).toHaveProperty('4');
            expect(distribution).toHaveProperty('5');
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .get(`/api/products/${fakeId}/stats`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
});
