// Order Controller
const mongoose = require('mongoose');
const Order = require('../models/OrderMongo');
const Product = require('../models/ProductMongo');
const Cart = require('../models/CartMongo');
const User = require('../models/UserMongo');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { invalidateByPrefix } = require('../utils/cacheStore');

const emitOrdersChanged = (req, payload = {}) => {
    const io = req.app?.get('io');
    if (io) {
        io.emit('orders:changed', payload);
    }

    invalidateByPrefix('cache:orders:').catch(() => {});
};

// Generate unique order number
const generateOrderNumber = () => {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${timestamp}-${random}`;
};

const generateInvoiceNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${timestamp}-${random}`;
};

// Create order
exports.createOrder = async (req, res) => {
    let reservedProducts = [];

    try {
        const userId = req.user?.id;
        const { delivery_address, address, payment_method, items, total } = req.body;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        // Get cart items if not provided
        let orderItems = items;
        if (!orderItems || orderItems.length === 0) {
            const cart = await Cart.findOne({ user_id: userId });
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cart is empty'
                });
            }
            orderItems = cart.items;
        }

        const finalDeliveryAddress = delivery_address || address;
        if (!finalDeliveryAddress) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide delivery address'
            });
        }

        // Prepare order items with validation
        const orderItemsData = [];
        let totalAmount = 0;

        for (const item of orderItems) {
            const quantity = parseInt(item.quantity, 10) || 1;
            const suppliedProductId = item.product_id || item._id || item.id;

            if (suppliedProductId && /^[a-f\d]{24}$/i.test(String(suppliedProductId))) {
                const product = await Product.findById(suppliedProductId);

                if (!product) {
                    return res.status(400).json({
                        status: 'error',
                        message: `Product not found: ${item.product_name || item.name || suppliedProductId}`
                    });
                }

                if (product.stock_quantity < quantity) {
                    return res.status(400).json({
                        status: 'error',
                        message: `Insufficient stock for ${product.name}`
                    });
                }

                const subtotal = product.price * quantity;
                orderItemsData.push({
                    product_id: product._id,
                    product_name: product.name,
                    quantity,
                    price: product.price,
                    subtotal
                });

                totalAmount += subtotal;
            } else {
                const unitPrice = parseFloat(item.price) || 0;
                const subtotal = unitPrice * quantity;
                orderItemsData.push({
                    product_id: null,
                    product_name: item.product_name || item.name || 'Product',
                    quantity,
                    price: unitPrice,
                    subtotal
                });
                totalAmount += subtotal;
            }
        }

        if (total && !Number.isNaN(parseFloat(total))) {
            totalAmount = parseFloat(total);
        }

        const orderPayload = {
            order_number: generateOrderNumber(),
            invoice_number: generateInvoiceNumber(),
            user_id: userId,
            items: orderItemsData,
            total_amount: totalAmount,
            delivery_address: finalDeliveryAddress,
            payment_method: payment_method || 'cash',
            status: 'pending',
            payment_status: payment_method === 'cash' ? 'pending' : 'pending'
        };

        let order;

        // Try transactional flow first for strong consistency.
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                for (const item of orderItemsData) {
                    if (!item.product_id) {
                        continue;
                    }

                    const updated = await Product.findOneAndUpdate(
                        { _id: item.product_id, stock_quantity: { $gte: item.quantity } },
                        { $inc: { stock_quantity: -item.quantity } },
                        { new: true, session }
                    );

                    if (!updated) {
                        throw new Error(`Insufficient stock for ${item.product_name}`);
                    }
                }

                order = new Order(orderPayload);
                await order.save({ session });

                await Cart.findOneAndUpdate(
                    { user_id: userId },
                    { items: [] },
                    { session }
                );
            });
        } catch (txError) {
            // Fallback for standalone Mongo deployments without transaction support.
            if (!/Transaction numbers are only allowed|replica set|NoSuchTransaction/i.test(txError.message)) {
                throw txError;
            }

            reservedProducts = [];
            for (const item of orderItemsData) {
                if (!item.product_id) {
                    continue;
                }

                const updated = await Product.findOneAndUpdate(
                    { _id: item.product_id, stock_quantity: { $gte: item.quantity } },
                    { $inc: { stock_quantity: -item.quantity } },
                    { new: true }
                );

                if (!updated) {
                    for (const reserved of reservedProducts) {
                        await Product.findByIdAndUpdate(
                            reserved.product_id,
                            { $inc: { stock_quantity: reserved.quantity } }
                        );
                    }

                    return res.status(400).json({
                        status: 'error',
                        message: `Insufficient stock for ${item.product_name}`
                    });
                }

                reservedProducts.push({
                    product_id: item.product_id,
                    quantity: item.quantity
                });
            }

            order = new Order(orderPayload);
            await order.save();

            await Cart.findOneAndUpdate(
                { user_id: userId },
                { items: [] }
            );
        } finally {
            await session.endSession();
        }

        if (!order) {
            return;
        }

        emitOrdersChanged(req, { orderId: order._id, type: 'created' });

        res.status(201).json({
            status: 'success',
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        if (reservedProducts.length > 0) {
            for (const reserved of reservedProducts) {
                await Product.findByIdAndUpdate(
                    reserved.product_id,
                    { $inc: { stock_quantity: reserved.quantity } }
                );
            }
        }

        console.error('Create Order Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create order'
        });
    }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status } = req.query;
        const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        let query = { user_id: userId };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort('-created_at')
            .skip(skip)
            .limit(limit)
            .populate('user_id', 'name email phone')
            .populate('items.product_id', 'name price');

        const total = await Order.countDocuments(query);

        res.status(200).json({
            status: 'success',
            orders,
            pagination: buildPaginationMeta({ page, limit, total })
        });
    } catch (error) {
        console.error('Get User Orders Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get orders'
        });
    }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const { status, payment_status } = req.query;
        const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });

        let query = {};
        if (status) query.status = status;
        if (payment_status) query.payment_status = payment_status;

        const orders = await Order.find(query)
            .sort('-created_at')
            .skip(skip)
            .limit(limit)
            .populate('user_id', 'name email phone address')
            .populate('rider_id', 'name phone');

        const total = await Order.countDocuments(query);

        res.status(200).json({
            status: 'success',
            orders,
            pagination: buildPaginationMeta({ page, limit, total })
        });
    } catch (error) {
        console.error('Get All Orders Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get orders'
        });
    }
};

