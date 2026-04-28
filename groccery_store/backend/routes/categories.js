const express = require('express');
const router = express.Router();
const Category = require('../models/CategoryMongo');
const Product = require('../models/ProductMongo');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { cacheGet } = require('../middleware/cacheMiddleware');
const { invalidateByPrefix } = require('../utils/cacheStore');

router.get('/', verifyToken, isAdmin, cacheGet({ keyPrefix: 'cache:categories:list:', ttlSeconds: 300, perUser: true }), async (req, res) => {
    try {
        let categories = await Category.find({ is_active: true })
            .sort({ name_lower: 1 });

        if (categories.length === 0) {
            const productCategories = await Product.find({ is_active: true })
                .distinct('category');
            const normalized = productCategories
                .map((name) => String(name || '').trim())
                .filter(Boolean);

            if (normalized.length > 0) {
                const operations = normalized.map((name) => ({
                    updateOne: {
                        filter: { name_lower: name.toLowerCase() },
                        update: {
                            $setOnInsert: {
                                name,
                                name_lower: name.toLowerCase(),
                                is_active: true,
                                created_at: new Date(),
                                updated_at: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                await Category.bulkWrite(operations, { ordered: false });
                categories = await Category.find({ is_active: true })
                    .sort({ name_lower: 1 });
            }
        }

        res.json({
            status: 'success',
            categories
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to load categories'
        });
    }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const name = String(req.body?.name || '').trim();
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Category name is required'
            });
        }

        const nameLower = name.toLowerCase();
        const existing = await Category.findOne({ name_lower: nameLower });
        if (existing) {
            return res.json({
                status: 'success',
                message: 'Category already exists',
                category: existing
            });
        }

        const category = await Category.create({
            name,
            name_lower: nameLower,
            is_active: true
        });

        res.status(201).json({
            status: 'success',
            category
        });

        invalidateByPrefix('cache:categories:list:').catch(() => {});
        invalidateByPrefix('cache:products:categories:').catch(() => {});
        invalidateByPrefix('cache:products:list:').catch(() => {});
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create category'
        });
    }
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const name = String(req.body?.name || '').trim();
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Category name is required'
            });
        }

        const nameLower = name.toLowerCase();
        const existing = await Category.findOne({
            name_lower: nameLower,
            _id: { $ne: req.params.id }
        });
        if (existing) {
            return res.status(409).json({
                status: 'error',
                message: 'Category already exists'
            });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, name_lower: nameLower, updated_at: new Date(), is_active: true },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }

        res.json({
            status: 'success',
            category
        });

        invalidateByPrefix('cache:categories:list:').catch(() => {});
        invalidateByPrefix('cache:products:categories:').catch(() => {});
        invalidateByPrefix('cache:products:list:').catch(() => {});
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update category'
        });
    }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { is_active: false, updated_at: new Date() },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }

        res.json({
            status: 'success',
            category
        });

        invalidateByPrefix('cache:categories:list:').catch(() => {});
        invalidateByPrefix('cache:products:categories:').catch(() => {});
        invalidateByPrefix('cache:products:list:').catch(() => {});
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to delete category'
        });
    }
});

module.exports = router;
