const { randomInt, timingSafeEqual } = require("node:crypto");

const otpStore = new Map();

const OTP_TTL = 10 * 60 * 1000;
const OTP_COOLDOWN = 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

// Genera un codice a 6 cifre
function generateOtp() {
    return randomInt(0, 1000000)
        .toString()
        .padStart(6, "0");
}

// Controlla se possiamo inviare un nuovo OTP
function canSendOtp(email) {
    const record = otpStore.get(normalizeEmail(email));

    if (!record) return true;

    return Date.now() - record.sentAt >= OTP_COOLDOWN;
}

// Memorizza il codice dopo l'invio dell'email
function saveOtp(email, code) {
    otpStore.set(normalizeEmail(email), {
        code,
        expiresAt: Date.now() + OTP_TTL,
        sentAt: Date.now(),
        attempts: 0,
        used: false,
    });
}

// Verifica il codice
function verifyOtp(email, code) {
    const record = otpStore.get(normalizeEmail(email));

    if (!record) return false;
    if (record.used) return false;
    if (Date.now() > record.expiresAt) return false;
    if (record.attempts >= MAX_ATTEMPTS) return false;

    record.attempts++;

    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
        return false;
    }

    const valid = timingSafeEqual(
        Buffer.from(code),
        Buffer.from(record.code)
    );

    if (valid) {
        record.used = true;
        record.code = null;
    }

    return valid;
}

// Rimuove periodicamente i record scaduti
setInterval(() => {
    const now = Date.now();

    for (const [email, record] of otpStore) {
        if (record.expiresAt < now) {
            otpStore.delete(email);
        }
    }
}, 60_000).unref();

module.exports = {
    generateOtp,
    canSendOtp,
    saveOtp,
    verifyOtp,
};