// Get single order
exports.getOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('user_id', 'name email phone address')
            .populate('rider_id', 'name phone')
            .populate('items.product_id');

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        res.status(200).json({
            status: 'success',
            order
        });
    } catch (error) {
        console.error('Get Order Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get order'
        });
    }
};

// Update order status (admin/rider)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rider_id, notes } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status'
            });
        }

        const updateData = { updated_at: new Date() };
        if (status) updateData.status = status;
        if (rider_id) updateData.rider_id = rider_id;
        if (notes !== undefined) updateData.notes = notes;

        const order = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('user_id', 'name email phone')
        .populate('rider_id', 'name phone');

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Order status updated successfully',
            order
        });

        emitOrdersChanged(req, { orderId: order._id, type: 'updated' });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update order status'
        });
    }
};

// Update payment status (admin)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        const validStatuses = ['pending', 'completed', 'failed'];
        if (!validStatuses.includes(payment_status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { payment_status, updated_at: new Date() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Payment status updated successfully',
            order
        });

        emitOrdersChanged(req, { orderId: order._id, type: 'payment' });
    } catch (error) {
        console.error('Update Payment Status Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update payment status'
        });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    let restoredProducts = [];

    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const fail = (statusCode, message) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            throw error;
        };

        const validateCancellation = (order) => {
            if (!order) {
                fail(404, 'Order not found');
            }

            if (order.user_id.toString() !== userId && req.user?.role !== 'admin') {
                fail(403, 'Unauthorized');
            }

            if (req.user?.role !== 'admin' && order.status !== 'pending') {
                fail(400, 'Orders can only be cancelled before confirmation.');
            }

            if (req.user?.role === 'admin' && ['shipped', 'delivered', 'cancelled'].includes(order.status)) {
                fail(400, `Cannot cancel order with status: ${order.status}`);
            }
        };

        let cancelledOrder;

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const order = await Order.findById(id).session(session);
                validateCancellation(order);

                for (const item of order.items) {
                    if (!item.product_id) {
                        continue;
                    }

                    await Product.findByIdAndUpdate(
                        item.product_id,
                        { $inc: { stock_quantity: item.quantity } },
                        { session }
                    );
                }

                order.status = 'cancelled';
                order.updated_at = new Date();
                await order.save({ session });
                cancelledOrder = order;
            });
        } catch (txError) {
            if (!/Transaction numbers are only allowed|replica set|NoSuchTransaction/i.test(txError.message)) {
                throw txError;
            }

            const order = await Order.findById(id);
            validateCancellation(order);

            restoredProducts = [];
            for (const item of order.items) {
                if (!item.product_id) {
                    continue;
                }

                await Product.findByIdAndUpdate(
                    item.product_id,
                    { $inc: { stock_quantity: item.quantity } }
                );

                restoredProducts.push({
                    product_id: item.product_id,
                    quantity: item.quantity
                });
            }

            order.status = 'cancelled';
            order.updated_at = new Date();
            await order.save();
            cancelledOrder = order;
        } finally {
            await session.endSession();
        }

        if (!cancelledOrder) {
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Order cancelled successfully',
            order: cancelledOrder
        });

        emitOrdersChanged(req, { orderId: cancelledOrder._id, type: 'cancelled' });
    } catch (error) {
        if (restoredProducts.length > 0) {
            for (const restored of restoredProducts) {
                await Product.findByIdAndUpdate(
                    restored.product_id,
                    { $inc: { stock_quantity: -restored.quantity } }
                );
            }
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message
            });
        }

        console.error('Cancel Order Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to cancel order'
        });
    }
};

