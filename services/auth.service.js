const crypto = require('crypto');
const appState = require('./appState.service');

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
    hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
        const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }

    verifyPassword(password, stored) {
        const [salt, expected] = String(stored || '').split(':');
        if (!salt || !expected) return false;
        const actual = crypto.scryptSync(String(password), salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
    }

    async login(email, password) {
        const expectedEmail = process.env.ADMIN_EMAIL || 'admin@trustingbrains.com';
        const expectedPassword = process.env.ADMIN_PASSWORD;
        if (!expectedPassword) throw new Error('ADMIN_PASSWORD is not configured on the server');
        const normalizedEmail = String(email || '').trim().toLowerCase();
        let user = null;
        if (normalizedEmail === expectedEmail.toLowerCase() && password === expectedPassword) user = adminUser();
        if (!user) {
            const member = appState.list('team').find((item) => String(item.email || '').toLowerCase() === normalizedEmail);
            if (member && this.verifyPassword(password, member.passwordHash)) {
                user = { id: member.id, name: member.name, email: member.email, role: member.role };
            }
        }
        if (!user) return null;

        const token = crypto.randomBytes(32).toString('hex');
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
