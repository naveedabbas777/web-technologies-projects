const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📂 Created upload directory: ${uploadDir}`);
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: product-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'product-' + uniqueSuffix + ext;
        console.log(`📁 Temp file will be saved as: ${filename}`);
        cb(null, filename);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    console.log(`📋 File upload: ${file.originalname} (${file.mimetype})`);
    
    if (allowedMimes.includes(file.mimetype)) {
        console.log(`✓ File type accepted: ${file.mimetype}`);
        cb(null, true);
    } else {
        const error = new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)');
        console.error(`✗ File type rejected: ${file.mimetype}`);
        cb(error, false);
    }
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Add error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error(`❌ Multer error: ${err.code} - ${err.message}`);
        
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                status: 'error',
                message: 'File size exceeds 5MB limit'
            });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                status: 'error',
                message: 'Only one file allowed'
            });
        }
    } else if (err) {
        console.error(`❌ Upload error: ${err.message}`);
        return res.status(400).json({
            status: 'error',
            message: err.message || 'File upload failed'
        });
    }
    
    next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