// Get order stats (admin only)
exports.getOrderStats = async (req, res) => {
    try {
        const statusFilter = req.query.status && req.query.status !== 'all'
            ? req.query.status
            : null;
        const match = statusFilter ? { status: statusFilter } : {};

        const getOrderDateField = { $ifNull: ['$created_at', '$createdAt'] };

        const buildSeries = async (labels, matchStart, matchEnd, groupExpr, sortExpr, labelFromId) => {
            const rows = await Order.aggregate([
                { $addFields: { orderDate: getOrderDateField } },
                {
                    $match: {
                        ...match,
                        orderDate: { $gte: matchStart, $lte: matchEnd }
                    }
                },
                {
                    $group: {
                        _id: groupExpr,
                        orders: { $sum: 1 },
                        sales: { $sum: '$total_amount' }
                    }
                },
                { $sort: sortExpr }
            ]);

            const map = new Map();
            rows.forEach((row) => {
                const label = labelFromId(row._id);
                map.set(label, row);
            });

            return {
                labels,
                orders: labels.map((label) => map.get(label)?.orders || 0),
                sales: labels.map((label) => map.get(label)?.sales || 0)
            };
        };

        const now = new Date();

        const dailyDays = 7;
        const dailyLabels = [];
        for (let i = dailyDays - 1; i >= 0; i -= 1) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            dailyLabels.push(d.toISOString().slice(0, 10));
        }
        const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dailyDays - 1));

        const weeklyWeeks = 8;
        const weeklyLabels = [];
        const getIsoWeek = (date) => {
            const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = temp.getUTCDay() || 7;
            temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
            return { year: temp.getUTCFullYear(), week: weekNo };
        };
        for (let i = weeklyWeeks - 1; i >= 0; i -= 1) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
            const iso = getIsoWeek(d);
            weeklyLabels.push(`${iso.year}-W${String(iso.week).padStart(2, '0')}`);
        }
        const weeklyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((weeklyWeeks - 1) * 7));

        const monthlyMonths = 12;
        const monthlyLabels = [];
        for (let i = monthlyMonths - 1; i >= 0; i -= 1) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthlyLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        const monthlyStart = new Date(now.getFullYear(), now.getMonth() - (monthlyMonths - 1), 1);

        const yearlyYears = 5;
        const yearlyLabels = [];
        for (let i = yearlyYears - 1; i >= 0; i -= 1) {
            const y = now.getFullYear() - i;
            yearlyLabels.push(String(y));
        }
        const yearlyStart = new Date(now.getFullYear() - (yearlyYears - 1), 0, 1);

        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ status: 'delivered' });
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        const stats = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total_amount' }
                }
            }
        ]);

        const revenue = await Order.aggregate([
            { $match: { status: 'delivered' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_amount' }
                }
            }
        ]);

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const totalSalesAgg = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_amount' }
                }
            }
        ]);

        const todaySalesAgg = await Order.aggregate([
            {
                $match: {
                    ...match,
                    created_at: {
                        $gte: startOfToday,
                        $lt: startOfTomorrow
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total_amount' }
                }
            }
        ]);

        const totalSales = totalSalesAgg[0]?.total || 0;
        const todaySales = todaySalesAgg[0]?.total || 0;
        const previousSales = Math.max(totalSales - todaySales, 0);

        const dailySeries = await buildSeries(
            dailyLabels,
            dailyStart,
            now,
            { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
            { _id: 1 },
            (id) => id
        );

        const weeklySeries = await buildSeries(
            weeklyLabels,
            weeklyStart,
            now,
            { year: { $isoWeekYear: '$orderDate' }, week: { $isoWeek: '$orderDate' } },
            { '_id.year': 1, '_id.week': 1 },
            (id) => `${id.year}-W${String(id.week).padStart(2, '0')}`
        );

        const monthlySeries = await buildSeries(
            monthlyLabels,
            monthlyStart,
            now,
            { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
            { _id: 1 },
            (id) => id
        );

        const yearlySeries = await buildSeries(
            yearlyLabels,
            yearlyStart,
            now,
            { $dateToString: { format: '%Y', date: '$orderDate' } },
            { _id: 1 },
            (id) => id
        );

        res.status(200).json({
            status: 'success',
            stats: {
                totalOrders,
                completedOrders,
                pendingOrders,
                cancelledOrders,
                totalRevenue: revenue[0]?.total || 0,
                byStatus: stats,
                sales: {
                    status: statusFilter || 'all',
                    today: todaySales,
                    previous: previousSales,
                    total: totalSales
                },
                timeline: {
                    daily: dailySeries,
                    weekly: weeklySeries,
                    monthly: monthlySeries,
                    yearly: yearlySeries
                }
            }
        });
    } catch (error) {
        console.error('Get Order Stats Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get stats'
        });
    }
};

