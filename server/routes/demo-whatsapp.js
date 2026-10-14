const express = require("express");

const {
    createLink,
} = require("../services/whatsapp-link");

const router = express.Router();

const DEMO_SECRET = process.env.DEMO_API_SECRET;
const TELNYX_CALLER_NUMBER = process.env.TELNYX_CALLER_NUMBER;

if (!DEMO_SECRET) {
    throw new Error("Missing DEMO_API_SECRET environment variable");
}

// Autenticazione semplificata, esclusivamente per la demo.
router.use((req, res, next) => {
    if (req.get("X-Demo-Secret") !== DEMO_SECRET) {
        return res.sendStatus(403);
    }

    next();
});

// Genera un codice di collegamento WhatsApp.
router.post("/link", (req, res) => {
    const { userId } = req.body ?? {};

    if (typeof userId !== "string" || !userId.trim()) {
        return res.status(400).json({
            error: "userId obbligatorio"
        });
    }

    const link = createLink(userId);

    const internationalizedPhoneNumber =
        TELNYX_CALLER_NUMBER.replace(/\D/g, "");

    const linkUrl =
        `https://wa.me/${internationalizedPhoneNumber}?text=${encodeURIComponent(link.code)}`;

    return res.status(201).json({
        userId,
        ...link,
        linkUrl
    });
});

module.exports = router;