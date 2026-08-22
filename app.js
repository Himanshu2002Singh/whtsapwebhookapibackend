const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const webhookRoutes = require("./routes/webhook.routes");
const apiRoutes = require("./routes/api.routes");
const settingsRoutes = require("./routes/settings.routes");

const app = express();

// trust proxy when running behind a reverse proxy (nginx)
app.set('trust proxy', true);

// restrict CORS to configured webhook URL in production
const allowedOrigin = process.env.WEBHOOK_URL || '*';
app.use(cors({ origin: allowedOrigin }));

// Media is sent as base64 JSON; allow headroom for WhatsApp's 100 MB document limit.
app.use(express.json({ limit: '140mb' }));

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/webhook", webhookRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "WhatsApp Cloud API Running..."
    });
});

module.exports = app;
