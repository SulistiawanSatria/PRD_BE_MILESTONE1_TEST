import { connectDB } from '../../../lib/mongodb';
import Product from '../../../models/Product';
import Review from '../../../models/Review';

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const product = await Product.findById(id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        // Get review stats
        const reviews = await Review.find({ product_id: id });
        const stats = {
          total_reviews: reviews.length,
          average_rating: reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0,
          rating_distribution: {
            1: reviews.filter(r => r.rating === 1).length,
            2: reviews.filter(r => r.rating === 2).length,
            3: reviews.filter(r => r.rating === 3).length,
            4: reviews.filter(r => r.rating === 4).length,
            5: reviews.filter(r => r.rating === 5).length,
          }
        };

        res.status(200).json({
          success: true,
          data: {
            product,
            stats
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        success: false,
        message: `Method ${req.method} Not Allowed`
      });
  }
} 