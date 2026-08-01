const messageService = require("../services/message.service");

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

        const entry = body.entry?.[0];

        const change = entry?.changes?.[0];

        const value = change?.value;

        if (!value) {

            return res.sendStatus(200);

        }

        const contacts = value.contacts || [];

        const messages = value.messages || [];

        if (!messages.length) {

            console.log("No Incoming Messages");

            return res.sendStatus(200);

        }

        const contact = contacts[0];

        const customerName = contact?.profile?.name || "";

        const customerNumber = contact?.wa_id || "";

        const message = messages[0];

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

        return res.sendStatus(200);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};