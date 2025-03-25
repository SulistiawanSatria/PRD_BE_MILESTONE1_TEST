import { connectDB } from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import Review from '../../../../models/Review';
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
    const { page = 1, limit = 10 } = req.query;

    // Validasi ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Validasi pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    // Ambil produk dan update statistik review
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update statistik review
    await product.updateReviewStats();

    // Ambil review untuk produk dengan pagination
    const skip = (pageNum - 1) * limitNum;
    const [reviews, totalReviews] = await Promise.all([
      Review.find({ product_id: id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      Review.countDocuments({ product_id: id })
    ]);

    const totalPages = Math.ceil(totalReviews / limitNum);

    // Hitung rata-rata measurements dari review yang ada
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
        product: {
          ...product.toObject(),
          measurement_averages: measurementAverages
        },
        reviews: {
          items: reviews,
          pagination: {
            total: totalReviews,
            totalPages,
            currentPage: pageNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      }
    });

  } catch (error) {
    console.error('Error getting product details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting product details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
} 