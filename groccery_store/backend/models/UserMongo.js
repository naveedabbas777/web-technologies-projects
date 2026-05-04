// MongoDB User Schema
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false // Don't return password by default
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    // Customer-specific
    default_address: {
        type: String,
        trim: true,
        default: ''
    },
    loyalty_points: {
        type: Number,
        default: 0
    },
    // Staff/Admin-specific
    position: {
        type: String,
        trim: true,
        default: ''
    },
    permissions: {
        type: [String],
        default: []
    },
    // Delivery rider-specific
    vehicle_type: {
        type: String,
        trim: true,
        default: ''
    },
    vehicle_number: {
        type: String,
        trim: true,
        default: ''
    },
    license_number: {
        type: String,
        trim: true,
        default: ''
    },
    available: {
        type: Boolean,
        default: false
    },
    current_location: {
        // store as GeoJSON-like object { lat, lng }
        type: {
            lat: { type: Number },
            lng: { type: Number }
        },
        default: null
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'staff', 'delivery_rider'],
        default: 'customer'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    avatar: {
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

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Alias for backward compatibility
userSchema.methods.matchPassword = userSchema.methods.comparePassword;


// Method to exclude sensitive data
userSchema.methods.toJSON = function() {
    const { __v, password, ...rest } = this.toObject();
    return rest;
};

module.exports = mongoose.model('User', userSchema);
