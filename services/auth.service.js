const crypto = require('crypto');

const sessions = new Map();

function adminUser() {
    return {
        id: 'trusting-brains-admin',
        name: process.env.ADMIN_NAME || 'Trusting Brains Admin',
        email: process.env.ADMIN_EMAIL || 'admin@trustingbrains.com',
        role: 'Admin',
    };
}

class AuthService {
    login(email, password) {
        const expectedEmail = process.env.ADMIN_EMAIL || 'admin@trustingbrains.com';
        const expectedPassword = process.env.ADMIN_PASSWORD;
        if (!expectedPassword) throw new Error('ADMIN_PASSWORD is not configured on the server');
        if (String(email || '').trim().toLowerCase() !== expectedEmail.toLowerCase() || password !== expectedPassword) return null;

        const token = crypto.randomBytes(32).toString('hex');
        const user = adminUser();
        sessions.set(token, { user, expiresAt: Date.now() + (8 * 60 * 60 * 1000) });
        return { token, user };
    }

    getUser(token) {
        const session = sessions.get(token);
        if (!session || session.expiresAt < Date.now()) {
            if (token) sessions.delete(token);
            return null;
        }
        return session.user;
    }

    logout(token) {
        sessions.delete(token);
    }
}

module.exports = new AuthService();
