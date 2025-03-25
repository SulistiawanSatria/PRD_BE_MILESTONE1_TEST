import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    if (cached.conn) {
      console.log('Using cached MongoDB connection');
      return cached.conn;
    }

    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password in logs

    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    cached.conn = await cached.promise;
    console.log('Successfully connected to MongoDB!');
    
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB connection is healthy (ping successful)');

    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });

    // Reset cache if connection fails
    cached.promise = null;
    cached.conn = null;

    if (error.name === 'MongoServerSelectionError') {
      throw new Error(
        'Could not connect to MongoDB. Please check:\n' +
        '1. Your network connection\n' +
        '2. MongoDB Atlas IP whitelist (add your current IP)\n' +
        '3. MongoDB Atlas username and password\n' +
        'For more details: https://www.mongodb.com/docs/atlas/security-whitelist/'
      );
    }

    throw error;
  }
} 