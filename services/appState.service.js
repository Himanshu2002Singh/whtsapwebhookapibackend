const colors = [
    'bg-brand-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
];

function today() {
    return new Date().toISOString().slice(0, 10);
}

function makeId(prefix) {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

class AppStateService {
    constructor() {
        this.state = {
            templates: [
                { id: 't1', name: 'Welcome Message', category: 'utility', language: 'en_US', body: 'Hi {{1}}, welcome to WapCRM! We are excited to have you on board. Reply with any questions.', status: 'approved', createdAt: '2025-07-01', variables: 1 },
                { id: 't2', name: 'Order Confirmation', category: 'utility', language: 'en_US', body: 'Your order {{1}} has been confirmed. Expected delivery: {{2}}. Track it anytime in the app.', status: 'approved', createdAt: '2025-06-20', variables: 2 },
                { id: 't3', name: 'Flash Sale Alert', category: 'marketing', language: 'en_US', body: 'Hi {{1}}! Flash sale: 40% off everything for the next 24 hours. Shop now before it is gone!', status: 'approved', createdAt: '2025-08-05', variables: 1 },
                { id: 't4', name: 'Appointment Reminder', category: 'utility', language: 'en_US', body: 'Reminder: You have an appointment with {{1}} on {{2}} at {{3}}. Reply 1 to confirm or 2 to reschedule.', status: 'pending', createdAt: '2025-08-11', variables: 3 },
                { id: 't5', name: 'OTP Verification', category: 'authentication', language: 'en_US', body: 'Your verification code is {{1}}. It expires in 10 minutes. Do not share this code with anyone.', status: 'approved', createdAt: '2025-05-10', variables: 1 },
                { id: 't6', name: 'Feedback Request', category: 'marketing', language: 'en_US', body: 'Hi {{1}}, how was your recent experience with us? Rate it 1-5 and let us know how we can improve.', status: 'rejected', createdAt: '2025-07-22', variables: 1 },
                { id: 't7', name: 'Abandoned Cart', category: 'marketing', language: 'en_US', body: 'Hi {{1}}, you left {{2}} in your cart. Complete your order now and get free shipping!', status: 'pending', createdAt: '2025-08-12', variables: 2 },
            ],
            broadcasts: [
                { id: 'b1', name: 'Diwali Mega Sale', template: 'Flash Sale Alert', audience: 'All VIP Customers', audienceCount: 1240, sent: 1240, delivered: 1198, read: 980, failed: 42, status: 'sent', scheduledAt: '2025-08-09 10:00', createdAt: '2025-08-08' },
                { id: 'b2', name: 'New Product Launch', template: 'Welcome Message', audience: 'Active Leads', audienceCount: 560, sent: 560, delivered: 540, read: 410, failed: 20, status: 'sent', scheduledAt: '2025-08-10 14:00', createdAt: '2025-08-09' },
                { id: 'b3', name: 'Weekend Promo', template: 'Flash Sale Alert', audience: 'Newsletter Subscribers', audienceCount: 3200, sent: 0, delivered: 0, read: 0, failed: 0, status: 'scheduled', scheduledAt: '2025-08-15 09:00', createdAt: '2025-08-12' },
                { id: 'b4', name: 'Onboarding Drip — Day 1', template: 'Welcome Message', audience: 'New Signups (7d)', audienceCount: 180, sent: 0, delivered: 0, read: 0, failed: 0, status: 'draft', scheduledAt: '—', createdAt: '2025-08-13' },
                { id: 'b5', name: 'Holiday Greetings', template: 'Feedback Request', audience: 'All Customers', audienceCount: 5400, sent: 5400, delivered: 5100, read: 3200, failed: 300, status: 'sent', scheduledAt: '2025-07-25 08:00', createdAt: '2025-07-24' },
            ],
            automations: [
                { id: 'a1', name: 'Auto-reply after hours', trigger: 'Message received outside 9–6', action: 'Send "We will get back to you" template', status: 'active', runs: 3420, lastRun: '12 min ago' },
                { id: 'a2', name: 'New lead assignment', trigger: 'New contact tagged "Lead"', action: 'Assign to round-robin agent', status: 'active', runs: 1280, lastRun: '5 min ago' },
                { id: 'a3', name: 'Cart abandonment nudge', trigger: 'Cart abandoned 2 hours ago', action: 'Send "Abandoned Cart" template', status: 'active', runs: 640, lastRun: '1 hour ago' },
                { id: 'a4', name: 'CSAT survey', trigger: 'Conversation marked resolved', action: 'Send "Feedback Request" template', status: 'paused', runs: 2100, lastRun: '2 days ago' },
                { id: 'a5', name: 'VIP escalation', trigger: 'VIP customer waits > 15 min', action: 'Notify team manager', status: 'active', runs: 88, lastRun: '30 min ago' },
                { id: 'a6', name: 'Welcome new signup', trigger: 'New opt-in contact', action: 'Send "Welcome Message" template', status: 'active', runs: 980, lastRun: '3 min ago' },
            ],
            team: [
                { id: 'u1', name: 'Priya Menon', email: 'priya@wapcrm.io', role: 'Admin', avatarColor: colors[0], status: 'online', assignedChats: 14, resolvedToday: 22 },
                { id: 'u2', name: 'Rahul Singh', email: 'rahul@wapcrm.io', role: 'Manager', avatarColor: colors[1], status: 'online', assignedChats: 9, resolvedToday: 18 },
                { id: 'u3', name: 'Karan Desai', email: 'karan@wapcrm.io', role: 'Agent', avatarColor: colors[2], status: 'away', assignedChats: 11, resolvedToday: 15 },
                { id: 'u4', name: 'Neha Gupta', email: 'neha@wapcrm.io', role: 'Agent', avatarColor: colors[3], status: 'online', assignedChats: 7, resolvedToday: 12 },
                { id: 'u5', name: 'Samuel Lee', email: 'samuel@wapcrm.io', role: 'Agent', avatarColor: colors[4], status: 'offline', assignedChats: 0, resolvedToday: 0 },
                { id: 'u6', name: 'Aisha Khan', email: 'aisha@wapcrm.io', role: 'Viewer', avatarColor: colors[5], status: 'offline', assignedChats: 0, resolvedToday: 0 },
            ],
            settings: {
                profile: { fullName: 'Priya Menon', email: 'priya@wapcrm.io', phone: '+91 98765 43210', role: 'Admin' },
                whatsapp: { number: '+91 98765 43210', displayName: 'WapCRM Support', businessCategory: 'Technology', about: 'We typically reply within minutes', qualityRating: 'High' },
                toggles: { emailNotif: true, pushNotif: true, soundNotif: false, dailyDigest: true, twoFa: true, sessionTimeout: true, autoAssign: true, awayMessage: true },
                webhook: { url: '', events: ['message.received', 'message.sent', 'message.delivered', 'message.read', 'contact.created', 'conversation.resolved'] },
                billing: { plan: 'Business Pro', price: '$99/month', messages: '42.5k / 100k', agents: '6 / 25', renews: 'Sep 1, 2026', cardLast4: '4242', cardExpiry: '08/27' },
            },
        };
    }

    list(key) { return this.state[key] || []; }
    getSettings() { return this.state.settings; }
    updateSettings(patch) {
        this.state.settings = {
            ...this.state.settings,
            ...patch,
            toggles: { ...this.state.settings.toggles, ...(patch.toggles || {}) },
            profile: { ...this.state.settings.profile, ...(patch.profile || {}) },
            whatsapp: { ...this.state.settings.whatsapp, ...(patch.whatsapp || {}) },
            webhook: { ...this.state.settings.webhook, ...(patch.webhook || {}) },
        };
        return this.state.settings;
    }
    create(key, payload) {
        const prefix = { templates: 't', broadcasts: 'b', automations: 'a', team: 'u' }[key] || 'x';
        const item = { id: makeId(prefix), createdAt: today(), ...payload };
        this.state[key].unshift(item);
        return item;
    }
    update(key, id, patch) {
        const index = this.state[key].findIndex((item) => item.id === id);
        if (index === -1) return null;
        this.state[key][index] = { ...this.state[key][index], ...patch };
        return this.state[key][index];
    }
    duplicate(key, id) {
        const source = this.state[key].find((item) => item.id === id);
        if (!source) return null;
        const { id: _id, createdAt: _createdAt, ...copy } = source;
        return this.create(key, { ...copy, name: `${source.name} Copy`, status: source.status === 'sent' ? 'draft' : source.status });
    }
    remove(key, id) {
        const before = this.state[key].length;
        this.state[key] = this.state[key].filter((item) => item.id !== id);
        return this.state[key].length !== before;
    }
    analytics() {
        const broadcasts = this.state.broadcasts;
        const sent = broadcasts.reduce((s, b) => s + (b.sent || 0), 0);
        const delivered = broadcasts.reduce((s, b) => s + (b.delivered || 0), 0);
        const read = broadcasts.reduce((s, b) => s + (b.read || 0), 0);
        return {
            kpis: {
                deliveryRate: sent ? `${((delivered / sent) * 100).toFixed(1)}%` : '0%',
                readRate: delivered ? `${((read / delivered) * 100).toFixed(1)}%` : '0%',
                totalTemplates: this.state.templates.length,
                activeAutomations: this.state.automations.filter((a) => a.status === 'active').length,
            },
        };
    }
}

module.exports = new AppStateService();
