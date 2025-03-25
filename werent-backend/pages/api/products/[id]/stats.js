import { connectDB } from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
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
        message: 'Invalid product ID format'
      });
    }

    // Ambil produk dan update statistik
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update statistik review
    await product.updateReviewStats();

    // Hitung rata-rata measurements
    const measurementAverages = {
      waist: product.review_stats.measurement_stats.waist.count > 0
        ? product.review_stats.measurement_stats.waist.sum / product.review_stats.measurement_stats.waist.count
        : null,
      bust: product.review_stats.measurement_stats.bust.count > 0
        ? product.review_stats.measurement_stats.bust.sum / product.review_stats.measurement_stats.bust.count
        : null,
      hips: product.review_stats.measurement_stats.hips.count > 0
        ? product.review_stats.measurement_stats.hips.sum / product.review_stats.measurement_stats.hips.count
        : null,
      height: product.review_stats.measurement_stats.height.count > 0
        ? product.review_stats.measurement_stats.height.sum / product.review_stats.measurement_stats.height.count
        : null
    };

    return res.status(200).json({
      success: true,
      data: {
        total_reviews: product.review_stats.total_reviews,
        average_rating: product.review_stats.average_rating,
        rating_distribution: product.review_stats.rating_distribution,
        measurement_stats: {
          averages: measurementAverages,
          counts: {
            waist: product.review_stats.measurement_stats.waist.count,
            bust: product.review_stats.measurement_stats.bust.count,
            hips: product.review_stats.measurement_stats.hips.count,
            height: product.review_stats.measurement_stats.height.count
          }
        }
      }
    });

  } catch (error) {
    console.error('Error getting product stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting product stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 