// Customer Controller
const User = require('../models/UserMongo');
const Order = require('../models/OrderMongo');
const mongoose = require('mongoose');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// Get all customers (admin only)
exports.getAllCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        const { page: pageNum, limit: limitNum, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });

        let query = { role: 'customer' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await User.find(query)
            .select('-password')
            .sort({ created_at: -1, _id: -1 })
            .skip(skip)
            .limit(limitNum);

        const customerIds = customers.map(c => c._id);
        const statsRows = customerIds.length
            ? await Order.aggregate([
                { $match: { user_id: { $in: customerIds } } },
                {
                    $group: {
                        _id: '$user_id',
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: '$total_amount' }
                    }
                }
            ])
            : [];

        const statsMap = new Map(
            statsRows.map(row => [String(row._id), {
                totalOrders: row.totalOrders || 0,
                totalSpent: row.totalSpent || 0
            }])
        );

        const enrichedCustomers = customers.map(customer => {
            const payload = customer.toObject();
            payload.stats = statsMap.get(String(customer._id)) || { totalOrders: 0, totalSpent: 0 };
            return payload;
        });

        const total = await User.countDocuments(query);

        res.status(200).json({
            status: 'success',
            customers: enrichedCustomers,
            pagination: buildPaginationMeta({ page: pageNum, limit: limitNum, total })
        });
    } catch (error) {
        console.error('Get All Customers Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get customers'
        });
    }
};

// Get customer details
exports.getCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await User.findById(id).select('-password');
        if (!customer) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        // Get customer orders
        const orders = await Order.find({ user_id: id })
            .sort('-created_at')
            .limit(10);

        // Calculate customer stats
        const totalOrders = await Order.countDocuments({ user_id: id });
        const completedOrders = await Order.countDocuments({ user_id: id, status: 'delivered' });
        
        const orderStats = await Order.aggregate([
            { $match: { user_id: mongoose.Types.ObjectId(id) } },
            { $group: { _id: null, totalSpent: { $sum: '$total_amount' } } }
        ]);

        const totalSpent = orderStats[0]?.totalSpent || 0;

        res.status(200).json({
            status: 'success',
            customer: {
                ...customer.toObject(),
                stats: {
                    totalOrders,
                    completedOrders,
                    totalSpent,
                    recentOrders: orders
                }
            }
        });
    } catch (error) {
        console.error('Get Customer Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get customer'
        });
    }
};

// Get customer stats (admin only)
exports.getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const activeCustomers = await User.countDocuments({ role: 'customer', is_active: true });
        const inactiveCustomers = await User.countDocuments({ role: 'customer', is_active: false });

        const customerOrders = await Order.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$total_amount' }
                }
            },
            { $sort: { totalSpent: -1 } }
        ]);

        const topCustomers = customerOrders.slice(0, 10);

        // Get monthly new customers
        const monthlyNewCustomers = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$created_at' },
                        month: { $month: '$created_at' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        res.status(200).json({
            status: 'success',
            stats: {
                totalCustomers,
                activeCustomers,
                inactiveCustomers,
                topCustomers,
                monthlyNewCustomers
            }
        });
    } catch (error) {
        console.error('Get Customer Stats Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get customer stats'
        });
    }
};

// Update customer (admin only)
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, is_active } = req.body;

        const customer = await User.findById(id);
        if (!customer) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        if (name) customer.name = name;
        if (phone) customer.phone = phone;
        if (address) customer.address = address;
        if (is_active !== undefined) customer.is_active = is_active;
        customer.updated_at = new Date();

        await customer.save();

        const updatedCustomer = customer.toObject();
        delete updatedCustomer.password;

        res.status(200).json({
            status: 'success',
            message: 'Customer updated successfully',
            customer: updatedCustomer
        });
    } catch (error) {
        console.error('Update Customer Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update customer'
        });
    }
};

// Deactivate customer (admin only)
exports.deactivateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await User.findByIdAndUpdate(
            id,
            { is_active: false, updated_at: new Date() },
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Customer deactivated successfully',
            customer
        });
    } catch (error) {
        console.error('Deactivate Customer Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to deactivate customer'
        });
    }
};

// Activate customer (admin only)
exports.activateCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await User.findByIdAndUpdate(
            id,
            { is_active: true, updated_at: new Date() },
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Customer activated successfully',
            customer
        });
    } catch (error) {
        console.error('Activate Customer Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to activate customer'
        });
    }
};

// Delete customer (admin only)
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if customer has active orders
        const activeOrders = await Order.countDocuments({
            user_id: id,
            status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
        });

        if (activeOrders > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete customer with active orders'
            });
        }

        const result = await User.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Delete Customer Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to delete customer'
        });
    }
};

// Get customer orders
exports.getCustomerOrders = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });

        const orders = await Order.find({ user_id: id })
            .sort('-created_at')
            .skip(skip)
            .limit(limit)
            .populate('items.product_id');

        const total = await Order.countDocuments({ user_id: id });

        res.status(200).json({
            status: 'success',
            orders,
            pagination: buildPaginationMeta({ page, limit, total })
        });
    } catch (error) {
        console.error('Get Customer Orders Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get customer orders'
        });
    }
};
