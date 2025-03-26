const { MongoClient } = require('mongodb');
require('dotenv').config();

const products = [
  {
    _id: "product_1",
    name: "Floral Summer Dress",
    description: "Beautiful floral dress perfect for summer",
    category: "dress",
    price: 250000,
    sizes: ["S", "M", "L"],
    images: ["https://example.com/dress1.jpg"]
  },
  {
    _id: "product_2",
    name: "Elegant Evening Gown",
    description: "Perfect for formal occasions",
    category: "gown",
    price: 500000,
    sizes: ["S", "M", "L", "XL"],
    images: ["https://example.com/gown1.jpg"]
  }
];

const reviews = [
  {
    product_id: "product_1",
    user_id: "user_1",
    rating: 5,
    review_text: "Dress ini sangat nyaman dipakai dan ukurannya pas!",
    helpful_count: 10,
    user_measurements: {
      waist: 70,
      bust: 90,
      hips: 95,
      height: 165
    },
    images: [],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_id: "product_1",
    user_id: "user_2",
    rating: 4,
    review_text: "Bahannya bagus tapi agak kebesaran di bagian pinggang",
    helpful_count: 5,
    user_measurements: {
      waist: 65,
      bust: 85,
      hips: 90,
      height: 160
    },
    images: [],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_id: "product_2",
    user_id: "user_3",
    rating: 5,
    review_text: "Gaunnya sangat elegan, cocok untuk acara formal",
    helpful_count: 15,
    user_measurements: {
      waist: 75,
      bust: 95,
      hips: 100,
      height: 170
    },
    images: [],
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function seedDatabase() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();

    // Clear existing data
    await db.collection('products').deleteMany({});
    await db.collection('reviews').deleteMany({});

    // Insert products
    await db.collection('products').insertMany(products);
    console.log('✅ Products seeded successfully');

    // Insert reviews
    await db.collection('reviews').insertMany(reviews);
    console.log('✅ Reviews seeded successfully');

    // Create indexes
    await db.collection('reviews').createIndex({ product_id: 1 });
    await db.collection('reviews').createIndex({ rating: 1 });
    await db.collection('reviews').createIndex({ helpful_count: -1 });
    await db.collection('reviews').createIndex({ created_at: -1 });
    console.log('✅ Indexes created successfully');

    await client.close();
    console.log('✨ Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 