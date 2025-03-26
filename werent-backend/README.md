# WeRent Backend API

WeRent Backend API adalah layanan backend untuk aplikasi WeRent yang menyediakan endpoint untuk manajemen review produk, termasuk fitur upload gambar dan perhitungan kesamaan ukuran.

## Tech Stack

- Next.js 14
- MongoDB
- ImageKit untuk manajemen gambar
- CORS untuk keamanan cross-origin

## Prerequisites

- Node.js v18 atau lebih tinggi
- MongoDB
- Akun ImageKit (untuk manajemen gambar)

## Setup Development Environment

1. Clone repository
```bash
git clone https://github.com/yourusername/werent-backend.git
cd werent-backend
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
Buat file `.env` di root directory dengan konten berikut:
```env
MONGODB_URI=mongodb://localhost:27017/werent
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=your_url_endpoint
```

4. Jalankan development server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## API Documentation

### Reviews Endpoint

#### GET /api/reviews
Mendapatkan daftar review dengan filter dan pagination.

**Query Parameters:**
- `page` (optional): Nomor halaman (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 10, max: 100)
- `product_id` (optional): Filter berdasarkan ID produk
- `rating` (optional): Filter berdasarkan rating (1-5)
- `sort` (optional): Pengurutan berdasarkan:
  - `newest` (default)
  - `oldest`
  - `highest_rating`
  - `lowest_rating`
  - `most_helpful`
- `sizeSimilarity` (optional): Filter berdasarkan kesamaan ukuran
- `measurements` (optional): Ukuran tubuh untuk perhitungan kesamaan

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
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

#### POST /api/reviews
Membuat review baru.

**Request Body:**
```json
{
  "product_id": "product_123",
  "user_id": "user_123",
  "rating": 5,
  "review_text": "Produk sangat bagus!",
  "user_measurements": {
    "waist": 70,
    "bust": 90,
    "hips": 95,
    "height": 165
  },
  "image_urls": ["url1", "url2"]
}
```

#### PUT /api/reviews/[id]
Mengupdate review yang ada.

**Request Body:**
```json
{
  "rating": 4,
  "review_text": "Update review text",
  "user_measurements": {
    "waist": 72,
    "bust": 92,
    "hips": 97,
    "height": 165
  }
}
```

#### DELETE /api/reviews/[id]
Menghapus review.

#### POST /api/reviews/[id]/helpful
Menandai review sebagai helpful.

### Products Endpoint

#### GET /api/products/[id]
Mendapatkan detail produk.

#### GET /api/products/[id]/stats
Mendapatkan statistik review untuk produk.

### Images Endpoint

#### GET /api/images/auth
Mendapatkan token autentikasi untuk upload gambar.

#### POST /api/images/upload
Upload gambar baru.

**Request Body:**
```json
{
  "file": "base64_encoded_image",
  "fileName": "review_image.jpg",
  "folder": "/reviews"
}
```

#### DELETE /api/images/[id]
Menghapus gambar.

## Testing dengan Postman

1. Import collection WeRent API ke Postman
2. Setup environment variables di Postman:
   - `base_url`: http://localhost:3000
   - `product_id`: ID produk yang valid
   - `review_id`: ID review yang valid

3. Flow testing yang disarankan:

   a. Create Review:
   ```http
   POST {{base_url}}/api/reviews
   Content-Type: application/json

   {
     "product_id": "{{product_id}}",
     "user_id": "test_user",
     "rating": 5,
     "review_text": "Test review",
     "user_measurements": {
       "waist": 70,
       "bust": 90,
       "hips": 95,
       "height": 165
     }
   }
   ```

   b. Get Reviews with Filter:
   ```http
   GET {{base_url}}/api/reviews?product_id={{product_id}}&rating=5&sort=most_helpful
   ```

   c. Get Reviews with Size Similarity:
   ```http
   GET {{base_url}}/api/reviews?sizeSimilarity=true&measurements={"waist":70,"bust":90,"hips":95,"height":165}
   ```

   d. Mark Review as Helpful:
   ```http
   POST {{base_url}}/api/reviews/{{review_id}}/helpful
   ```

   e. Get Product Details:
   ```http
   GET {{base_url}}/api/products/{{product_id}}
   ```

   f. Get Product Stats:
   ```http
   GET {{base_url}}/api/products/{{product_id}}/stats
   ```

   g. Upload Image:
   ```http
   # 1. Get auth token
   GET {{base_url}}/api/images/auth

   # 2. Upload image
   POST {{base_url}}/api/images/upload
   Content-Type: application/json

   {
     "file": "base64_encoded_image",
     "fileName": "test_image.jpg",
     "folder": "/reviews"
   }
   ```

## Error Handling

Semua endpoint mengembalikan response dalam format yang konsisten:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

Status code yang umum:
- 200: Success
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

## Size Similarity Calculation

Perhitungan kesamaan ukuran menggunakan formula:
```javascript
similarity = 1 - (totalDifference / maxPossibleDifference)
```

Dimana:
- `totalDifference`: Jumlah perbedaan absolut antara ukuran
- `maxPossibleDifference`: Maksimum perbedaan yang mungkin (40cm)

## Rate Limiting & Security

- CORS diimplementasikan untuk keamanan cross-origin
- Validasi input untuk semua endpoint
- Rate limiting akan diimplementasikan di masa depan
- Autentikasi akan diimplementasikan di masa depan

## Contributing Guidelines

1. Fork repository
2. Buat branch baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## License

MIT License

## Link Postman 
https://documenter.getpostman.com/view/38606972/2sAYkKJdZ2