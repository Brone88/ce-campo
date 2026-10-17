
const crypto = require("node:crypto");

const linkedWhatsApp = new Map();
const pendingLinks = new Map();

const LINK_TTL_MS = 10 * 60 * 1000;

// Identificativo WhatsApp indipendente dal provider.
// Accetta +393331234567 oppure 393331234567.
function getWhatsAppKey(phone) {
    if (typeof phone !== "string") return null;

    const digits = phone.replace(/\D/g, "");

    if (!/^[1-9]\d{7,14}$/.test(digits)) {
        return null;
    }

    return `+${digits}`;
}

function findUserByWhatsApp(phone) {
    const key = getWhatsAppKey(phone);

    if (!key) return null;

    return linkedWhatsApp.get(key) ?? null;
}

function completeLink(code, phone) {
    const key = getWhatsAppKey(phone);

    if (typeof code !== "string" || !key) {
        return { ok: false, reason: "invalid" };
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!/^DM-WA-[A-F0-9]{16}$/.test(normalizedCode)) {
        return { ok: false, reason: "invalid" };
    }

    const codeHash = crypto
        .createHash("sha256")
        .update(normalizedCode)
        .digest("hex");

    for (const [userId, pending] of pendingLinks) {
        if (Date.now() >= pending.expiresAt) {
            pendingLinks.delete(userId);
            continue;
        }

        if (pending.codeHash !== codeHash) {
            continue;
        }

        // Un numero non può appartenere a due account.
        const existingUser = linkedWhatsApp.get(key);

        if (existingUser && existingUser !== userId) {
            return { ok: false, reason: "already_linked" };
        }

        // Un account può avere un solo WhatsApp.
        for (const [existingKey, linkedUserId] of linkedWhatsApp) {
            if (linkedUserId === userId && existingKey !== key) {
                return {
                    ok: false,
                    reason: "user_already_linked",
                };
            }
        }

        linkedWhatsApp.set(key, userId);
        pendingLinks.delete(userId);

        console.log("[WhatsApp] Account linked", { userId });

        return { ok: true, userId };
    }

    return { ok: false, reason: "invalid_or_expired" };
}

function createLink(userId) {
    if (!userId) {
        throw new Error("Missing userId");
    }

    const code = `DM-WA-${crypto
        .randomBytes(8)
        .toString("hex")
        .toUpperCase()}`;

    const expiresAt = Date.now() + LINK_TTL_MS;

    const codeHash = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");

    // Un nuovo codice invalida quello precedente.
    pendingLinks.set(userId, {
        codeHash,
        expiresAt,
    });

    return {
        code,
        expiresAt: new Date(expiresAt).toISOString(),
    };
}

module.exports = {
    completeLink,
    createLink,
    findUserByWhatsApp,
};
