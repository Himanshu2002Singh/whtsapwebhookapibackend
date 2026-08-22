const messageService = require("../services/message.service");
const appState = require("../services/appState.service");

exports.verifyWebhook = async (req, res) => {
    try {

        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (
            mode &&
            token &&
            mode === "subscribe" &&
            token === process.env.VERIFY_TOKEN
        ) {

            console.log("Webhook Verified Successfully");

            return res.status(200).send(challenge);
        }

        return res.sendStatus(403);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
};



exports.receiveWebhook = async (req, res) => {

    try {

        console.log("======================================");
        console.log("NEW WEBHOOK RECEIVED");
        console.log("======================================");

        console.log(JSON.stringify(req.body, null, 2));

        const body = req.body;

        if (body.object !== "whatsapp_business_account") {

            return res.sendStatus(404);

        }

        const entries = Array.isArray(body.entry) ? body.entry : [];
        for (const entry of entries) {
            const changes = Array.isArray(entry?.changes) ? entry.changes : [];
            for (const change of changes) {
                const value = change?.value;
                if (!value) continue;

                const contacts = Array.isArray(value.contacts) ? value.contacts : [];
                const messages = Array.isArray(value.messages) ? value.messages : [];
                const statuses = Array.isArray(value.statuses) ? value.statuses : [];

                if (messages.length) {
                    const contact = contacts[0];

                    for (const message of messages) {
                        const customerName = contact?.profile?.name || "";
                        const customerNumber = message?.from || contact?.wa_id || "";

                        console.log("Customer Name :", customerName);
                        console.log("Customer Number :", customerNumber);
                        console.log("Message Type :", message.type);
                        console.log("Message ID :", message.id);
                        console.log("Timestamp :", message.timestamp);

                        await messageService.handleIncomingMessage(
                            customerName,
                            customerNumber,
                            message
                        );
                    }
                }

                if (statuses.length) {
                    for (const status of statuses) {
                        console.log("Status Update :", status.status, status.id);
                        await messageService.handleMessageStatusUpdate(status);
                    }
                }

                if (change.field === 'message_template_status_update') {
                    const templateStatus = value?.event || value?.status || value?.template_status;
                    const templateName = value?.message_template_name || value?.name;
                    const templateId = value?.message_template_id || value?.id;
                    const templateLanguage = value?.message_template_language || value?.language;

                    console.log("Template Status Update :", templateStatus, templateName, templateId);
                    appState.syncTemplateStatusFromMeta({
                        status: templateStatus,
                        templateName,
                        templateId,
                        templateLanguage,
                        reason: value?.reason || null,
                    });
                }
            }
        }

        return res.sendStatus(200);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
