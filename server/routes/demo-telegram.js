const express = require("express");

const {
    createLink,
    getLink,
} = require("../services/telegram-link");

const router = express.Router();

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const DEMO_SECRET = process.env.DEMO_API_SECRET;

if (!BOT_USERNAME || !DEMO_SECRET) {
    throw new Error("Missing Telegram demo environment variables");
}

// Autenticazione semplificata, esclusivamente per la demo.
router.use((req, res, next) => {
    if (req.get("X-Demo-Secret") !== DEMO_SECRET) {
        return res.sendStatus(403);
    }
    next();
});

router.post("/link", (req, res) => {
    const userId = req.body?.userId;

    if (typeof userId !== "string" || !userId.trim()) {
        return res.status(400).json({
            error: "userId is required",
        });
    }

    const token = createLink(userId);

    res.json({
        userId,
        url: `https://t.me/${BOT_USERNAME}?start=${token}`,
        expiresInSeconds: 600,
    });
});

router.get("/link", (req, res) => {
    const userId = req.query.userId;

    if (typeof userId !== "string" || !userId.trim()) {
        return res.status(400).json({
            error: "userId is required",
        });
    }

    res.json({
        userId,
        linked: getLink(userId) !== null,
        telegram: getLink(userId),
    });
});

module.exports = router;
