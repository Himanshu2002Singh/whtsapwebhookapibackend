const whatsappService = require("./whatsapp.service");

class MessageService {

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