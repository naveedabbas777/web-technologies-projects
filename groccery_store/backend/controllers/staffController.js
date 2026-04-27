// Staff Controller
const User = require('../models/UserMongo');

// Get all staff (admin only)
exports.getAllStaff = async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);

        let query = { role: { $in: ['admin', 'staff', 'delivery_rider'] } };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (pageNum - 1) * limitNum;
        const staff = await User.find(query)
            .select('-password')
            .sort({ created_at: -1, _id: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(query);

        res.status(200).json({
            status: 'success',
            staff,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.max(Math.ceil(total / limitNum), 1)
            }
        });
    } catch (error) {
        console.error('Get All Staff Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get staff'
        });
    }
};

// Get staff member details
exports.getStaffMember = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await User.findById(id).select('-password');
        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found'
            });
        }

        res.status(200).json({
            status: 'success',
            staff
        });
    } catch (error) {
        console.error('Get Staff Member Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get staff member'
        });
    }
};

// Add staff member (admin only)
exports.addStaffMember = async (req, res) => {
    try {
        const { name, email, password, phone, address, role } = req.body;

        // Validation
        if (!name || !email || !password || !phone || !role) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields'
            });
        }

        if (!['admin', 'staff', 'delivery_rider'].includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role. Must be admin, staff, or delivery_rider'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'User already exists with this email'
            });
        }

        // Create staff member
        const staff = new User({
            name,
            email: email.toLowerCase(),
            password,
            phone,
            address: address || '',
            role
        });

        await staff.save();

        const staffResponse = staff.toObject();
        delete staffResponse.password;

        res.status(201).json({
            status: 'success',
            message: 'Staff member added successfully',
            staff: staffResponse
        });
    } catch (error) {
        console.error('Add Staff Member Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to add staff member'
        });
    }
};

// Update staff member (admin only)
exports.updateStaffMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, role, is_active } = req.body;

        const staff = await User.findById(id);
        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found'
            });
        }

        if (role && !['admin', 'staff', 'delivery_rider'].includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role'
            });
        }

        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (address) staff.address = address;
        if (role) staff.role = role;
        if (is_active !== undefined) staff.is_active = is_active;
        staff.updated_at = new Date();

        await staff.save();

        const staffResponse = staff.toObject();
        delete staffResponse.password;

        res.status(200).json({
            status: 'success',
            message: 'Staff member updated successfully',
            staff: staffResponse
        });
    } catch (error) {
        console.error('Update Staff Member Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update staff member'
        });
    }
};

// Delete staff member (admin only)
exports.deleteStaffMember = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await User.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Staff member deleted successfully'
        });
    } catch (error) {
        console.error('Delete Staff Member Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to delete staff member'
        });
    }
};

// Get staff statistics (admin only)
exports.getStaffStats = async (req, res) => {
    try {
        const totalStaff = await User.countDocuments({ role: { $in: ['admin', 'staff', 'delivery_rider'] } });
        const activeStaff = await User.countDocuments({ role: { $in: ['admin', 'staff', 'delivery_rider'] }, is_active: true });
        const inactiveStaff = await User.countDocuments({ role: { $in: ['admin', 'staff', 'delivery_rider'] }, is_active: false });
        const admins = await User.countDocuments({ role: 'admin' });
        const riders = await User.countDocuments({ role: 'delivery_rider' });
        const staff = await User.countDocuments({ role: 'staff' });

        res.status(200).json({
            status: 'success',
            stats: {
                totalStaff,
                activeStaff,
                inactiveStaff,
                admins,
                riders,
                staff
            }
        });
    } catch (error) {
        console.error('Get Staff Stats Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get staff stats'
        });
    }
};

// Activate staff member (admin only)
exports.activateStaffMember = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await User.findByIdAndUpdate(
            id,
            { is_active: true, updated_at: new Date() },
            { new: true }
        ).select('-password');

        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Staff member activated successfully',
            staff
        });
    } catch (error) {
        console.error('Activate Staff Member Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to activate staff member'
        });
    }
};

// Deactivate staff member (admin only)
exports.deactivateStaffMember = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await User.findByIdAndUpdate(
            id,
            { is_active: false, updated_at: new Date() },
            { new: true }
        ).select('-password');

        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Staff member deactivated successfully',
            staff
        });
    } catch (error) {
        console.error('Deactivate Staff Member Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to deactivate staff member'
        });
    }
};

// Get delivery riders (for assigning to orders)
exports.getDeliveryRiders = async (req, res) => {
    try {
        const riders = await User.find({ role: 'delivery_rider', is_active: true })
            .select('-password');

        res.status(200).json({
            status: 'success',
            riders
        });
    } catch (error) {
        console.error('Get Delivery Riders Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get delivery riders'
        });
    }
};
