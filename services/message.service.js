const whatsappService = require("./whatsapp.service");
const { Contact, Conversation, Message } = require('../models');

class MessageService {

    constructor() {
        this.store = {
            conversations: {}, // key: phone -> conversation summary
            threads: {}, // key: phone -> array of messages
            contacts: [], // array of contact objects
        };
    }

    normalizePhone(phone) {
        return String(phone || '').replace(/[^0-9]/g, '');
    }

    safeTags(tags) {
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string' && tags.trim()) {
            try {
                const parsed = JSON.parse(tags);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    formatTime(timestamp) {
        const timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
        if (!timestamp) {
            return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
        }

        const ts = Number(timestamp);
        if (Number.isFinite(ts)) {
            const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
        }

        return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
    }

    getConversationKey(phone) {
        return this.normalizePhone(phone) || String(phone || '');
    }

    getConversationSnapshot(id) {
        return this.store.conversations[id] || null;
    }

    upsertThreadMessage(conversationId, message) {
        if (!this.store.threads[conversationId]) this.store.threads[conversationId] = [];
        const index = this.store.threads[conversationId].findIndex((item) => item.id === message.id);
        if (index >= 0) {
            this.store.threads[conversationId][index] = {
                ...this.store.threads[conversationId][index],
                ...message,
            };
            return this.store.threads[conversationId][index];
        }
        this.store.threads[conversationId].push(message);
        return message;
    }

    upsertConversation(conversationId, patch) {
        const current = this.store.conversations[conversationId] || {
            id: conversationId,
            contactId: conversationId,
            contactName: conversationId,
            phone: conversationId,
            avatarColor: 'bg-brand-500',
            preview: '',
            time: '',
            unread: 0,
            status: 'open',
            assignee: '',
            channel: 'WhatsApp',
            pinned: false,
            tags: [],
        };

        const next = {
            ...current,
            ...patch,
            id: conversationId,
            contactId: patch.contactId || current.contactId || conversationId,
            phone: patch.phone || current.phone || conversationId,
            tags: this.safeTags(patch.tags ?? current.tags),
        };

        this.store.conversations[conversationId] = next;
        return next;
    }

    async persistContact(contact) {
        await Contact.upsert({
            phone: contact.phone,
            name: contact.name,
            avatarColor: contact.avatarColor,
            tags: contact.tags,
            optIn: contact.optIn,
            lastSeen: contact.lastSeen,
            owner: contact.owner
        });
    }

    async persistConversation(conversation) {
        await Conversation.upsert({
            id: conversation.id,
            contactName: conversation.contactName,
            phone: conversation.phone,
            avatarColor: conversation.avatarColor,
            preview: conversation.preview,
            time: conversation.time,
            unread: conversation.unread,
            status: conversation.status,
            assignee: conversation.assignee,
            channel: conversation.channel,
            pinned: conversation.pinned,
            tags: conversation.tags || []
        });
    }

    async persistMessage(message) {
        const existing = await Message.findByPk(message.id);
        if (existing) {
            await existing.update({
                conversationId: message.conversationId,
                direction: message.direction,
                text: message.text,
                time: message.time,
                status: message.status,
            });
            return existing;
        }
        return Message.create(message);
    }

    async ensureContact(customerName, phone, overrides = {}) {
        const id = this.getConversationKey(phone);
        const existing = this.store.contacts.find((x) => this.getConversationKey(x.phone) === id);
        const contact = {
            id: existing?.id || id,
            name: customerName || existing?.name || id,
            phone: existing?.phone || id,
            avatarColor: overrides.avatarColor || existing?.avatarColor || 'bg-brand-500',
            tags: this.safeTags(overrides.tags ?? existing?.tags),
            optIn: typeof overrides.optIn === 'boolean' ? overrides.optIn : (typeof existing?.optIn === 'boolean' ? existing.optIn : true),
            lastSeen: overrides.lastSeen || existing?.lastSeen || '',
            createdAt: existing?.createdAt || new Date().toISOString(),
            owner: overrides.owner || existing?.owner || '',
        };

        if (!existing) {
            this.store.contacts.push(contact);
        } else {
            Object.assign(existing, contact);
        }

        try {
            await this.persistContact(contact);
        } catch (e) {
            console.log('Contact persist error', e.message || e);
        }

        return contact;
    }

    async persistConversationSnapshot(conversationId, patch) {
        const conversation = this.upsertConversation(conversationId, patch);
        try {
            await this.persistConversation(conversation);
        } catch (e) {
            console.log('Conversation persist error', e.message || e);
        }
        return conversation;
    }

    // return list of conversations
    getConversations() {
        return Object.values(this.store.conversations);
    }

    // return thread for a phone (conversation id)
    getThread(id) {
        const key = this.getConversationKey(id);
        return this.store.threads[key] || this.store.threads[id] || [];
    }

    // contacts
    getContacts() {
        return this.store.contacts;
    }

    async addContact(contact) {
        const phone = this.getConversationKey(contact.phone);
        const c = {
            id: contact.id || phone,
            name: contact.name || phone,
            phone,
            avatarColor: contact.avatarColor || 'bg-brand-500',
            tags: this.safeTags(contact.tags),
            optIn: typeof contact.optIn === 'boolean' ? contact.optIn : true,
            lastSeen: contact.lastSeen || '',
            createdAt: new Date().toISOString(),
            owner: contact.owner || '',
        };
        // avoid duplicates by phone
        const exists = this.store.contacts.find((x) => this.getConversationKey(x.phone) === c.phone);
        if (exists) return exists;
        this.store.contacts.push(c);

        // persist contact
        try {
            await this.persistContact(c);
        } catch (e) {
            console.log('Contact persist error', e.message || e);
        }

        // also ensure conversation summary exists
        await this.persistConversationSnapshot(c.phone, {
            contactName: c.name,
            phone: c.phone,
            avatarColor: c.avatarColor,
            preview: this.store.conversations[c.phone]?.preview || '',
            time: this.store.conversations[c.phone]?.time || '',
            unread: this.store.conversations[c.phone]?.unread || 0,
            status: this.store.conversations[c.phone]?.status || 'open',
            assignee: c.owner,
            channel: 'WhatsApp',
            pinned: this.store.conversations[c.phone]?.pinned || false,
            tags: c.tags,
        });

        return c;
    }

    buildMessageText(message) {
        if (!message) return '';
        if (message.type === 'text') return message.text?.body || '';
        if (message.type === 'image') return message.image?.caption ? `[image] ${message.image.caption}` : '[image]';
        if (message.type === 'video') return '[video]';
        if (message.type === 'audio') return '[audio]';
        if (message.type === 'document') return `[document] ${message.document?.filename || ''}`.trim();
        if (message.type === 'location') {
            const lat = message.location?.latitude;
            const lng = message.location?.longitude;
            return `[location] ${lat ?? ''}, ${lng ?? ''}`.trim();
        }
        if (message.type === 'contacts') return '[contact]';
        if (message.type === 'button') return message.button?.text ? `[button] ${message.button.text}` : '[button]';
        if (message.type === 'interactive') {
            return message.interactive?.button_reply?.title
                || message.interactive?.list_reply?.title
                || '[interactive]';
        }
        return `[${message.type}]`;
    }

    getMessageStatusFromWebhook(message) {
        if (!message) return 'sent';
        if (message.status === 'read') return 'read';
        if (message.status === 'delivered') return 'delivered';
        if (message.status === 'failed') return 'failed';
        return 'sent';
    }

    async recordIncoming(customerName, customerNumber, message) {
        const id = this.getConversationKey(customerNumber || message?.from);
        const text = this.buildMessageText(message);
        const time = this.formatTime(message?.timestamp);

        // add thread entry
        const mid = message.id || `in-${Date.now()}`;
        this.upsertThreadMessage(id, { id: mid, direction: 'in', text, time });

        // update conversation summary
        const contact = await this.ensureContact(customerName, id, {
            avatarColor: 'bg-brand-500',
            lastSeen: time,
        });

        const unread = (this.store.conversations[id]?.unread || 0) + 1;
        await this.persistConversationSnapshot(id, {
            id,
            contactName: customerName || contact.name || id,
            phone: id,
            avatarColor: contact.avatarColor || 'bg-brand-500',
            preview: text,
            time,
            unread,
            status: 'open',
            assignee: '',
            channel: 'WhatsApp',
            pinned: false,
            tags: contact.tags || [],
        });

        // persist to DB: ensure contact, conversation and message
        try {
            await this.persistMessage({
                id: mid,
                conversationId: id,
                direction: 'in',
                text,
                time,
                status: 'received'
            });
        } catch (e) {
            console.log('Persist incoming error', e.message || e);
        }
    }

    // record outgoing message into store
    async recordOutgoing(to, text, status = 'sent', options = {}) {
        const id = this.getConversationKey(to);
        const time = this.formatTime(options.timestamp);
        const messageId = options.messageId || `out-${Date.now()}`;
        this.upsertThreadMessage(id, { id: messageId, direction: 'out', text, time, status });

        // update conversation preview/time
        const contact = await this.ensureContact(options.contactName || id, id, {
            avatarColor: options.avatarColor || 'bg-brand-500',
            lastSeen: time,
            owner: options.owner || '',
        });
        await this.persistConversationSnapshot(id, {
            contactName: options.contactName || this.store.conversations[id]?.contactName || id,
            phone: id,
            avatarColor: contact.avatarColor || 'bg-brand-500',
            preview: text,
            time,
            unread: 0,
            status: options.status || this.store.conversations[id]?.status || 'open',
            assignee: options.owner || this.store.conversations[id]?.assignee || '',
            channel: 'WhatsApp',
            pinned: this.store.conversations[id]?.pinned || false,
            tags: contact.tags || this.store.conversations[id]?.tags || [],
        });

        // persist outgoing
        try {
            await this.persistMessage({
                id: messageId,
                conversationId: id,
                direction: 'out',
                text,
                time,
                status: status || 'sent'
            });
        } catch (e) {
            console.log('Persist outgoing error', e.message || e);
        }

        return {
            id: messageId,
            conversationId: id,
            direction: 'out',
            text,
            time,
            status: status || 'sent',
        };
    }

    async updateMessageStatus(messageId, status, timestamp, recipientId) {
        const record = await Message.findByPk(messageId);
        if (!record) {
            return null;
        }

        await record.update({ status });

        const conversationId = this.getConversationKey(record.conversationId || recipientId);
        const thread = this.store.threads[conversationId] || [];
        const idx = thread.findIndex((m) => m.id === messageId);
        if (idx >= 0) {
            thread[idx] = { ...thread[idx], status };
        }

        const current = this.store.conversations[conversationId];
        if (current) {
            this.store.conversations[conversationId] = {
                ...current,
                time: current.time || this.formatTime(timestamp),
                unread: status === 'read' ? 0 : current.unread || 0,
            };
            try {
                await this.persistConversation(this.store.conversations[conversationId]);
            } catch (e) {
                console.log('Conversation status persist error', e.message || e);
            }
        }

        return record;
    }

    async handleIncomingMessage(customerName, customerNumber, message) {

        try {

            console.log("========================================");
            console.log("NEW MESSAGE PROCESSING");
            console.log("========================================");

            console.log("Customer :", customerName);
            console.log("Number   :", customerNumber);
            console.log("Type     :", message.type);

            // store incoming message for UI and persist
            try {
                await this.recordIncoming(customerName, customerNumber, message);
            } catch (e) {
                console.log('Store record error', e);
            }

            // Mark message as read after persisting so a read-receipt failure
            // does not block the incoming message from being saved.
            try {
                if (message.id) {
                    await whatsappService.markAsRead(message.id);
                }
            } catch (e) {
                console.log('markAsRead failed', e.response?.data || e.message || e);
            }

            switch (message.type) {

                case "text":

                    await this.handleTextMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "image":

                    await this.handleImageMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "video":

                    await this.handleVideoMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "audio":

                    await this.handleAudioMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "document":

                    await this.handleDocumentMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "location":

                    await this.handleLocationMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "contacts":

                    await this.handleContactMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "button":

                    await this.handleButtonMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                case "interactive":

                    await this.handleInteractiveMessage(
                        customerName,
                        customerNumber,
                        message
                    );

                    break;

                default:

                    console.log("Unsupported Message Type");

                    const response = await whatsappService.sendTextMessage(
                        customerNumber,
                        "Sorry, this message type is currently not supported."
                    );
                    try { await this.recordOutgoing(customerNumber, "Sorry, this message type is currently not supported.", 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

            }

        } catch (err) {

            console.log(err);

        }

    }

    async handleTextMessage(customerName, customerNumber, message) {

        const text = message.text.body;

        console.log("Text :", text);

        if (text.toLowerCase() === "hi") {

            const response = await whatsappService.sendTextMessage(
                customerNumber,
                `Hello ${customerName},

Welcome to TrustingBrains IT Services.

How can I help you today?`
            );

            try { await this.recordOutgoing(customerNumber, `Hello ${customerName},\n\nWelcome to TrustingBrains IT Services.\n\nHow can I help you today?`, 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }
            return;
        }

        if (text.toLowerCase() === "courses") {

            const response = await whatsappService.sendTextMessage(
                customerNumber,
                `Available Courses

1. Full Stack Development

2. React JS

3. Node JS

4. Flutter

5. Python

Reply with course name.`
            );

                try { await this.recordOutgoing(customerNumber, `Available Courses\n\n1. Full Stack Development\n\n2. React JS\n\n3. Node JS\n\n4. Flutter\n\n5. Python\n\nReply with course name.`, 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }
            return;
        }

        if (text.toLowerCase() === "fees") {

            const response = await whatsappService.sendTextMessage(
                customerNumber,
                `Please tell us which course you are interested in.`
            );

                try { await this.recordOutgoing(customerNumber, `Please tell us which course you are interested in.`, 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }
            return;
        }

            // Store ordinary incoming messages without sending an automatic echo reply.
            console.log('No automatic reply configured for:', text);

    }

    async handleImageMessage(customerName, customerNumber, message) {

        console.log(message.image);

        const response = await whatsappService.sendTextMessage(
            customerNumber,
            "Image received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Image received successfully.", 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleVideoMessage(customerName, customerNumber, message) {

        console.log(message.video);

        const response = await whatsappService.sendTextMessage(
            customerNumber,
            "Video received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Video received successfully.", 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleAudioMessage(customerName, customerNumber, message) {

        console.log(message.audio);

        const response = await whatsappService.sendTextMessage(
            customerNumber,
            "Audio received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Audio received successfully.", 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleDocumentMessage(customerName, customerNumber, message) {

        console.log(message.document);

        const response = await whatsappService.sendTextMessage(
            customerNumber,
            "Document received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Document received successfully.", 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleLocationMessage(customerName, customerNumber, message) {

        console.log(message.location);

        const latitude = message.location.latitude;
        const longitude = message.location.longitude;

        const response = await whatsappService.sendTextMessage(
            customerNumber,
            `Location Received\n\nLatitude : ${latitude}\n\nLongitude : ${longitude}`
        );

        try { await this.recordOutgoing(customerNumber, `Location Received\n\nLatitude : ${latitude}\n\nLongitude : ${longitude}`, 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleContactMessage(customerName, customerNumber, message) {

        console.log(message.contacts);

        const response = await whatsappService.sendTextMessage(
            customerNumber,
            "Contact received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Contact received successfully.", 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleButtonMessage(customerName, customerNumber, message) {

        console.log(message.button);

            const response = await whatsappService.sendTextMessage(
                customerNumber,
                `Button Clicked\n\n${message.button.text}`
            );

            try { await this.recordOutgoing(customerNumber, `Button Clicked\n\n${message.button.text}`, 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleInteractiveMessage(customerName, customerNumber, message) {

        console.log(message.interactive);

        if (message.interactive.button_reply) {

            const response = await whatsappService.sendTextMessage(
                customerNumber,
                `Button Selected\n\n${message.interactive.button_reply.title}`
            );

            try { await this.recordOutgoing(customerNumber, `Button Selected\n\n${message.interactive.button_reply.title}`, 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

            return;
        }

        if (message.interactive.list_reply) {

            const response = await whatsappService.sendTextMessage(
                customerNumber,
                `Selected\n\n${message.interactive.list_reply.title}`
            );

            try { await this.recordOutgoing(customerNumber, `Selected\n\n${message.interactive.list_reply.title}`, 'sent', { messageId: response?.messages?.[0]?.id, contactName: customerName }); } catch(e) { console.log('recordOutgoing err', e); }

            return;
        }

    }

    async handleMessageStatusUpdate(statusPayload) {
        const messageId = statusPayload?.id;
        if (!messageId) return null;

        const status = this.getMessageStatusFromWebhook(statusPayload);
        return this.updateMessageStatus(messageId, status, statusPayload?.timestamp, statusPayload?.recipient_id);
    }

    // load persisted data into in-memory store
    async loadFromDB() {
        try {
            const contacts = await Contact.findAll();
            this.store.contacts = contacts.map(c => ({
                id: c.phone,
                name: c.name,
                phone: c.phone,
                avatarColor: c.avatarColor || 'bg-brand-500',
                tags: this.safeTags(c.tags),
                optIn: c.optIn,
                lastSeen: c.lastSeen,
                createdAt: c.createdAt,
                owner: c.owner
            }));

            const convs = await Conversation.findAll();
            this.store.conversations = {};
            convs.forEach(c => {
                this.store.conversations[c.phone] = {
                    id: c.id,
                    contactId: c.id,
                    contactName: c.contactName,
                    phone: c.phone,
                    avatarColor: c.avatarColor || 'bg-brand-500',
                    preview: c.preview || '',
                    time: c.time || '',
                    unread: c.unread || 0,
                    status: c.status || 'open',
                    assignee: c.assignee || '',
                    channel: c.channel || 'WhatsApp',
                    pinned: c.pinned || false,
                    tags: this.safeTags(c.tags)
                };
            });

            const msgs = await Message.findAll({ order: [['createdAt','ASC']] });
            this.store.threads = {};
            msgs.forEach(m => {
                if (!this.store.threads[m.conversationId]) this.store.threads[m.conversationId] = [];
                this.store.threads[m.conversationId].push({ id: m.id, direction: m.direction, text: m.text, time: m.time, status: m.status });
            });

            console.log('Loaded data from DB: ', this.store.contacts.length, Object.keys(this.store.conversations).length, Object.keys(this.store.threads).length);
        } catch (e) {
            console.log('LoadFromDB error', e.message || e);
        }
    }

}

module.exports = new MessageService();
