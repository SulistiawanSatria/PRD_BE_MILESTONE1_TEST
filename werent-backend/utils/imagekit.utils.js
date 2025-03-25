const imagekit = require('../config/imagekit');

// Upload gambar ke ImageKit
exports.uploadImage = async (file, fileName) => {
    try {
        const uploadResponse = await imagekit.upload({
            file: file, // base64 encoded string
            fileName: fileName,
            folder: '/reviews', // folder di ImageKit
            tags: ['review', 'werent']
        });

        return {
            success: true,
            url: uploadResponse.url,
            fileId: uploadResponse.fileId
        };
    } catch (error) {
        console.error('ImageKit upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Hapus gambar dari ImageKit
exports.deleteImage = async (fileId) => {
    try {
        await imagekit.deleteFile(fileId);
        return {
            success: true
        };
    } catch (error) {
        console.error('ImageKit delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Generate URL untuk upload langsung dari client
exports.getAuthenticationParameters = () => {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return {
        ...authenticationParameters,
        uploadUrl: process.env.IMAGEKIT_URL_ENDPOINT
    };
};
