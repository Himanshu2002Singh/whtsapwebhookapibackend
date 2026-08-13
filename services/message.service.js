const whatsappService = require("./whatsapp.service");

class MessageService {

    constructor() {
        this.store = {
            conversations: {}, // key: phone -> conversation summary
            threads: {}, // key: phone -> array of messages
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

    // record incoming message into store
    recordIncoming(customerName, customerNumber, message) {
        const id = customerNumber;
        const text = message.type === 'text' ? message.text?.body || '' : `[${message.type}]`;
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        // add thread entry
        if (!this.store.threads[id]) this.store.threads[id] = [];
        this.store.threads[id].push({ id: message.id || `m${Date.now()}`, direction: 'in', text, time });

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
    }

    // record outgoing message into store
    recordOutgoing(to, text, status = 'sent') {
        const id = to;
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        if (!this.store.threads[id]) this.store.threads[id] = [];
        this.store.threads[id].push({ id: `m${Date.now()}`, direction: 'out', text, time, status });

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

            // store incoming message for UI
            try {
                this.recordIncoming(customerName, customerNumber, message);
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

            return;
        }

        if (text.toLowerCase() === "fees") {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Please tell us which course you are interested in.`
            );

            return;
        }

        await whatsappService.sendTextMessage(
            customerNumber,
            `Hello ${customerName}

You sent:

${text}`
        );

    }

    async handleImageMessage(customerName, customerNumber, message) {

        console.log(message.image);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Image received successfully."
        );

    }

    async handleVideoMessage(customerName, customerNumber, message) {

        console.log(message.video);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Video received successfully."
        );

    }

    async handleAudioMessage(customerName, customerNumber, message) {

        console.log(message.audio);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Audio received successfully."
        );

    }

    async handleDocumentMessage(customerName, customerNumber, message) {

        console.log(message.document);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Document received successfully."
        );

    }

    async handleLocationMessage(customerName, customerNumber, message) {

        console.log(message.location);

        const latitude = message.location.latitude;
        const longitude = message.location.longitude;

        await whatsappService.sendTextMessage(
            customerNumber,
            `Location Received

Latitude : ${latitude}

Longitude : ${longitude}`
        );

    }

    async handleContactMessage(customerName, customerNumber, message) {

        console.log(message.contacts);

        await whatsappService.sendTextMessage(
            customerNumber,
            "Contact received successfully."
        );

    }

    async handleButtonMessage(customerName, customerNumber, message) {

        console.log(message.button);

        await whatsappService.sendTextMessage(
            customerNumber,
            `Button Clicked

${message.button.text}`
        );

    }

    async handleInteractiveMessage(customerName, customerNumber, message) {

        console.log(message.interactive);

        if (message.interactive.button_reply) {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Button Selected

${message.interactive.button_reply.title}`
            );

            return;
        }

        if (message.interactive.list_reply) {

            await whatsappService.sendTextMessage(
                customerNumber,
                `Selected

${message.interactive.list_reply.title}`
            );

            return;
        }

    }

}

module.exports = new MessageService();