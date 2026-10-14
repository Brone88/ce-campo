
const crypto = require("node:crypto");

const pendingLinks = new Map();
const accounts = new Map();
const telegramOwners = new Map();

const TTL = 10 * 60 * 1000;

function createLink(userId) {
    // Elimina eventuali richieste precedenti dello stesso utente.
    for (const [token, pending] of pendingLinks) {
        if (pending.userId === userId) {
            pendingLinks.delete(token);
        }
    }

    const token = crypto.randomBytes(32).toString("base64url");

    pendingLinks.set(token, {
        userId,
        expiresAt: Date.now() + TTL,
    });

    return token;
}

function completeLink(token, telegramUserId, chatId) {
    const pending = pendingLinks.get(token);

    if (!pending) {
        return { ok: false, reason: "invalid_token" };
    }

    if (Date.now() > pending.expiresAt) {
        pendingLinks.delete(token);
        return { ok: false, reason: "expired_token" };
    }

    const telegramId = String(telegramUserId);
    const existingOwner = telegramOwners.get(telegramId);

    if (existingOwner && existingOwner !== pending.userId) {
        return { ok: false, reason: "already_linked" };
    }

    // Invalida il token prima di creare l'associazione.
    pendingLinks.delete(token);

    const previous = accounts.get(pending.userId);

    if (previous) {
        telegramOwners.delete(previous.telegramUserId);
    }

    const account = {
        telegramUserId: telegramId,
        chatId: String(chatId),
        linkedAt: new Date().toISOString(),
    };

    accounts.set(pending.userId, account);
    telegramOwners.set(telegramId, pending.userId);

    return { ok: true, userId: pending.userId };
}

function getLink(userId) {
    return accounts.get(userId) ?? null;
}

function findUserByTelegramId(telegramUserId) {
    return telegramOwners.get(String(telegramUserId)) ?? null;
}

module.exports = {
    createLink,
    completeLink,
    getLink,
    findUserByTelegramId,
};
