const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { fullName, email, phone, subject, message } = req.body;

        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide fullName, email, subject and message'
            });
        }

        // Placeholder persistence point for email/CRM integration.
        res.status(201).json({
            status: 'success',
            message: 'Message received successfully. We will contact you soon.',
            contact: {
                fullName,
                email,
                phone: phone || '',
                subject,
                message,
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to submit contact form'
        });
    }
});

module.exports = router;
