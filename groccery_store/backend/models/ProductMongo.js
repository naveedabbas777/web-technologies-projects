// MongoDB Product Schema
const mongoose = require('mongoose');

const normalizeCategory = (value = '') => {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
};

const toFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

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
        trim: true,
        set: normalizeCategory,
        minlength: 2,
        maxlength: 50
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [0, 'Price must be greater than or equal to 0'],
        set: (value) => toFiniteNumber(value, 0)
    },
    stock_quantity: {
        type: Number,
        default: 0,
        min: [0, 'Stock quantity must be greater than or equal to 0'],
        set: (value) => toFiniteNumber(value, 0)
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
        default: 4.5,
        set: (value) => toFiniteNumber(value, 4.5)
    },
    reviews_count: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true
    }
});

productSchema.virtual('isLowStock').get(function () {
    return Number(this.stock_quantity || 0) <= 5;
});

productSchema.virtual('isExpired').get(function () {
    if (!this.expiry_date) return false;
    return new Date(this.expiry_date).getTime() <= Date.now();
});

productSchema.virtual('isExpiringSoon').get(function () {
    if (!this.expiry_date) return false;
    const diffDays = Math.ceil((new Date(this.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
});

productSchema.pre('validate', function (next) {
    if (this.category) {
        this.category = normalizeCategory(this.category);
    }

    if (this.name) {
        this.name = String(this.name).trim();
    }

    if (this.description) {
        this.description = String(this.description).trim();
    }

    this.updated_at = new Date();
    next();
});

productSchema.statics.normalizeCategory = normalizeCategory;

// Index for better query performance
productSchema.index({ category: 1 });
productSchema.index({ category: 1, is_active: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ is_active: 1, created_at: -1 });

module.exports = mongoose.model('Product', productSchema);
