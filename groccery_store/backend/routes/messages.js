// Message Routes
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken, isAdminOrStaff } = require('../middleware/authMiddleware');

router.get('/inbox', verifyToken, messageController.getConversations);
router.get('/unread-count', verifyToken, messageController.getUnreadCount);
router.get('/:conversationId', verifyToken, messageController.getConversationMessages);
router.put('/:conversationId/read', verifyToken, messageController.markConversationRead);
router.post('/send', verifyToken, isAdminOrStaff, messageController.sendMessage);
router.post('/:conversationId/reply', verifyToken, messageController.replyToConversation);

module.exports = router;
