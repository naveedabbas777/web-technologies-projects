// MongoDB Product Schema
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
        maxlength: 150
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: 0
    },
    stock_quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    expiry_date: {
        type: Date,
        default: null
    },
    image_url: {
        type: String,
        default: null
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 4.5
    },
    reviews_count: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for better query performance
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ is_active: 1, created_at: -1 });

module.exports = mongoose.model('Product', productSchema);
