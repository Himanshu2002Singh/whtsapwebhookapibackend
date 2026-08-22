const axios = require("../confiq/axios");
const FormData = require('form-data');

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

            const resp = err.response?.data || err.message;
            console.log(resp);
            // If Graph API returned OAuthException (code 190), give clearer guidance
            if (err.response?.data?.error?.code === 190) {
                console.error('Graph API Authentication Error (code 190). ACCESS_TOKEN may be invalid or expired.');
                console.error('Ensure ACCESS_TOKEN in whtsappwebhook/.env is valid and has required permissions.');
            }
            // Rethrow so callers can handle failures
            throw err;
        }

    }

    async sendTemplateMessage(to, templateName, language = 'en_US', values = []) {
        try {
            const parameters = values.map((value) => ({ type: 'text', text: String(value) }));
            const components = parameters.length ? [{ type: 'body', parameters }] : [];
            const response = await axios.post(`/${PHONE_NUMBER_ID}/messages`, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'template',
                template: { name: templateName, language: { code: language }, components },
            });
            return response.data;
        } catch (err) {
            console.log(err.response?.data || err.message);
            throw err;
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
            throw err;

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
            throw err;

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
            throw err;

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
            throw err;

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
            throw err;

        }

    }

    async sendMedia(to, type, buffer, mimeType, filename, caption = '') {
        const form = new FormData();
        form.append('messaging_product', 'whatsapp');
        form.append('file', buffer, { filename, contentType: mimeType });

        const upload = await axios.post(`/${PHONE_NUMBER_ID}/media`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        const mediaId = upload.data?.id;
        if (!mediaId) throw new Error('Meta media upload did not return a media id');

        const media = { id: mediaId };
        if (caption && ['image', 'video', 'document'].includes(type)) media.caption = caption;
        if (type === 'document' && filename) media.filename = filename;

        const response = await axios.post(`/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type,
            [type]: media,
        }, {
            headers: {
                Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        return { ...response.data, mediaId };
    }

    async sendLocation(to, latitude, longitude, name = '', address = '') {
        const response = await axios.post(`/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'location',
            location: { latitude, longitude, name, address },
        });
        return response.data;
    }

}

module.exports = new WhatsAppService();
