import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: [true, 'Product ID is required'],
        trim: true
    },
    user_id: {
        type: String,
        required: [true, 'User ID is required'],
        trim: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5']
    },
    review_text: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [10, 'Review text must be at least 10 characters long']
    },
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                return v.startsWith('http://') || v.startsWith('https://');
            },
            message: 'Image URL must be a valid URL'
        }
    }],
    helpful_count: {
        type: Number,
        default: 0,
        min: [0, 'Helpful count cannot be negative']
    },
    user_measurements: {
        waist: {
            type: Number,
            min: [50, 'Waist measurement must be at least 50cm'],
            max: [150, 'Waist measurement cannot be more than 150cm']
        },
        bust: {
            type: Number,
            min: [50, 'Bust measurement must be at least 50cm'],
            max: [150, 'Bust measurement cannot be more than 150cm']
        },
        hips: {
            type: Number,
            min: [50, 'Hips measurement must be at least 50cm'],
            max: [150, 'Hips measurement cannot be more than 150cm']
        },
        height: {
            type: Number,
            min: [100, 'Height must be at least 100cm'],
            max: [250, 'Height cannot be more than 250cm']
        }
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Middleware untuk memastikan updated_at selalu diupdate
reviewSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Static method untuk mendapatkan statistik review
reviewSchema.statics.getReviewStats = async function(productId) {
    const stats = await this.aggregate([
        { $match: { product_id: productId } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    return stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: []
    };
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
