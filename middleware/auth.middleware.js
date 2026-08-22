function requireAppToken(req, res, next) {
    const token = req.headers['x-app-token'] || req.headers['authorization'];
    const expected = process.env.APP_TOKEN || process.env.VERIFY_TOKEN;
    if (!expected) return res.status(500).json({ success: false, message: 'Server app token not configured' });
    if (!token) return res.status(401).json({ success: false, message: 'Missing app token' });
    const actual = (typeof token === 'string' && token.startsWith('Bearer ')) ? token.split(' ')[1] : token;
    if (actual !== expected) return res.status(403).json({ success: false, message: 'Invalid app token' });
    next();
}

function requireUserAuth(req, res, next) {
    const authService = require('../services/auth.service');
    const token = req.headers['x-user-token'];
    const user = authService.getUser(token);
    if (!user) return res.status(401).json({ success: false, message: 'Login required' });
    req.user = user;
    next();
}

module.exports = { requireAppToken, requireUserAuth };
