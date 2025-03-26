import Cors from 'cors';

// Initialize the cors middleware
const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://werent.vercel.app'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Helper method to wait for a middleware to execute before continuing
// And to get response data in the correct format
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function middleware(req, res) {
  // Run the CORS middleware
  await runMiddleware(req, res, cors);
  
  // Continue with the request
  return res.status(200).json({ message: 'Middleware passed' });
} 