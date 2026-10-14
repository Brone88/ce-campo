const crypto = require("node:crypto");

const linkedWhatsApp = new Map();
const pendingLinks = new Map();

const LINK_TTL_MS = 10 * 60 * 1000;

function getWhatsAppKey(channelId, chatId) {
    return `${channelId}:${chatId}`;
}

function findUserByWhatsApp(channelId, chatId) {
    const key = getWhatsAppKey(channelId, chatId);

    return linkedWhatsApp.get(key) ?? null;
}

function completeLink(code, channelId, chatId) {
    if (
        typeof code !== "string" ||
        !channelId ||
        !chatId
    ) {
        return { ok: false, reason: "invalid" };
    }

    const normalizedCode = code.trim().toUpperCase();

    const codeHash = crypto
        .createHash("sha256")
        .update(normalizedCode)
        .digest("hex");

    for (const [userId, pending] of pendingLinks) {

        // Rimuoviamo i codici scaduti.
        if (Date.now() >= pending.expiresAt) {
            pendingLinks.delete(userId);
            continue;
        }

        if (pending.codeHash !== codeHash) {
            continue;
        }

        const key = getWhatsAppKey(channelId, chatId);

        // Una chat non può appartenere a due account.
        const existingUser = linkedWhatsApp.get(key);

        if (existingUser && existingUser !== userId) {
            return { ok: false, reason: "already_linked" };
        }

        // Un utente può avere un solo WhatsApp collegato.
        for (const [existingKey, linkedUserId] of linkedWhatsApp) {
            if (linkedUserId === userId && existingKey !== key) {
                return { ok: false, reason: "user_already_linked" };
            }
        }

        // Completiamo il collegamento.
        linkedWhatsApp.set(key, userId);

        // Il codice non potrà più essere utilizzato.
        pendingLinks.delete(userId);

        console.log(
            `[WhatsApp] Account ${userId} collegato a ${chatId}`
        );

        return { ok: true, userId };
    }

    return { ok: false, reason: "invalid_or_expired" };
}

function createLink(userId) {
    const code = `DM-WA-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    const expiresAt = Date.now() + LINK_TTL_MS;

    // Memorizziamo l'hash, non il codice in chiaro
    const codeHash = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");

    pendingLinks.set(userId, {
        codeHash,
        expiresAt
    });

    return {
        code,
        expiresAt: new Date(expiresAt).toISOString()
    };
}

module.exports = {
    completeLink,
    createLink,
    findUserByWhatsApp
};