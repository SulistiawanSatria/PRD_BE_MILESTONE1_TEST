const express = require('express');
const router = express.Router();
const imagekitUtils = require('../utils/imagekit.utils');

// Get authentication parameters untuk client-side upload
router.get('/auth', (req, res) => {
    try {
        const authParams = imagekitUtils.getAuthenticationParameters();
        res.json({
            success: true,
            data: authParams
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting authentication parameters',
            error: error.message
        });
    }
});

// Upload gambar ke ImageKit (server-side)
router.post('/upload', async (req, res) => {
    try {
        const { file, fileName } = req.body;

        if (!file || !fileName) {
            return res.status(400).json({
                success: false,
                message: 'File and fileName are required'
            });
        }

        const result = await imagekitUtils.uploadImage(file, fileName);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image',
                error: result.error
            });
        }

        res.json({
            success: true,
            data: {
                url: result.url,
                fileId: result.fileId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
});

// Hapus gambar dari ImageKit
router.delete('/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const result = await imagekitUtils.deleteImage(fileId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to delete image',
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting image',
            error: error.message
        });
    }
});

module.exports = router;
