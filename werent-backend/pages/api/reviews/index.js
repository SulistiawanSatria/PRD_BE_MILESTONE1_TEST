import { connectDB } from '../../../lib/mongodb';
import Review from '../../../models/Review';
import { calculateSizeSimilarity } from '../../../utils/sizeSimilarity';

// Validasi input untuk review
const validateReviewInput = (data) => {
  const errors = [];
  
  if (!data.product_id) errors.push('Product ID is required');
  if (!data.user_id) errors.push('User ID is required');
  if (!data.rating || data.rating < 1 || data.rating > 5) errors.push('Rating must be between 1 and 5');
  if (!data.review_text) errors.push('Review text is required');
  
  // Validasi measurements jika ada
  if (data.user_measurements) {
    const { waist, bust, hips, height } = data.user_measurements;
    if (waist && (waist < 50 || waist > 150)) errors.push('Invalid waist measurement');
    if (bust && (bust < 50 || bust > 150)) errors.push('Invalid bust measurement');
    if (hips && (hips < 50 || hips > 150)) errors.push('Invalid hips measurement');
    if (height && (height < 100 || height > 250)) errors.push('Invalid height measurement');
  }

  return errors;
};

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        const {
          page = 1,
          limit = 10,
          product_id,
          rating,
          sort = 'newest',
          sizeSimilarity = 'false',
          measurements
        } = req.query;

        // Validasi parameter
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        
        if (isNaN(pageNum) || pageNum < 1) {
          return res.status(400).json({
            success: false,
            message: 'Invalid page number'
          });
        }

        if (isNaN(limitNum) || limitNum < 1) {
          return res.status(400).json({
            success: false,
            message: 'Invalid limit number'
          });
        }

        // Build query
        const query = {};
        if (product_id) {
          query.product_id = product_id;
        }
        if (rating) {
          const ratingNum = parseInt(rating);
          if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
            query.rating = ratingNum;
          }
        }

        // Build sort options
        let sortOptions = {};
        switch (sort) {
          case 'newest':
            sortOptions = { created_at: -1 };
            break;
          case 'oldest':
            sortOptions = { created_at: 1 };
            break;
          case 'highest_rating':
            sortOptions = { rating: -1, created_at: -1 };
            break;
          case 'lowest_rating':
            sortOptions = { rating: 1, created_at: -1 };
            break;
          case 'most_helpful':
            sortOptions = { helpful_count: -1, created_at: -1 };
            break;
          default:
            sortOptions = { created_at: -1 };
        }

        // Execute query
        const skip = (pageNum - 1) * limitNum;
        let reviews = await Review.find(query)
          .sort(sortOptions)
          .exec();

        // Apply size similarity filter jika diperlukan
        if (sizeSimilarity === 'true' && measurements) {
          const userMeasurements = JSON.parse(measurements);
          
          // Validasi measurements
          const validMeasurements = ['waist', 'bust', 'hips', 'height'].every(
            m => typeof userMeasurements[m] === 'number'
          );

          if (!validMeasurements) {
            return res.status(400).json({
              success: false,
              message: 'Invalid measurements format'
            });
          }

          // Hitung similarity score dan filter
          reviews = reviews.map(review => {
            const similarityScore = calculateSizeSimilarity(
              userMeasurements,
              review.user_measurements
            );
            return { ...review.toObject(), sizeSimilarity: similarityScore };
          })
          .filter(review => review.sizeSimilarity >= 0.8)
          .sort((a, b) => {
            if (sort === 'size_similarity') {
              return b.sizeSimilarity - a.sizeSimilarity;
            }
            return 0;
          });
        }

        // Apply pagination after filtering
        const totalReviews = reviews.length;
        reviews = reviews.slice(skip, skip + limitNum);

        const totalPages = Math.ceil(totalReviews / limitNum);

        // Log available review IDs for debugging
        console.log('Available review IDs:', reviews.map(review => review._id));

        return res.status(200).json({
          success: true,
          data: {
            reviews,
            pagination: {
              total: totalReviews,
              totalPages,
              currentPage: pageNum,
              hasNextPage: pageNum < totalPages,
              hasPrevPage: pageNum > 1
            }
          }
        });

      case 'POST':
        const validationErrors = [];

        // Validasi input
        if (!req.body.product_id) validationErrors.push('Product ID is required');
        if (!req.body.user_id) validationErrors.push('User ID is required');
        if (!req.body.rating || req.body.rating < 1 || req.body.rating > 5) {
          validationErrors.push('Rating must be between 1 and 5');
        }
        if (!req.body.review_text || req.body.review_text.trim().length < 10) {
          validationErrors.push('Review text must be at least 10 characters long');
        }

        // Validasi user_measurements jika ada
        if (req.body.user_measurements) {
          const { waist, bust, hips, height } = req.body.user_measurements;
          if (waist && (waist < 50 || waist > 150)) validationErrors.push('Invalid waist measurement');
          if (bust && (bust < 50 || bust > 150)) validationErrors.push('Invalid bust measurement');
          if (hips && (hips < 50 || hips > 150)) validationErrors.push('Invalid hips measurement');
          if (height && (height < 100 || height > 250)) validationErrors.push('Invalid height measurement');
        }

        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
          });
        }

        const review = new Review(req.body);
        await review.save();

        // Log created review ID
        console.log('Created review ID:', review._id);

        return res.status(201).json({
          success: true,
          message: 'Review created successfully',
          data: review
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('Error handling review:', error);
    return res.status(500).json({
      success: false,
      message: 'Error handling review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 