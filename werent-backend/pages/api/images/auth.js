import imagekit from '../../../lib/imagekit';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`
        });
    }

    try {
        const authenticationParameters = imagekit.getAuthenticationParameters();
        return res.status(200).json({
            success: true,
            data: authenticationParameters
        });
    } catch (error) {
        console.error('Error getting ImageKit auth:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting ImageKit authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
} 