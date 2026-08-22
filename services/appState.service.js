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

function normalizeLanguage(language) {
    return String(language || '').trim().replace('-', '_').toLowerCase();
}

function normalizeTemplateStatus(status) {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'approved') return 'approved';
    if (value === 'pending') return 'pending';
    if (value === 'rejected') return 'rejected';
    if (value === 'paused') return 'paused';
    if (value === 'disabled') return 'disabled';
    if (value === 'in_appeal') return 'in_appeal';
    return value || 'pending';
}

class AppStateService {
    constructor() {
        this.state = {
            // Templates are loaded from Meta; do not seed local/demo templates.
            templates: [],
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
                { id: 'u1', name: 'Trusting Brains Admin', email: 'admin@trustingbrains.com', role: 'Admin', avatarColor: colors[0], status: 'online', assignedChats: 0, resolvedToday: 0 },
                { id: 'u2', name: 'Rahul Singh', email: 'rahul@wapcrm.io', role: 'Manager', avatarColor: colors[1], status: 'online', assignedChats: 9, resolvedToday: 18 },
                { id: 'u3', name: 'Karan Desai', email: 'karan@wapcrm.io', role: 'Agent', avatarColor: colors[2], status: 'away', assignedChats: 11, resolvedToday: 15 },
                { id: 'u4', name: 'Neha Gupta', email: 'neha@wapcrm.io', role: 'Agent', avatarColor: colors[3], status: 'online', assignedChats: 7, resolvedToday: 12 },
                { id: 'u5', name: 'Samuel Lee', email: 'samuel@wapcrm.io', role: 'Agent', avatarColor: colors[4], status: 'offline', assignedChats: 0, resolvedToday: 0 },
                { id: 'u6', name: 'Aisha Khan', email: 'aisha@wapcrm.io', role: 'Viewer', avatarColor: colors[5], status: 'offline', assignedChats: 0, resolvedToday: 0 },
            ],
            settings: {
                profile: { fullName: 'Trusting Brains Admin', email: 'admin@trustingbrains.com', phone: '+91 98765 43210', role: 'Admin' },
                whatsapp: { number: '+91 98765 43210', displayName: 'WapCRM Support', businessCategory: 'Technology', about: 'We typically reply within minutes', qualityRating: 'High' },
                toggles: { emailNotif: true, pushNotif: true, soundNotif: false, dailyDigest: true, twoFa: true, sessionTimeout: true, autoAssign: true, awayMessage: true },
                webhook: { url: '', events: ['message.received', 'message.sent', 'message.delivered', 'message.read', 'contact.created', 'conversation.resolved'] },
                billing: { plan: 'Business Pro', price: '$99/month', messages: '42.5k / 100k', agents: '6 / 25', renews: 'Sep 1, 2026', cardLast4: '4242', cardExpiry: '08/27' },
            },
        };
    }

    list(key) { return this.state[key] || []; }
    setTeam(members) { this.state.team = members; return this.state.team; }
    getSettings() { return this.state.settings; }
    getTemplateById(id) {
        return this.state.templates.find((template) => template.id === id) || null;
    }
    hydrateTemplatesFromMeta(metaTemplates = []) {
        this.state.templates = metaTemplates.map((meta) => {
            const body = (meta.components || []).find((component) => String(component?.type || '').toUpperCase() === 'BODY');
            const bodyText = String(body?.text || '').trim();
            const variables = Array.from(new Set(bodyText.match(/\{\{\d+\}\}/g) || [])).length;
            const category = String(meta.category || 'utility').toLowerCase();

            return {
                id: meta.id || `${meta.name}:${meta.language}`,
                name: meta.name,
                category: ['marketing', 'utility', 'authentication'].includes(category) ? category : 'utility',
                language: meta.language || 'en_US',
                body: bodyText,
                status: normalizeTemplateStatus(meta.status),
                createdAt: meta.last_updated_time || today(),
                variables,
                metaId: meta.id,
                metaStatus: meta.status,
                metaLanguage: meta.language,
                metaCategory: meta.category,
                metaQualityScore: meta.quality_score,
                metaPreviousCategory: meta.previous_category,
                metaReason: meta.rejected_reason || null,
                metaSyncedAt: new Date().toISOString(),
            };
        });

        return this.state.templates;
    }
    syncTemplateStatusFromMeta(payload = {}) {
        const templateName = String(payload.templateName || payload.name || '').trim().toLowerCase();
        const templateLanguage = normalizeLanguage(payload.templateLanguage || payload.language);
        const templateId = String(payload.templateId || payload.id || '').trim();
        const status = normalizeTemplateStatus(payload.status || payload.event);

        let matched = null;
        this.state.templates = this.state.templates.map((template) => {
            const byName = templateName && String(template.name || '').trim().toLowerCase() === templateName;
            const byLanguage = !templateLanguage || normalizeLanguage(template.language) === templateLanguage;
            const byId = templateId && (String(template.metaId || '') === templateId || String(template.id || '') === templateId);

            if ((byId || (byName && byLanguage))) {
                matched = template;
                return {
                    ...template,
                    metaId: templateId || template.metaId,
                    metaStatus: payload.status || payload.event || template.metaStatus,
                    metaReason: payload.reason || template.metaReason,
                    metaSyncedAt: new Date().toISOString(),
                    status: status || template.status,
                };
            }

            return template;
        });

        return matched;
    }
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
