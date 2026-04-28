// MongoDB Message/Notification Schema
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation_id: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender_role: {
        type: String,
        required: true,
        enum: ['customer', 'admin', 'staff', 'delivery_rider']
    },
    recipient_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    recipient_role: {
        type: String,
        required: true,
        enum: ['customer', 'admin', 'staff', 'delivery_rider']
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 140
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    is_read: {
        type: Boolean,
        default: false,
        index: true
    },
    read_at: {
        type: Date,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

messageSchema.index({ recipient_user_id: 1, is_read: 1, created_at: -1 });
messageSchema.index({ conversation_id: 1, created_at: -1 });

module.exports = mongoose.model('Message', messageSchema);
