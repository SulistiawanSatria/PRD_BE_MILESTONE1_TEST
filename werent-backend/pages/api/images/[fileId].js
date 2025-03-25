import imagekit from '../../../lib/imagekit';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`
        });
    }

    try {
        const { fileId } = req.query;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'File ID is required'
            });
        }

        // Hapus file dari ImageKit
        await imagekit.deleteFile(fileId);

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        
        // Handle specific ImageKit errors
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error deleting image',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
} 