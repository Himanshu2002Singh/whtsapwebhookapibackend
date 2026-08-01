const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const webhookRoutes = require("./routes/webhook.routes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/webhook", webhookRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "WhatsApp Cloud API Running..."
    });
});

module.exports = app;