// MongoDB Order Schema
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
        default: null
    },
    product_name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    invoice_number: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    delivery_address: {
        type: String,
        required: true,
        trim: true
    },
    delivery_date: {
        type: Date,
        default: null
    },
    payment_method: {
        type: String,
        enum: ['cash', 'card', 'easypaisa', 'jazzcash'],
        default: 'cash'
    },
    payment_status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    rider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    notes: {
        type: String,
        default: null
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

// Indexes for better query performance
orderSchema.index({ user_id: 1, created_at: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ rider_id: 1 });
orderSchema.index({ order_number: 1 });
orderSchema.index({ invoice_number: 1 });

module.exports = mongoose.model('Order', orderSchema);
