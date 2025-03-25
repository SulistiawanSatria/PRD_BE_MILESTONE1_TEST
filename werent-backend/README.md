# WeRent Review API Documentation

## Overview
WeRent Review API adalah backend service untuk sistem review  WeRent. API ini menangani manajemen review produk, termasuk upload gambar, statistik review, dan fitur pencarian review berdasarkan kemiripan ukuran tubuh.

## Tech Stack
- Next.js 14
- MongoDB
- ImageKit (untuk manajemen gambar)

## Prerequisites
- Node.js v18 atau lebih tinggi
- MongoDB
- Akun ImageKit

## Setup Development Environment

1. Clone repository:
```bash
git clone https://github.com/yourusername/werent-backend.git
cd werent-backend
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables (.env):
```env
# MongoDB
MONGODB_URI=your_mongodb_uri

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

4. Jalankan development server:
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### 📁 Reviews

#### 1. Get Product Reviews
```http
GET /reviews
```

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| product_id | string | Filter by product ID |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10, max: 100) |
| sort | string | Sort order: newest, oldest, highest_rating, lowest_rating, most_helpful, size_similarity |
| rating | number | Filter by rating (1-5) |
| sizeSimilarity | boolean | Enable size similarity filter |
| measurements | object | Required if sizeSimilarity=true |

Example Request:
```http
GET /reviews?product_id=product_123&page=1&limit=10&sort=most_helpful&rating=5
```

Size Similarity Example:
```http
GET /reviews?sizeSimilarity=true&measurements={"waist":70,"bust":90,"hips":95,"height":165}&sort=size_similarity
```

Response:
```json
{
    "success": true,
    "data": {
        "reviews": [{
            "_id": "review_id",
            "product_id": "product_123",
            "user_id": "user_456",
            "rating": 5,
            "review_text": "Review text",
            "images": ["image_url1"],
            "helpful_count": 10,
            "user_measurements": {
                "waist": 70,
                "bust": 90,
                "hips": 95,
                "height": 165
            },
            "sizeSimilarity": 0.95,
            "created_at": "2024-03-25T10:00:00Z",
            "updated_at": "2024-03-25T10:00:00Z"
        }],
        "pagination": {
            "total": 50,
            "totalPages": 5,
            "currentPage": 1,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    }
}
```

#### 2. Create Review
```http
POST /reviews
Content-Type: application/json

{
    "product_id": "product_123",
    "user_id": "user_456",
    "rating": 5,
    "review_text": "This dress is amazing! Perfect fit and great quality.",
    "user_measurements": {
        "waist": 70,
        "bust": 90,
        "hips": 95,
        "height": 165
    },
    "images": ["https://ik.imagekit.io/werent/image1.jpg"]
}
```

Validation Rules:
- rating: 1-5
- review_text: minimal 10 karakter
- user_measurements:
  - waist: 50-150 cm
  - bust: 50-150 cm
  - hips: 50-150 cm
  - height: 100-250 cm

#### 3. Update Review
```http
PUT /reviews/67e2edd4e54e45570e86ea60
Content-Type: application/json

{
    "rating": 4,
    "review_text": "Updated review text",
    "user_measurements": {
        "waist": 70,
        "bust": 90,
        "hips": 95,
        "height": 165
    }
}
```

#### 4. Delete Review
```http
DELETE /reviews/67e2edd4e54e45570e86ea60
```

#### 5. Mark Review as Helpful
```http
POST /reviews/67e2edd4e54e45570e86ea60/helpful
```

### 📁 Products

#### 1. Get Product Details
```http
GET /products/67e2edd4e54e45570e86ea60
```

Response:
```json
{
    "success": true,
    "data": {
        "product": {
            "_id": "product_id",
            "name": "Product Name",
            "description": "Product description",
            "category": "dress",
            "price": 250000,
            "sizes": ["S", "M", "L"],
            "images": ["image_url1"],
            "review_stats": {
                "total_reviews": 10,
                "average_rating": 4.5,
                "rating_distribution": {
                    "1": 0,
                    "2": 1,
                    "3": 2,
                    "4": 3,
                    "5": 4
                }
            },
            "measurement_averages": {
                "waist": 70,
                "bust": 90,
                "hips": 95,
                "height": 165
            }
        },
        "reviews": {
            "items": [],
            "pagination": {
                "total": 10,
                "totalPages": 1,
                "currentPage": 1
            }
        }
    }
}
```

#### 2. Get Product Review Stats
```http
GET /products/67e2edd4e54e45570e86ea60/stats
```

### 📁 Images

#### 1. Get Upload Auth
```http
GET /images/auth
```

Response:
```json
{
    "success": true,
    "data": {
        "signature": "signature_string",
        "token": "token_string",
        "expire": 1234567890,
        "uploadUrl": "https://upload.imagekit.io/your_imagekit_id"
    }
}
```

#### 2. Upload Image
```http
POST /images/upload
Content-Type: application/json

{
    "file": "data:image/jpeg;base64,...",
    "fileName": "review-image.jpg"
}
```

Rules:
- Max file size: 5MB
- Supported formats: JPEG, PNG, MP4

#### 3. Delete Image
```http
DELETE /images/file_id_from_imagekit
```

## Testing dengan Postman

1. Import Postman Collection:
   - Download [WeRent-Review-API.postman_collection.json](link-to-collection)
   - Import ke Postman

2. Setup Environment Variables di Postman:
   ```
   BASE_URL: http://localhost:3000/api
   PRODUCT_ID: (dari database)
   REVIEW_ID: (dari response create review)
   IMAGE_ID: (dari response upload image)
   ```

3. Testing Flow:
   1. Create Review:
      - Gunakan endpoint POST /reviews
      - Simpan review_id dari response

   2. Upload Image:
      - Get auth token dengan GET /images/auth
      - Upload image dengan POST /images/upload
      - Gunakan image URL di create/update review

   3. Test Review Operations:
      - Update review dengan PUT /reviews/{review_id}
      - Mark as helpful dengan POST /reviews/{review_id}/helpful
      - Delete review dengan DELETE /reviews/{review_id}

   4. Test Filters & Sorting:
      - Test berbagai kombinasi query parameters di GET /reviews
      - Test size similarity filter dengan measurements yang berbeda

   5. Test Product Stats:
      - Get product details dengan GET /products/{product_id}
      - Get review stats dengan GET /products/{product_id}/stats

## Error Handling

Semua endpoint mengembalikan response error dalam format:
```json
{
    "success": false,
    "message": "Error message",
    "error": "Detailed error message (only in development)"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 404: Not Found
- 405: Method Not Allowed
- 500: Internal Server Error

## Size Similarity Calculation

Size similarity dihitung berdasarkan:
- Bobot: waist (25%), bust (25%), hips (25%), height (25%)
- Score: 0 (tidak mirip) sampai 1 (sangat mirip)
- Threshold untuk filter: 0.8 (80% similarity)

## Rate Limiting & Security
- Max file size: 5MB
- Max items per page: 100
- Authentication: Not implemented (TODO)

## Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License
MIT License


## Link Postman 
https://documenter.getpostman.com/view/38606972/2sAYkKJdZ2