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
    const appState = require('../services/appState.service');
    const token = req.headers['x-user-token'];
    const user = authService.getUser(token);
    if (!user) return res.status(401).json({ success: false, message: 'Login required' });
    const moduleName = getModuleName(req);
    const action = getAction(req);
    if (moduleName === 'team' && /roles/.test(`${req.baseUrl || ''}${req.path || ''}`) && user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Only Trusting Brains Admin can manage roles' });
    }
    const role = appState.list('roles').find((item) => item.id === String(user.role || '').toLowerCase() || String(item.name || '').toLowerCase() === String(user.role || '').toLowerCase());
    const permission = role?.permissions?.[moduleName] || role?.permissions?.['*'];
    if (permission && permission[action] === false) return res.status(403).json({ success: false, message: `${user.role} role cannot ${action} ${moduleName}` });
    req.user = user;
    next();
}

function getModuleName(req) {
    const path = `${req.baseUrl || ''}${req.path || ''}`;
    if (/conversation|thread|send-(text|media|location|template)|\/media/.test(path)) return 'conversations';
    if (/contacts/.test(path)) return 'contacts';
    if (/templates/.test(path)) return 'templates';
    if (/broadcasts/.test(path)) return 'broadcasts';
    if (/automations/.test(path)) return 'automations';
    if (/analytics/.test(path)) return 'analytics';
    if (/team|roles/.test(path)) return 'team';
    if (/settings/.test(path)) return 'settings';
    return 'dashboard';
}

function getAction(req) {
    if (req.method === 'GET') return 'read';
    if (req.method === 'DELETE') return 'delete';
    if (req.method === 'PATCH' || req.method === 'PUT') return 'update';
    if (req.path.includes('send-')) return 'send';
    return 'write';
}

module.exports = { requireAppToken, requireUserAuth };
