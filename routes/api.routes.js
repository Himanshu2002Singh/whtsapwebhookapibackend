const express = require("express");

const router = express.Router();

const whatsappService = require("../services/whatsapp.service");
const messageService = require("../services/message.service");
const axiosClient = require("../confiq/axios");

// Simple app-token check. Frontend should send header 'x-app-token'.
function requireAppToken(req, res, next) {
    const token = req.headers['x-app-token'] || req.headers['authorization'];
    const expected = process.env.APP_TOKEN || process.env.VERIFY_TOKEN;
    if (!expected) return res.status(500).json({ success: false, message: 'Server app token not configured' });
    if (!token) return res.status(401).json({ success: false, message: 'Missing app token' });
    // allow 'Bearer <token>' or raw token
    const actual = (typeof token === 'string' && token.startsWith('Bearer ')) ? token.split(' ')[1] : token;
    if (actual !== expected) return res.status(403).json({ success: false, message: 'Invalid app token' });
    next();
}

router.post('/send-text', requireAppToken, async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) return res.status(400).json({ success: false, message: 'to and message are required' });
        const result = await whatsappService.sendTextMessage(to, message);

        // record outgoing in store so UI can fetch threads
        try {
            messageService.recordOutgoing(to, message, 'sent');
        } catch (e) {
            console.log('recordOutgoing error', e);
        }

        return res.json({ success: true, data: result });
    } catch (err) {
        console.log('API send-text error:', err.response?.data || err.message || err);
        const details = err.response?.data || err.message || 'Server error';
        // If WhatsApp API returned a response, propagate its status code if available
        const status = err.response?.status || 500;
        return res.status(status).json({ success: false, message: 'WhatsApp API error', details });
    }
});

module.exports = router;

// Debug endpoint to check env values (masked)
router.get('/debug', (req, res) => {
    try {
        const token = process.env.ACCESS_TOKEN || null;
        const phoneId = process.env.PHONE_NUMBER_ID || null;
        const tokenLength = token ? token.length : 0;

        return res.json({
            success: true,
            accessTokenPresent: !!token,
            accessTokenLength: tokenLength,
            phoneNumberId: phoneId,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/check-token', requireAppToken, async (req, res) => {
    try {
        const fbRes = await axiosClient.get('/me');
        return res.json({ success: true, data: fbRes.data });
    } catch (err) {
        console.log('Token check error:', err.response?.data || err.message || err);
        return res.status(err.response?.status || 500).json({ success: false, details: err.response?.data || err.message });
    }
});

// Conversations listing
router.get('/conversations', requireAppToken, (req, res) => {
    try {
        const convs = messageService.getConversations();
        return res.json({ success: true, data: convs });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Thread for a conversation (id = phone number)
router.get('/threads/:id', requireAppToken, (req, res) => {
    try {
        const id = req.params.id;
        const thread = messageService.getThread(id);
        return res.json({ success: true, data: thread });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Contacts - derived from conversations store
router.get('/contacts', requireAppToken, (req, res) => {
    try {
        const convs = messageService.getConversations();
        const contacts = convs.map((c) => ({
            id: c.id,
            name: c.contactName || c.phone,
            phone: c.phone,
            avatarColor: c.avatarColor || 'bg-brand-500',
            tags: c.tags || [],
            optIn: true,
            lastSeen: c.time || '',
            createdAt: '',
            owner: c.assignee || '',
        }));

        return res.json({ success: true, data: contacts });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Create contact
router.post('/contacts', requireAppToken, (req, res) => {
    try {
        const { name, phone, tags, owner, optIn } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });

        const contact = messageService.addContact({ name, phone, tags, owner, optIn });

        return res.status(201).json({ success: true, data: contact });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});
