const express = require("express");
require("dotenv").config();
const { handle } = require("../services/ai-orchestrator");
const {
    completeLink,
    findUserByWhatsApp
} = require("../services/whatsapp-link");

const {
    WAZZUP_API_KEY,
    WAZZUP_CHANNEL_ID,
} = process.env;

const required = {
    WAZZUP_API_KEY,
    WAZZUP_CHANNEL_ID,
};

for (const [key, value] of Object.entries(required)) {
    if (!value) {
        console.error(`Missing env variable: ${key}`);
        process.exit(1);
    }
}

const router = express.Router();

async function sendWhatsAppMessage(chatId, text) {
    const response = await fetch("https://api.wazzup24.com/v3/message", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${WAZZUP_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            channelId: WAZZUP_CHANNEL_ID,
            chatType: "whatsapp",
            chatId,
            text
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wazzup error ${response.status}: ${error}`);
    }

    return response.json();
}

async function handleInboundWhatsApp(message) {
    const { channelId, chatId, chatType, text } = message;

    if (
        chatType !== "whatsapp" ||
        channelId !== process.env.WAZZUP_CHANNEL_ID ||
        !chatId ||
        typeof text !== "string"
    ) {
        return;
    }

    const userText = text.trim();

    // 1. Intercettiamo i messaggi di linking.
    if (userText.toUpperCase().startsWith("DM-WA-")) {

        const result = completeLink(
            userText,
            channelId,
            chatId
        );

        if (result.ok) {
            await sendWhatsAppMessage(
                chatId,
                "✅ WhatsApp collegato correttamente al tuo account Digital Mop! Ora puoi parlare con l'assistente."
            );
        } else {
            console.log(
                `[WhatsApp] Linking fallito: ${result.reason}`
            );

            await sendWhatsAppMessage(
                chatId,
                "❌ Collegamento non riuscito. Verifica il codice oppure generane uno nuovo dal tuo account."
            );
        }

        return;
    }

    // 2. Verifichiamo se il mittente è autorizzato.
    const userId = findUserByWhatsApp(channelId, chatId);

    if (!userId) {
        console.log(
            `[WhatsApp] Accesso negato: ${chatId} non collegato`
        );
        return;
    }

    // 3. Utente autorizzato: possiamo usare l'AI.
    console.log(`[WhatsApp] Utente autorizzato: ${userId}`);

    const result = await handle({
        channel: "whatsapp",
        userId,
        conversationId: `whatsapp:${channelId}:${chatId}`,
        text: userText
    });

    if (typeof result.text !== "string" || !result.text.trim()) {
        console.warn("[WhatsApp] Risposta AI vuota o non valida");
        return;
    }

    await sendWhatsAppMessage(chatId, result.text);
}

router.post("/", (req, res) => {
    console.log("=== WAZZUP WEBHOOK ===");
    console.log(JSON.stringify(req.body, null, 2));

    // Confermiamo subito la ricezione a Wazzup
    res.sendStatus(200);

    const messages = req.body.messages ?? [];

    for (const message of messages) {
        if (
            message.status !== "inbound" ||
            message.chatType !== "whatsapp" ||
            message.isEcho ||
            message.type !== "text" ||
            !message.text
        ) {
            continue;
        }

        handleInboundWhatsApp(message).catch((error) => {
            console.error("Errore gestione WhatsApp:", error);
        });
    }
});

module.exports = router;
