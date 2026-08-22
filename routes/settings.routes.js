const express = require('express');
const {
    getSettings,
    updateSettings,
    getProfile,
    updateProfile,
    syncMetaProfile,
    updateWhatsAppProfile,
} = require('../controller/settings.controller');

const router = express.Router();

router.get('/state', getSettings);
router.patch('/state', updateSettings);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/profile/sync-meta', syncMetaProfile);
router.patch('/whatsapp-profile', updateWhatsAppProfile);

module.exports = router;
