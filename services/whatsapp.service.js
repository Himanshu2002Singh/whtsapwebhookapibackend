const axios = require("../confiq/axios");

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

class WhatsAppService {

    async sendTextMessage(to, message) {

        try {

            const response = await axios.post(
                `/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",

                    recipient_type: "individual",

                    to: to,

                    type: "text",

                    text: {
                        preview_url: false,
                        body: message
                    }
                }
            );

            console.log("Text Message Sent");

            console.log(response.data);

            return response.data;

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    }

    async markAsRead(messageId) {

        try {

            const response = await axios.post(
                `/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",

                    status: "read",

                    message_id: messageId
                }
            );

            return response.data;

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    }

    async sendImage(to, imageUrl, caption = "") {

        try {

            const response = await axios.post(
                `/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",

                    to,

                    type: "image",

                    image: {
                        link: imageUrl,
                        caption
                    }
                }
            );

            return response.data;

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    }

    async sendDocument(to, url, filename) {

        try {

            const response = await axios.post(
                `/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",

                    to,

                    type: "document",

                    document: {
                        link: url,
                        filename
                    }
                }
            );

            return response.data;

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    }

    async sendVideo(to, url) {

        try {

            const response = await axios.post(
                `/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",

                    to,

                    type: "video",

                    video: {
                        link: url
                    }
                }
            );

            return response.data;

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    }

    async sendAudio(to, url) {

        try {

            const response = await axios.post(
                `/${PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",

                    to,

                    type: "audio",

                    audio: {
                        link: url
                    }
                }
            );

            return response.data;

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    }

}

module.exports = new WhatsAppService();