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

    // return list of conversations
    getConversations() {
        return Object.values(this.store.conversations);
    }

    // return thread for a phone (conversation id)
    getThread(id) {
        return this.store.threads[id] || [];
    }

    // contacts
    getContacts() {
        return this.store.contacts;
    }

    async addContact(contact) {
        const c = {
            id: contact.id || contact.phone,
            name: contact.name || contact.phone,
            phone: contact.phone,
            avatarColor: contact.avatarColor || 'bg-brand-500',
            tags: contact.tags || [],
            optIn: typeof contact.optIn === 'boolean' ? contact.optIn : true,
            lastSeen: contact.lastSeen || '',
            createdAt: new Date().toISOString(),
            owner: contact.owner || '',
        };
        // avoid duplicates by phone
        const exists = this.store.contacts.find((x) => x.phone === c.phone);
        if (exists) return exists;
        this.store.contacts.push(c);

        // persist contact
        try {
            await Contact.upsert({
                phone: c.phone,
                name: c.name,
                avatarColor: c.avatarColor,
                tags: c.tags,
                optIn: c.optIn,
                lastSeen: c.lastSeen,
                owner: c.owner
            });
        } catch (e) {
            console.log('Contact persist error', e.message || e);
        }

        // also ensure conversation summary exists
        if (!this.store.conversations[c.phone]) {
            this.store.conversations[c.phone] = {
                id: c.phone,
                contactName: c.name,
                phone: c.phone,
                avatarColor: c.avatarColor,
                preview: '',
                time: '',
                unread: 0,
                status: 'open',
                assignee: c.owner,
                channel: 'WhatsApp',
                pinned: false,
                tags: c.tags,
            };
        }

        return c;
    }

    // record incoming message into store
    async recordIncoming(customerName, customerNumber, message) {
        const id = customerNumber;
        const text = message.type === 'text' ? message.text?.body || '' : `[${message.type}]`;
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        // add thread entry
        if (!this.store.threads[id]) this.store.threads[id] = [];
        const mid = message.id || `m${Date.now()}`;
        this.store.threads[id].push({ id: mid, direction: 'in', text, time });

        // update conversation summary
        this.store.conversations[id] = {
            id,
            contactName: customerName || id,
            phone: id,
            avatarColor: 'bg-brand-500',
            preview: text,
            time,
            unread: 1,
            status: 'open',
            assignee: '',
            channel: 'WhatsApp',
            pinned: false,
            tags: [],
        };

        // persist to DB: ensure contact, conversation and message
        try {
            await Contact.findOrCreate({ where: { phone: id }, defaults: { name: customerName || id } });

            await Conversation.upsert({
                id,
                contactName: customerName || id,
                phone: id,
                avatarColor: 'bg-brand-500',
                preview: text,
                time,
                unread: 1,
                status: 'open',
                assignee: '',
                channel: 'WhatsApp',
                pinned: false,
                tags: []
            });

            await Message.create({
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
    async recordOutgoing(to, text, status = 'sent') {
        const id = to;
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        if (!this.store.threads[id]) this.store.threads[id] = [];
        const mid = `m${Date.now()}`;
        this.store.threads[id].push({ id: mid, direction: 'out', text, time, status });

        // update conversation preview/time
        if (!this.store.conversations[id]) {
            this.store.conversations[id] = {
                id,
                contactName: id,
                phone: id,
                avatarColor: 'bg-brand-500',
                preview: text,
                time,
                unread: 0,
                status: 'open',
                assignee: '',
                channel: 'WhatsApp',
                pinned: false,
                tags: [],
            };
        } else {
            this.store.conversations[id].preview = text;
            this.store.conversations[id].time = time;
        }

        // persist outgoing
        try {
            await Contact.findOrCreate({ where: { phone: id }, defaults: { name: id } });
            await Conversation.upsert({
                id,
                contactName: this.store.conversations[id]?.contactName || id,
                phone: id,
                preview: text,
                time,
            });
            await Message.create({
                id: mid,
                conversationId: id,
                direction: 'out',
                text,
                time,
                status
            });
        } catch (e) {
            console.log('Persist outgoing error', e.message || e);
        }
    }

    async handleIncomingMessage(customerName, customerNumber, message) {

        try {

            console.log("========================================");
            console.log("NEW MESSAGE PROCESSING");
            console.log("========================================");

            console.log("Customer :", customerName);
            console.log("Number   :", customerNumber);
            console.log("Type     :", message.type);

            // Mark message as read
            await whatsappService.markAsRead(message.id);

            // store incoming message for UI and persist
            try {
                await this.recordIncoming(customerName, customerNumber, message);
            } catch (e) {
                console.log('Store record error', e);
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

                    await whatsappService.sendTextMessage(
                        customerNumber,
                        "Sorry, this message type is currently not supported."
                    );

            }

        } catch (err) {

            console.log(err);

        }

    }

    async handleTextMessage(customerName, customerNumber, message) {

        const text = message.text.body;

        console.log("Text :", text);

        if (text.toLowerCase() === "hi") {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Hello ${customerName},

Welcome to TrustingBrains IT Services.

How can I help you today?`
            );

            try { await this.recordOutgoing(customerNumber, `Hello ${customerName},\n\nWelcome to TrustingBrains IT Services.\n\nHow can I help you today?`); } catch(e) { console.log('recordOutgoing err', e); }
            return;
        }

        if (text.toLowerCase() === "courses") {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Available Courses

1. Full Stack Development

2. React JS

3. Node JS

4. Flutter

5. Python

Reply with course name.`
            );

                try { await this.recordOutgoing(customerNumber, `Available Courses\n\n1. Full Stack Development\n\n2. React JS\n\n3. Node JS\n\n4. Flutter\n\n5. Python\n\nReply with course name.`); } catch(e) { console.log('recordOutgoing err', e); }
            return;
        }

        if (text.toLowerCase() === "fees") {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Please tell us which course you are interested in.`
            );

                try { await this.recordOutgoing(customerNumber, `Please tell us which course you are interested in.`); } catch(e) { console.log('recordOutgoing err', e); }
            return;
        }

            await whatsappService.sendTextMessage(
                customerNumber,
                `Hello ${customerName}\n\nYou sent:\n\n${text}`
            );

            try { await this.recordOutgoing(customerNumber, `Hello ${customerName}\n\nYou sent:\n\n${text}`); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleImageMessage(customerName, customerNumber, message) {

        console.log(message.image);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Image received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Image received successfully."); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleVideoMessage(customerName, customerNumber, message) {

        console.log(message.video);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Video received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Video received successfully."); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleAudioMessage(customerName, customerNumber, message) {

        console.log(message.audio);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Audio received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Audio received successfully."); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleDocumentMessage(customerName, customerNumber, message) {

        console.log(message.document);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Document received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Document received successfully."); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleLocationMessage(customerName, customerNumber, message) {

        console.log(message.location);

        const latitude = message.location.latitude;
        const longitude = message.location.longitude;

        await whatsappService.sendTextMessage(
            customerNumber,
            `Location Received\n\nLatitude : ${latitude}\n\nLongitude : ${longitude}`
        );

        try { await this.recordOutgoing(customerNumber, `Location Received\n\nLatitude : ${latitude}\n\nLongitude : ${longitude}`); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleContactMessage(customerName, customerNumber, message) {

        console.log(message.contacts);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Contact received successfully."
        );

        try { await this.recordOutgoing(customerNumber, "Contact received successfully."); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleButtonMessage(customerName, customerNumber, message) {

        console.log(message.button);

            await whatsappService.sendTextMessage(
                customerNumber,
                `Button Clicked\n\n${message.button.text}`
            );

            try { await this.recordOutgoing(customerNumber, `Button Clicked\n\n${message.button.text}`); } catch(e) { console.log('recordOutgoing err', e); }

    }

    async handleInteractiveMessage(customerName, customerNumber, message) {

        console.log(message.interactive);

        if (message.interactive.button_reply) {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Button Selected\n\n${message.interactive.button_reply.title}`
            );

            try { await this.recordOutgoing(customerNumber, `Button Selected\n\n${message.interactive.button_reply.title}`); } catch(e) { console.log('recordOutgoing err', e); }

            return;
        }

        if (message.interactive.list_reply) {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Selected\n\n${message.interactive.list_reply.title}`
            );

            try { await this.recordOutgoing(customerNumber, `Selected\n\n${message.interactive.list_reply.title}`); } catch(e) { console.log('recordOutgoing err', e); }

            return;
        }

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
                tags: c.tags || [],
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
                    tags: c.tags || []
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