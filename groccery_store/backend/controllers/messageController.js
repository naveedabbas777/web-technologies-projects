// Message / Notification Controller
const Message = require('../models/MessageMongo');
const User = require('../models/UserMongo');

const allowedRecipientRoles = ['customer', 'delivery_rider'];

const generateConversationId = () => {
    const now = new Date();
    const stamp = now.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `MSG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${stamp}-${random}`;
};

const normalizeRole = (role = '') => {
    if (role === 'rider') return 'delivery_rider';
    return role;
};

const toSocketPayload = (message) => {
    const plain = message?.toObject ? message.toObject() : message;
    return {
        ...plain,
        sender_id: plain.sender_id?._id || plain.sender_id,
        recipient_user_id: plain.recipient_user_id?._id || plain.recipient_user_id
    };
};

const emitToRecipient = (req, message) => {
    const io = req.app?.get('io');
    if (!io || !message) return;

    const payload = toSocketPayload(message);
    const recipientId = String(payload.recipient_user_id || '');
    const senderId = String(payload.sender_id || '');
    const recipientRole = payload.recipient_role;
    const senderRole = payload.sender_role;

    if (recipientId) {
        io.to(`user:${recipientId}`).emit('message:new', payload);
    }
    if (recipientRole) {
        io.to(`role:${recipientRole}`).emit('message:new', payload);
    }
    if (senderId) {
        io.to(`user:${senderId}`).emit('message:sent', payload);
    }
    if (senderRole) {
        io.to(`role:${senderRole}`).emit('message:sent', payload);
    }
};

const resolveRecipients = async ({ recipientType, recipientRole, recipientUserIds = [] }) => {
    if (recipientType === 'role') {
        const normalizedRole = normalizeRole(recipientRole);
        if (!allowedRecipientRoles.includes(normalizedRole)) {
            throw new Error('Invalid recipient role');
        }

        return User.find({ role: normalizedRole, is_active: true }).select('_id name email phone role');
    }

    if (recipientType === 'users') {
        const ids = Array.isArray(recipientUserIds) ? recipientUserIds : [recipientUserIds];
        const filteredIds = ids.filter(Boolean);
        if (filteredIds.length === 0) {
            throw new Error('Please select at least one recipient');
        }

        return User.find({ _id: { $in: filteredIds }, is_active: true }).select('_id name email phone role');
    }

    throw new Error('Invalid recipient type');
};

const canAccessConversation = (messages, user) => {
    if (!messages.length) return false;
    const userId = String(user.id);
    return messages.some((message) => String(message.sender_id?._id || message.sender_id) === userId || String(message.recipient_user_id?._id || message.recipient_user_id) === userId);
};

const buildSummaryList = (messages, currentUserId) => {
    const summaries = new Map();
    const viewerId = String(currentUserId || '');

    for (const message of messages) {
        const convoId = message.conversation_id;
        const existing = summaries.get(convoId);
        const lastMessage = {
            id: String(message._id),
            body: message.body,
            created_at: message.created_at || message.createdAt,
            sender_role: message.sender_role,
            sender: message.sender_id,
            recipient: message.recipient_user_id,
            is_read: message.is_read
        };

        if (!existing) {
            summaries.set(convoId, {
                conversationId: convoId,
                subject: message.subject,
                lastMessage,
                lastMessageAt: message.created_at || message.createdAt,
                recipient: message.recipient_user_id,
                sender: message.sender_id,
                unreadCount: message.is_read ? 0 : 1,
                messageCount: 1,
                lastSenderRole: message.sender_role
            });
        } else {
            existing.messageCount += 1;
            existing.lastMessage = lastMessage;
            existing.lastMessageAt = message.created_at || message.createdAt;
            existing.lastSenderRole = message.sender_role;
            if (!message.is_read && String(message.recipient_user_id?._id || message.recipient_user_id) === viewerId) {
                existing.unreadCount += 1;
            }
        }
    }

    return Array.from(summaries.values()).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const messages = await Message.find({
            $or: [
                { sender_id: userId },
                { recipient_user_id: userId }
            ]
        })
            .populate('sender_id', 'name email role phone')
            .populate('recipient_user_id', 'name email role phone')
            .sort({ created_at: -1, _id: -1 });

        res.status(200).json({
            status: 'success',
            conversations: buildSummaryList(messages, userId)
        });
    } catch (error) {
        console.error('Get Conversations Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to load messages' });
    }
};

