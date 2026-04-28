const express = require('express');
const router = express.Router();
const Setting = require('../models/SettingMongo');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const defaultSettings = {
    maintenanceMode: false,
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    forceSsl: true,
    debugMode: false,
    enableExpressDelivery: true,
    lowStockAlertThreshold: 5,
    expiringMonthsAlert: 3
};

router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        let setting = await Setting.findOne({ user_id: req.user.id });
        if (!setting) {
            setting = await Setting.create({ user_id: req.user.id, data: defaultSettings });
        } else {
            const merged = { ...defaultSettings, ...(setting.data || {}) };
            setting.data = merged;
            await setting.save();
        }

        res.json({
            status: 'success',
            settings: { ...defaultSettings, ...(setting.data || {}) }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to load settings'
        });
    }
});

router.put('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const incoming = req.body || {};
        const existing = await Setting.findOne({ user_id: req.user.id });
        const merged = {
            ...defaultSettings,
            ...(existing?.data || {}),
            ...incoming
        };

        const setting = await Setting.findOneAndUpdate(
            { user_id: req.user.id },
            { data: merged },
            { new: true, upsert: true }
        );

        res.json({
            status: 'success',
            message: 'Settings saved successfully',
            settings: setting.data || merged
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to save settings'
        });
    }
});

module.exports = router;
