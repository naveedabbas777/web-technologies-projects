const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
});

// Log Cloudinary configuration status on startup
console.log('🔹 Cloudinary Config Status:');
console.log('  Cloud Name:', config.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('  API Key:', config.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('  API Secret:', config.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');

const uploadImageToCloudinary = async (localFilePath, folder) => {
    if (!localFilePath) {
        throw new Error('Local file path is required');
    }
    
    if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary credentials are not configured. Check your .env file.');
    }

    try {
        console.log(`📁 Uploading file from: ${localFilePath}`);
        console.log(`📂 Target folder: ${folder}`);
        
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder,
            resource_type: 'auto',
            timeout: 60000
        });

        console.log(`✅ Upload successful: ${result.secure_url}`);
        return result;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error.message);
        console.error('Error details:', error);
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

module.exports = {
    cloudinary,
    uploadImageToCloudinary
};
