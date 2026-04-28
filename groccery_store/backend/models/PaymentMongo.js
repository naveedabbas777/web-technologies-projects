// MongoDB Payment Schema
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    payment_method: {
        type: String,
        enum: ['cash', 'card', 'easypaisa', 'jazzcash'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transaction_id: {
        type: String,
        unique: true,
        sparse: true
    },
    transaction_date: {
        type: Date,
        default: null
    },
    gateway_response: {
        type: Object,
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

// Indexes
paymentSchema.index({ order_id: 1 });
paymentSchema.index({ user_id: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
