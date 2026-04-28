// MongoDB Delivery Schema
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },
    rider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'failed'],
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
    delivery_time: {
        type: String,
        default: null
    },
    estimated_delivery: {
        type: Date,
        default: null
    },
    current_location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: null
        }
    },
    delivery_notes: {
        type: String,
        default: null
    },
    signature_required: {
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
}, { timestamps: true });

// Geospatial index
deliverySchema.index({ 'current_location': '2dsphere' });
deliverySchema.index({ rider_id: 1 });
deliverySchema.index({ status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
