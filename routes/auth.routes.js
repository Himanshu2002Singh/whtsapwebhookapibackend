const express = require('express');
const { requireAppToken, requireUserAuth } = require('../middleware/auth.middleware');
const { login, me, logout } = require('../controller/auth.controller');

const router = express.Router();
router.post('/login', requireAppToken, login);
router.get('/me', requireUserAuth, me);
router.post('/logout', requireUserAuth, logout);

module.exports = router;