exports.getConversationMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { conversationId } = req.params;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const messages = await Message.find({ conversation_id: conversationId })
            .populate('sender_id', 'name email role phone')
            .populate('recipient_user_id', 'name email role phone')
            .sort({ created_at: 1, _id: 1 });

        if (!canAccessConversation(messages, req.user)) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        res.status(200).json({
            status: 'success',
            conversationId,
            messages
        });
    } catch (error) {
        console.error('Get Conversation Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to load conversation' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const unreadCount = await Message.countDocuments({ recipient_user_id: userId, is_read: false });

        res.status(200).json({
            status: 'success',
            unreadCount
        });
    } catch (error) {
        console.error('Unread Count Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to load unread count' });
    }
};

exports.markConversationRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { conversationId } = req.params;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const result = await Message.updateMany(
            { conversation_id: conversationId, recipient_user_id: userId, is_read: false },
            { $set: { is_read: true, read_at: new Date(), updated_at: new Date() } }
        );

        res.status(200).json({
            status: 'success',
            message: 'Conversation marked as read',
            updatedCount: result.modifiedCount || result.nModified || 0
        });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to mark conversation as read' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user?.id;
        const senderRole = normalizeRole(req.user?.role);
        const { recipientType, recipientRole, recipientUserIds, subject, body } = req.body;

        if (!senderId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        if (!['admin', 'staff'].includes(senderRole)) {
            return res.status(403).json({ status: 'error', message: 'Only admin and staff can send announcements' });
        }

        if (!subject || !body) {
            return res.status(400).json({ status: 'error', message: 'Subject and message body are required' });
        }

        const recipients = await resolveRecipients({ recipientType, recipientRole, recipientUserIds });
        if (!recipients.length) {
            return res.status(400).json({ status: 'error', message: 'No valid recipients found' });
        }

        const messages = [];
        for (const recipient of recipients) {
            const message = await Message.create({
                conversation_id: generateConversationId(),
                sender_id: senderId,
                sender_role: senderRole,
                recipient_user_id: recipient._id,
                recipient_role: recipient.role,
                subject,
                body,
                parent_id: null,
                is_read: false,
                read_at: null
            });

            const populated = await Message.findById(message._id)
                .populate('sender_id', 'name email role phone')
                .populate('recipient_user_id', 'name email role phone');

            emitToRecipient(req, populated);
            messages.push(populated);
        }

        res.status(201).json({
            status: 'success',
            message: 'Notification sent successfully',
            messages
        });
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to send notification' });
    }
};

exports.replyToConversation = async (req, res) => {
    try {
        const senderId = req.user?.id;
        const senderRole = normalizeRole(req.user?.role);
        const { conversationId } = req.params;
        const { body } = req.body;

        if (!senderId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        if (!body) {
            return res.status(400).json({ status: 'error', message: 'Reply text is required' });
        }

        const messages = await Message.find({ conversation_id: conversationId })
            .populate('sender_id', 'name email role phone')
            .populate('recipient_user_id', 'name email role phone')
            .sort({ created_at: 1, _id: 1 });

        if (!messages.length) {
            return res.status(404).json({ status: 'error', message: 'Conversation not found' });
        }

        if (!canAccessConversation(messages, req.user)) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        const rootMessage = messages[0];
        const currentUserId = String(senderId);
        const rootSenderId = String(rootMessage.sender_id?._id || rootMessage.sender_id);
        const rootRecipientId = String(rootMessage.recipient_user_id?._id || rootMessage.recipient_user_id);

        let recipientUserId = rootSenderId;
        let recipientRole = rootMessage.sender_role;
        let parentId = messages[messages.length - 1]._id;

        if (currentUserId === rootSenderId) {
            recipientUserId = rootRecipientId;
            recipientRole = rootMessage.recipient_role;
        }

        const reply = await Message.create({
            conversation_id: conversationId,
            sender_id: senderId,
            sender_role: senderRole,
            recipient_user_id: recipientUserId,
            recipient_role: recipientRole,
            subject: rootMessage.subject,
            body,
            parent_id: parentId,
            is_read: false,
            read_at: null
        });

        const populatedReply = await Message.findById(reply._id)
            .populate('sender_id', 'name email role phone')
            .populate('recipient_user_id', 'name email role phone');

        emitToRecipient(req, populatedReply);

        res.status(201).json({
            status: 'success',
            message: 'Reply sent successfully',
            reply: populatedReply
        });
    } catch (error) {
        console.error('Reply Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to send reply' });
    }
};