// Assign rider to order (admin only)
exports.assignRider = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { riderId } = req.body;

        if (!riderId) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide rider ID'
            });
        }

        // Verify rider exists and has rider role
        const rider = await User.findById(riderId);
        if (!rider || rider.role !== 'delivery_rider') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid rider'
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { rider_id: riderId, status: 'shipped', updated_at: new Date() },
            { new: true }
        ).populate('rider_id', 'name phone');

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Rider assigned successfully',
            order
        });

        emitOrdersChanged(req, { orderId: order._id, type: 'assigned' });
    } catch (error) {
        console.error('Assign Rider Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to assign rider'
        });
    }
};

// Get available orders for rider
exports.getRiderAvailableOrders = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
        const query = {
            $or: [
                { rider_id: null },
                { rider_id: { $exists: false } }
            ],
            status: 'confirmed'
        };

        const orders = await Order.find({
            ...query
        })
        .sort('-created_at')
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'name phone address');

        const total = await Order.countDocuments(query);

        res.status(200).json({
            status: 'success',
            orders,
            pagination: buildPaginationMeta({ page, limit, total })
        });
    } catch (error) {
        console.error('Get Rider Available Orders Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to load available orders'
        });
    }
};

// Get assigned orders for rider
exports.getRiderOrders = async (req, res) => {
    try {
        const riderId = req.user?.id;
        const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
        const query = { rider_id: riderId };

        const orders = await Order.find(query)
            .sort('-created_at')
            .skip(skip)
            .limit(limit)
            .populate('user_id', 'name phone address')
            .populate('rider_id', 'name phone');

        const total = await Order.countDocuments(query);

        res.status(200).json({
            status: 'success',
            orders,
            pagination: buildPaginationMeta({ page, limit, total })
        });
    } catch (error) {
        console.error('Get Rider Orders Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to load rider orders'
        });
    }
};

// Rider claim order
exports.claimOrder = async (req, res) => {
    try {
        const riderId = req.user?.id;
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, rider_id: null, status: 'confirmed' });
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not available'
            });
        }

        order.rider_id = riderId;
        order.status = 'shipped';
        order.updated_at = new Date();
        await order.save();

        const populated = await Order.findById(order._id)
            .populate('user_id', 'name phone address')
            .populate('rider_id', 'name phone');

        res.status(200).json({
            status: 'success',
            message: 'Order claimed successfully',
            order: populated
        });

        emitOrdersChanged(req, { orderId: order._id, type: 'claimed' });
    } catch (error) {
        console.error('Claim Order Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to claim order'
        });
    }
};
