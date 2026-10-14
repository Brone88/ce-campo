
const express = require("express");
const { handle } = require("../services/ai-orchestrator");
const {
    completeLink,
    findUserByTelegramId,
} = require("../services/telegram-link");
const router = express.Router();

const {
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET,
} = process.env;

const required = {
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET,
};

for (const [key, value] of Object.entries(required)) {
    if (!value) {
        console.error(`Missing env variable: ${key}`);
        process.exit(1);
    }
}

const TELEGRAM_BOT_ID = TELEGRAM_BOT_TOKEN.split(":")[0];

if (!/^\d+$/.test(TELEGRAM_BOT_ID)) {
    console.error("TELEGRAM_BOT_TOKEN has no numeric bot id");
    process.exit(1);
}

async function telegramRequest(method, payload) {
    const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
        throw new Error(
            result.description || `Telegram ${method} failed`
        );
    }

    return result.result;
}

async function sendMessage(chatId, text) {
    // Telegram limita i messaggi di testo a 4096 caratteri.
    const chunks = text.match(/[\s\S]{1,4000}/g) || [];

    for (const chunk of chunks) {
        await telegramRequest("sendMessage", {
            chat_id: chatId,
            text: chunk,
        });
    }
}

async function processUpdate(update) {
    const message = update.message;
    if (!message?.text || !message.from?.id) return;

    // Per ora gestiamo soltanto le conversazioni private.
    if (message.chat.type !== "private") return;

    const chatId = message.chat.id;
    const telegramUserId = String(message.from.id);
    const conversationId = `telegram:${TELEGRAM_BOT_ID}:${chatId}`;
    const text = message.text.trim();

    try {
        // 1. Intercetta il collegamento Telegram.
        const startMatch = text.match(
            /^\/start(?:@\w+)?\s+([A-Za-z0-9_-]+)$/
        );

        if (startMatch) {
            const result = completeLink(
                startMatch[1],
                telegramUserId,
                chatId
            );

            await sendMessage(
                chatId,
                result.ok
                    ? "✅ Telegram collegato a Digital Mop! Ora puoi scrivermi."
                    : "Collegamento non riuscito. Genera un nuovo link."
            );

            return;
        }

        // 2. Identifica l'utente Digital Mop.
        const userId = findUserByTelegramId(telegramUserId);

        if (!userId) {
            await sendMessage(
                chatId,
                "Per utilizzare Digital Mop devi prima collegare Telegram al tuo account."
            );
            return;
        }

        // 3. Gestisce /start senza token.
        if (text === "/start") {
            await sendMessage(
                chatId,
                "Ciao! Sono Digital Mop. Come posso aiutarti?"
            );
            return;
        }

        console.log("[Telegram] Incoming:", {
            updateId: update.update_id,
            userId,
            conversationId,
        });

        // 4. Segnala che l'AI sta elaborando.
        await telegramRequest("sendChatAction", {
            chat_id: chatId,
            action: "typing",
        });

        // 5. Passa il messaggio all'orchestratore.
        const result = await handle({
            channel: "telegram",
            userId,
            conversationId,
            text,
        });

        await sendMessage(
            chatId,
            result.text || "Non ho una risposta al momento."
        );

        console.log("[Telegram] Response sent:", {
            updateId: update.update_id,
            userId,
            conversationId,
        });

    } catch (error) {
        console.error("[Telegram] Processing failed:", error);

        try {
            await sendMessage(
                chatId,
                "Si è verificato un problema. Riprova tra poco."
            );
        } catch (sendError) {
            console.error("[Telegram] Send failed:", sendError);
        }
    }
}

router.post("/", (req, res) => {
    if (
        req.get("X-Telegram-Bot-Api-Secret-Token") !== TELEGRAM_WEBHOOK_SECRET
    ) {
        return res.sendStatus(403);
    }

    const update = req.body;

    if (
        !update ||
        !Number.isSafeInteger(update.update_id)
    ) {
        return res.sendStatus(400);
    }

    // Confermiamo subito la ricezione a Telegram.
    res.sendStatus(200);

    console.log("[Telegram] Update:", {
        updateId: update.update_id,
        command: update.message?.text?.split(" ")[0],
        hasPayload: Boolean(
            update.message?.text?.match(/^\/start\s+\S+/)
        ),
    });

    void processUpdate(update).catch(console.error);
});

module.exports = router;
