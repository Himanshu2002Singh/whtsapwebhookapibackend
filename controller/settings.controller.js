const appState = require('../services/appState.service');
const settingsService = require('../services/settings.service');

function sendError(res, err, fallback) {
    const details = err.response?.data || err.message || fallback;
    console.log(`${fallback}:`, details);
    return res.status(err.response?.status || 500).json({ success: false, message: fallback, details });
}

exports.getSettings = (req, res) => {
    return res.json({ success: true, data: appState.getSettings() });
};

exports.updateSettings = (req, res) => {
    return res.json({ success: true, data: appState.updateSettings(req.body || {}) });
};

exports.getProfile = (req, res) => {
    const settings = appState.getSettings();
    return res.json({ success: true, data: { profile: settings.profile, whatsapp: settings.whatsapp } });
};

exports.updateProfile = (req, res) => {
    const settings = appState.updateSettings({ profile: req.body?.profile || req.body || {} });
    return res.json({ success: true, data: { profile: settings.profile, whatsapp: settings.whatsapp } });
};

exports.syncMetaProfile = async (req, res) => {
    try {
        const settings = await settingsService.syncMetaProfile();
        return res.json({ success: true, data: { profile: settings.profile, whatsapp: settings.whatsapp } });
    } catch (err) {
        return sendError(res, err, 'Meta profile sync failed');
    }
};

exports.updateWhatsAppProfile = async (req, res) => {
    try {
        const settings = await settingsService.updateWhatsAppProfile(req.body || {});
        return res.json({ success: true, data: { profile: settings.profile, whatsapp: settings.whatsapp } });
    } catch (err) {
        return sendError(res, err, 'WhatsApp profile update failed');
    }
};
