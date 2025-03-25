import imagekit from '../../../lib/imagekit';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`
        });
    }

    try {
        const { file, fileName } = req.body;

        if (!file || !fileName) {
            return res.status(400).json({
                success: false,
                message: 'File and fileName are required'
            });
        }

        // Validasi file size (max 5MB)
        const base64Size = file.length * 0.75; // Approximate size in bytes
        if (base64Size > 5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: 'File size must be less than 5MB'
            });
        }

        // Validasi file type
        const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
        const fileType = file.match(/^data:([^;]+);base64,/)?.[1];
        if (!fileType || !allowedTypes.includes(fileType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG, and MP4 are allowed'
            });
        }

        // Upload ke ImageKit
        const uploadResponse = await imagekit.upload({
            file,
            fileName,
            folder: '/werent/reviews'
        });

        return res.status(200).json({
            success: true,
            data: {
                url: uploadResponse.url,
                fileId: uploadResponse.fileId
            }
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
} 