const express = require("express");

const router = express.Router();

const whatsappService = require("../services/whatsapp.service");
const messageService = require("../services/message.service");
const appState = require("../services/appState.service");
const metaTemplates = require("../services/metaTemplates.service");
const axiosClient = require("../confiq/axios");

function isValidMetaTemplateName(name) {
    return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(String(name || ''));
}

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
        const phone = messageService.normalizePhone(to);
        if (!phone || !message) return res.status(400).json({ success: false, message: 'to and message are required' });
        const result = await whatsappService.sendTextMessage(phone, message);

        // record outgoing in store so UI can fetch threads
        let recordedMessage = null;
        try {
            const messageId = result?.messages?.[0]?.id;
            recordedMessage = await messageService.recordOutgoing(phone, message, 'sent', { messageId });
        } catch (e) {
            console.log('recordOutgoing error', e);
        }

        return res.json({ success: true, data: { apiResult: result, message: recordedMessage } });
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
        const id = messageService.normalizePhone(req.params.id);
        const thread = messageService.getThread(id);
        return res.json({ success: true, data: thread });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Contacts - derived from conversations store
router.get('/contacts', requireAppToken, (req, res) => {
    try {
        const contacts = messageService.getContacts().map((c) => ({
            ...c,
            tags: Array.isArray(c.tags) ? c.tags : [],
        }));

        return res.json({ success: true, data: contacts });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Create contact
router.post('/contacts', requireAppToken, async (req, res) => {
    try {
        const { name, phone, tags, owner, optIn } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'phone is required' });

        const contact = await messageService.addContact({ name, phone, tags, owner, optIn });

        return res.status(201).json({ success: true, data: contact });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/send-template', requireAppToken, async (req, res) => {
    const { recipients, templateName, language, variables = [] } = req.body || {};
    const phones = Array.isArray(recipients) ? [...new Set(recipients.map((phone) => messageService.normalizePhone(phone)).filter(Boolean))] : [];
    if (!templateName || !phones.length) {
        return res.status(400).json({ success: false, message: 'templateName and at least one recipient are required' });
    }

    const results = await Promise.allSettled(phones.map(async (to) => {
        const result = await whatsappService.sendTemplateMessage(to, templateName, language || 'en_US', variables);
        const messageId = result?.messages?.[0]?.id;
        const recordedMessage = await messageService.recordOutgoing(to, `[Template] ${templateName}`, 'sent', { messageId });
        return { to, result, message: recordedMessage };
    }));
    const sent = results.filter((result) => result.status === 'fulfilled');
    const failed = results.flatMap((result, index) => result.status === 'rejected'
        ? [{ to: phones[index], error: result.reason?.response?.data || result.reason?.message || 'Failed' }]
        : []);
    return res.status(failed.length ? 207 : 200).json({
        success: failed.length === 0,
        data: { total: phones.length, sent: sent.length, failed },
    });
});

const collectionKeys = new Set(['templates', 'broadcasts', 'automations', 'team']);

function requireCollection(req, res, next) {
    if (!collectionKeys.has(req.params.collection)) {
        return res.status(404).json({ success: false, message: 'Unknown collection' });
    }
    next();
}

router.get('/settings/state', requireAppToken, (req, res) => {
    return res.json({ success: true, data: appState.getSettings() });
});

router.patch('/settings/state', requireAppToken, (req, res) => {
    return res.json({ success: true, data: appState.updateSettings(req.body || {}) });
});

router.get('/analytics/summary', requireAppToken, (req, res) => {
    return res.json({ success: true, data: appState.analytics() });
});

router.get('/:collection', requireAppToken, requireCollection, async (req, res) => {
    if (req.params.collection === 'templates' && metaTemplates.isConfigured()) {
        try {
            const metaList = await metaTemplates.listTemplates();
            const merged = appState.hydrateTemplatesFromMeta(metaList);
            return res.json({ success: true, data: merged });
        } catch (err) {
            console.log('Meta template sync failed:', err.response?.data || err.message || err);
        }
    }

    return res.json({ success: true, data: appState.list(req.params.collection) });
});

router.post('/:collection', requireAppToken, requireCollection, async (req, res) => {
    const payload = req.body || {};

    if (req.params.collection === 'templates') {
        const name = String(payload.name || '').trim();
        if (!isValidMetaTemplateName(name)) {
            return res.status(400).json({
                success: false,
                message: 'Template name must use lowercase letters, numbers, and underscores only (example: welcome_message)',
            });
        }
        if (!metaTemplates.isConfigured()) {
            return res.status(503).json({
                success: false,
                message: 'Meta template sync is not configured. Add ACCESS_TOKEN and WABA_ID to the backend environment.',
            });
        }

        const draft = { ...payload, name, status: 'pending' };
        try {
            const metaResult = await metaTemplates.createTemplate(draft);
            let metaTemplate = null;
            try {
                metaTemplate = await metaTemplates.getTemplateByName(name);
            } catch (lookupError) {
                console.log('Meta template lookup after create failed:', lookupError.response?.data || lookupError.message || lookupError);
            }

            const responseItem = appState.create('templates', {
                ...draft,
                metaId: metaResult?.id || metaTemplate?.id,
                metaStatus: metaTemplate?.status || metaResult?.status || 'PENDING',
                metaLanguage: metaTemplate?.language || draft.language,
                metaCategory: metaTemplate?.category || draft.category,
                metaSyncedAt: new Date().toISOString(),
                status: metaTemplates.normalizeTemplateStatus(metaTemplate?.status || metaResult?.status || 'pending'),
            });
            return res.status(201).json({ success: true, data: responseItem });
        } catch (err) {
            const details = err.response?.data || err.message || 'Unknown Meta API error';
            console.log('Meta template create failed:', details);
            return res.status(502).json({
                success: false,
                message: 'Meta par template create nahi ho saka',
                details,
            });
        }
    }

    const item = appState.create(req.params.collection, payload);
    return res.status(201).json({ success: true, data: item });
});

router.patch('/:collection/:id', requireAppToken, requireCollection, async (req, res) => {
    const payload = req.body || {};

    if (req.params.collection === 'templates') {
        const current = appState.getTemplateById(req.params.id);
        if (!current) return res.status(404).json({ success: false, message: 'Item not found' });

        const item = appState.update('templates', req.params.id, { ...payload, status: payload.status || current.status || 'pending' });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        if (metaTemplates.isConfigured() && (item.metaId || current.metaId)) {
            try {
                const metaResult = await metaTemplates.updateTemplate(item.metaId || current.metaId, item);
                const metaTemplate = await metaTemplates.getTemplateByName(item.name);
                const synced = appState.update('templates', req.params.id, {
                    metaId: metaResult?.id || metaTemplate?.id || item.metaId || current.metaId,
                    metaStatus: metaTemplate?.status || metaResult?.status || item.metaStatus,
                    metaLanguage: metaTemplate?.language || item.language,
                    metaCategory: metaTemplate?.category || item.category,
                    metaSyncedAt: new Date().toISOString(),
                    status: metaTemplates.normalizeTemplateStatus(metaTemplate?.status || metaResult?.status || item.status),
                });
                return res.json({ success: true, data: synced || item });
            } catch (err) {
                console.log('Meta template update failed:', err.response?.data || err.message || err);
            }
        }

        return res.json({ success: true, data: item });
    }

    const item = appState.update(req.params.collection, req.params.id, payload);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    return res.json({ success: true, data: item });
});

router.post('/:collection/:id/duplicate', requireAppToken, requireCollection, (req, res) => {
    const item = appState.duplicate(req.params.collection, req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    return res.status(201).json({ success: true, data: item });
});

router.delete('/:collection/:id', requireAppToken, requireCollection, async (req, res) => {
    if (req.params.collection === 'templates') {
        const current = appState.getTemplateById(req.params.id);
        if (!current) return res.status(404).json({ success: false, message: 'Item not found' });

        if (metaTemplates.isConfigured() && (current.metaId || current.name)) {
            try {
                if (current.metaId) {
                    await metaTemplates.deleteTemplateById(current.metaId);
                } else {
                    await metaTemplates.deleteTemplateByName(current.name);
                }
            } catch (err) {
                console.log('Meta template delete failed:', err.response?.data || err.message || err);
            }
        }
    }

    const removed = appState.remove(req.params.collection, req.params.id);
    if (!removed) return res.status(404).json({ success: false, message: 'Item not found' });
    return res.json({ success: true });
});
