require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const connectDB = require('../config/database');

// Data produk dummy
const products = [
    {
        name: "Elegant Evening Gown",
        description: "A stunning black evening gown perfect for formal occasions"
    },
    {
        name: "Summer Floral Dress",
        description: "Light and breezy floral dress ideal for summer parties"
    },
    {
        name: "Classic Cocktail Dress",
        description: "Timeless cocktail dress suitable for any semi-formal event"
    },
    {
        name: "Wedding Guest Dress",
        description: "Beautiful dress perfect for attending weddings"
    },
    {
        name: "Business Formal Dress",
        description: "Professional dress suitable for business meetings"
    }
];

// Generate review text yang realistis
const reviewTexts = [
    "Saya sangat puas dengan gaun ini! Ukurannya pas dan kualitasnya bagus. Saya mendapat banyak pujian saat memakainya.",
    "Gaun yang cantik dan nyaman dipakai. Bahannya adem dan tidak mudah kusut. Sangat worth it untuk disewa.",
    "Pengalaman pertama sewa baju dan tidak mengecewakan. Pelayanannya bagus dan gaunnya sesuai ekspektasi.",
    "Ukurannya sedikit kebesaran untuk saya, tapi overall gaunnya bagus. Mungkin next time akan pesan size yang lebih kecil.",
    "Perfect dress for the occasion! Fittingnya pas dan modelnya sesuai dengan foto.",
    "Bahannya premium dan jahitannya rapi. Recommended untuk disewa!",
    "Gaunnya elegan dan cocok untuk acara formal. Harga sewanya juga reasonable untuk kualitas seperti ini.",
    "Suka banget sama modelnya yang timeless. Bisa dipake ke berbagai acara formal.",
    "Warnanya sesuai dengan foto, tapi size chart-nya agak tricky. Sebaiknya pesan yang lebih kecil dari biasa.",
    "Overall satisfied with the dress. Pengirimannya tepat waktu dan kondisi gaun sangat baik."
];

// Generate ukuran tubuh yang realistis
const generateMeasurements = () => {
    return {
        waist: Math.floor(Math.random() * (85 - 60 + 1)) + 60, // 60-85 cm
        bust: Math.floor(Math.random() * (100 - 75 + 1)) + 75, // 75-100 cm
        hips: Math.floor(Math.random() * (105 - 80 + 1)) + 80, // 80-105 cm
        height: Math.floor(Math.random() * (175 - 150 + 1)) + 150 // 150-175 cm
    };
};

// Generate review dummy
const generateReviews = (productId) => {
    const numberOfReviews = Math.floor(Math.random() * 8) + 3; // 3-10 reviews per product
    const reviews = [];

    for (let i = 0; i < numberOfReviews; i++) {
        const rating = Math.floor(Math.random() * 3) + 3; // Rating 3-5
        const helpfulCount = Math.floor(Math.random() * 50); // 0-49 helpful counts
        const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        const measurements = generateMeasurements();

        reviews.push({
            product_id: productId,
            user_id: new mongoose.Types.ObjectId(), // Generate random user ID
            rating,
            review_text: reviewText,
            helpful_count: helpfulCount,
            user_measurements: measurements,
            images: [], // Kosong karena ImageKit memerlukan upload real
            created_at: new Date(Date.now() - Math.floor(Math.random() * 7776000000)) // Random date dalam 90 hari terakhir
        });
    }

    return reviews;
};

// Fungsi utama untuk seed database
const seedDatabase = async () => {
    try {
        // Connect ke database
        await connectDB();

        // Hapus data yang ada
        await Product.deleteMany({});
        await Review.deleteMany({});

        console.log('Database cleared');

        // Create products dan reviews
        for (const productData of products) {
            // Create product
            const product = await Product.create(productData);
            console.log(`Created product: ${product.name}`);

            // Generate dan create reviews untuk product
            const reviews = generateReviews(product._id);
            await Review.insertMany(reviews);

            // Update product dengan review statistics
            const reviewCount = reviews.length;
            const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount;

            await Product.findByIdAndUpdate(product._id, {
                review_count: reviewCount,
                average_rating: averageRating,
                reviews: reviews.map(review => review._id)
            });

            console.log(`Created ${reviewCount} reviews for ${product.name}`);
        }

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Jalankan seeder
seedDatabase();
