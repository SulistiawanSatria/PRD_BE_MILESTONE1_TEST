import { connectDB } from '../../../../lib/mongodb';
import Review from '../../../../models/Review';
import mongoose from 'mongoose';

// Validasi input untuk update review
const validateUpdateInput = (data) => {
  const errors = [];
  
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    errors.push('Rating must be between 1 and 5');
  }

  if (data.review_text && data.review_text.trim().length < 10) {
    errors.push('Review text must be at least 10 characters long');
  }
  
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
    const { id } = req.query;

    console.log('Attempting to process review with ID:', id);

    // Validasi ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format. Must be a valid MongoDB ObjectId',
        example: 'Example: 67e2ebf5e54e45570e86ea58'
      });
    }

    switch (req.method) {
      case 'PUT':
        try {
          // Validasi input
          const validationErrors = validateUpdateInput(req.body);
          if (validationErrors.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Validation failed',
              errors: validationErrors
            });
          }

          // Cek apakah review ada
          const existingReview = await Review.findById(id);
          if (!existingReview) {
            return res.status(404).json({
              success: false,
              message: 'Review not found'
            });
          }

          // Update review
          const allowedUpdates = ['rating', 'review_text', 'images', 'user_measurements'];
          const updateData = {};
          Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
              updateData[key] = req.body[key];
            }
          });

          const review = await Review.findByIdAndUpdate(
            id,
            { 
              $set: updateData,
              updated_at: new Date()
            },
            { new: true, runValidators: true }
          );

          console.log('Successfully updated review:', review._id);

          return res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: review
          });
        } catch (error) {
          console.error('Error updating review:', error);
          return res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }
        break;

      case 'DELETE':
        try {
          // Cek apakah review ada
          const existingReview = await Review.findById(id);
          if (!existingReview) {
            return res.status(404).json({
              success: false,
              message: 'Review not found'
            });
          }

          await Review.findByIdAndDelete(id);
          console.log('Successfully deleted review:', id);

          return res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            data: { id }
          });
        } catch (error) {
          console.error('Error deleting review:', error);
          return res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }
        break;

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 