// MongoDB Category Schema
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a category name'],
        trim: true,
        maxlength: 100
    },
    name_lower: {
        type: String,
        required: true,
        unique: true,
        index: true
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

categorySchema.pre('validate', function(next) {
    if (this.name) {
        this.name_lower = String(this.name).trim().toLowerCase();
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);
