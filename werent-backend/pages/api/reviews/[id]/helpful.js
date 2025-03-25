import { connectDB } from '../../../../lib/mongodb';
import Review from '../../../../models/Review';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`
    });
  }

  try {
    await connectDB();
    const { id } = req.query;

    // Validasi ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    // Cek apakah review ada
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Increment helpful_count
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpful_count: 1 } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        helpful_count: updatedReview.helpful_count
      }
    });

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 