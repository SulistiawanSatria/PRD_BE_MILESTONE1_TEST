import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: ['dress', 'top', 'bottom', 'outerwear', 'accessories'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
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
    sizes: [{
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: true
    }],
    review_stats: {
        total_reviews: {
            type: Number,
            default: 0
        },
        average_rating: {
            type: Number,
            default: 0
        },
        rating_distribution: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 }
        },
        measurement_stats: {
            waist: {
                sum: { type: Number, default: 0 },
                count: { type: Number, default: 0 }
            },
            bust: {
                sum: { type: Number, default: 0 },
                count: { type: Number, default: 0 }
            },
            hips: {
                sum: { type: Number, default: 0 },
                count: { type: Number, default: 0 }
            },
            height: {
                sum: { type: Number, default: 0 },
                count: { type: Number, default: 0 }
            }
        }
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Method untuk mengupdate statistik review
productSchema.methods.updateReviewStats = async function() {
    const Review = mongoose.model('Review');
    
    const stats = await Review.aggregate([
        { $match: { product_id: this._id.toString() } },
        {
            $group: {
                _id: null,
                total_reviews: { $sum: 1 },
                average_rating: { $avg: '$rating' },
                rating_distribution: {
                    $push: '$rating'
                },
                waist_sum: { $sum: '$user_measurements.waist' },
                waist_count: { 
                    $sum: { $cond: [{ $ne: ['$user_measurements.waist', null] }, 1, 0] }
                },
                bust_sum: { $sum: '$user_measurements.bust' },
                bust_count: {
                    $sum: { $cond: [{ $ne: ['$user_measurements.bust', null] }, 1, 0] }
                },
                hips_sum: { $sum: '$user_measurements.hips' },
                hips_count: {
                    $sum: { $cond: [{ $ne: ['$user_measurements.hips', null] }, 1, 0] }
                },
                height_sum: { $sum: '$user_measurements.height' },
                height_count: {
                    $sum: { $cond: [{ $ne: ['$user_measurements.height', null] }, 1, 0] }
                }
            }
        }
    ]);

    if (stats.length > 0) {
        const stat = stats[0];
        
        // Hitung distribusi rating
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stat.rating_distribution.forEach(rating => {
            distribution[rating]++;
        });

        this.review_stats = {
            total_reviews: stat.total_reviews,
            average_rating: stat.average_rating,
            rating_distribution: distribution,
            measurement_stats: {
                waist: {
                    sum: stat.waist_sum || 0,
                    count: stat.waist_count || 0
                },
                bust: {
                    sum: stat.bust_sum || 0,
                    count: stat.bust_count || 0
                },
                hips: {
                    sum: stat.hips_sum || 0,
                    count: stat.hips_count || 0
                },
                height: {
                    sum: stat.height_sum || 0,
                    count: stat.height_count || 0
                }
            }
        };

        await this.save();
    }
};

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
