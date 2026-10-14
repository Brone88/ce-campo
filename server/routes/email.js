const express = require("express");
const { rateLimit } = require("express-rate-limit");

const { sendEmail } = require("../services/email");

const {
    generateOtp,
    canSendOtp,
    saveOtp,
    verifyOtp,
} = require("../services/emailOtp");

const router = express.Router();

// Massimo 10 richieste di invio ogni 15 minuti per IP
const sendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

// Massimo 30 tentativi di verifica ogni 15 minuti per IP
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

function isValidEmail(email) {
    return (
        typeof email === "string" &&
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
}

// Richiesta codice OTP
router.post("/request", sendLimiter, async (req, res) => {
    const { email } = req.body || {};

    if (!isValidEmail(email)) {
        return res.status(400).json({
            error: "Invalid email",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!canSendOtp(normalizedEmail)) {
        return res.status(429).json({
            error: "Wait before requesting another code",
        });
    }

    const code = generateOtp();

    try {
        await sendEmail({
            to: normalizedEmail,
            subject: "Digital Mop - Verifica email",
            html: `
                <h2>Verifica il tuo indirizzo email</h2>
                <p>Il tuo codice di verifica è:</p>
                <h1>${code}</h1>
                <p>Il codice scade tra 10 minuti.</p>
            `,
        });

        saveOtp(normalizedEmail, code);

        return res.json({
            success: true,
            message: "Verification email sent",
        });

    } catch (error) {
        console.error("Email sending failed:", error);

        return res.status(502).json({
            error: "Unable to send verification email",
        });
    }
});

// Verifica codice OTP
router.post("/verify", verifyLimiter, (req, res) => {
    const { email, code } = req.body || {};

    if (!isValidEmail(email) ||
        typeof code !== "string" ||
        !/^\d{6}$/.test(code)) {
        return res.status(400).json({
            error: "Invalid request",
        });
    }

    const verified = verifyOtp(email, code);

    if (!verified) {
        return res.status(400).json({
            verified: false,
            error: "Invalid or expired code",
        });
    }

    return res.json({
        verified: true,
    });
});

module.exports = router;