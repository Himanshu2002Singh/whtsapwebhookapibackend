const authService = require('../services/auth.service');

exports.login = (req, res) => {
    const { email, password } = req.body || {};
    const result = authService.login(email, password);
    if (!result) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    return res.json({ success: true, data: result });
};

exports.me = (req, res) => res.json({ success: true, data: req.user });

exports.logout = (req, res) => {
    authService.logout(req.headers['x-user-token']);
    return res.json({ success: true });
};
