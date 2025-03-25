require('dotenv').config();

// Override environment variables for testing
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
