
const express = require("express");
const crypto = require("node:crypto");

const { handle } = require("../services/ai-orchestrator");
const {
    sendWhatsAppMessage,
} = require("../services/telnyx-whatsapp");
const {
    completeLink,
    findUserByWhatsApp,
} = require("../services/whatsapp-link");

const router = express.Router();

const publicKeyBase64 = process.env.TELNYX_PUBLIC_KEY;

if (!publicKeyBase64) {
    throw new Error("Missing TELNYX_PUBLIC_KEY");
}

const rawKey = Buffer.from(publicKeyBase64, "base64");

if (rawKey.length !== 32) {
    throw new Error("Invalid TELNYX_PUBLIC_KEY");
}

const publicKey = crypto.createPublicKey({
    key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        rawKey,
    ]),
    format: "der",
    type: "spki",
});

// Deduplicazione provvisoria per la demo.
// Per la produzione useremo Redis.
const seenMessages = new Map();
const DEDUP_TTL_MS = 60 * 60 * 1000;

function isNewMessage(id) {
    if (!id) return false;

    const now = Date.now();

    for (const [key, expiresAt] of seenMessages) {
        if (expiresAt <= now) seenMessages.delete(key);
    }

    if (seenMessages.has(id)) return false;

    seenMessages.set(id, now + DEDUP_TTL_MS);
    return true;
}

function normalizePhone(value) {
    if (typeof value !== "string") return null;

    const digits = value.replace(/\D/g, "");
    const phone = `+${digits}`;

    return /^\+[1-9]\d{7,14}$/.test(phone)
        ? phone
        : null;
}

function getMessageText(message) {
    if (message.type !== "text") return null;

    const value = message.text;

    if (typeof value === "string") return value.trim();
    if (typeof value?.body === "string") {
        return value.body.trim();
    }

    return null;
}

// Evita di sovrapporre elaborazioni AI dello stesso utente.
const conversations = new Map();

function enqueueConversation(sender, operation) {
    const previous = conversations.get(sender) || Promise.resolve();

    const current = previous
        .catch(() => { })
        .then(operation);

    conversations.set(sender, current);

    void current
        .catch((error) => {
            console.error("[WHATSAPP PROCESSING ERROR]", error.message);
        })
        .finally(() => {
            if (conversations.get(sender) === current) {
                conversations.delete(sender);
            }
        });
}

async function processMessage(message) {
    const from = normalizePhone(message.from);
    const text = getMessageText(message);

    if (!from || !text) return;

    const myNumber = normalizePhone(
        process.env.TELNYX_WHATSAPP_NUMBER
    );

    // Non rispondiamo ai messaggi inviati dal nostro numero.
    if (from === myNumber) return;

    // Verifichiamo se il messaggio contiene un codice di linking.
    if (/^DM-WA-[A-F0-9]{16}$/i.test(text.trim())) {
        const result = completeLink(text, from);

        let reply;

        if (result.ok) {
            reply =
                "Account WhatsApp collegato correttamente! " +
                "Ora puoi utilizzare Digital Mop da questa chat.";
        } else if (result.reason === "already_linked") {
            reply =
                "Questo numero WhatsApp è già collegato " +
                "a un altro account.";
        } else if (result.reason === "user_already_linked") {
            reply =
                "Il tuo account ha già un altro numero WhatsApp collegato.";
        } else {
            reply =
                "Codice non valido o scaduto. " +
                "Generane uno nuovo dalla webapp C'èCampo.";
        }

        await sendWhatsAppMessage(from, reply);
        return;
    }

    // Se non è un codice, identifichiamo l'utente.
    const userId = findUserByWhatsApp(from);

    if (!userId) {
        await sendWhatsAppMessage(
            from,
            "Ciao! Per utilizzare C'èCampo tramite WhatsApp, " +
            "accedi alla webapp e collega il tuo account " +
            "inviando qui il codice generato."
        );
        return;
    }

    // Utente collegato: possiamo chiamare l'orchestratore.
    const conversationId = `whatsapp:${from}`;

    const result = await handle({
        channel: "whatsapp",
        userId,
        conversationId,
        text,
    });

    const reply = result?.text;

    if (typeof reply === "string" && reply.trim()) {
        await sendWhatsAppMessage(from, reply.trim());
    }
}

router.post("/", (req, res) => {
    const rawBody = req.body;
    const timestamp = req.get("telnyx-timestamp");
    const signature = req.get("telnyx-signature-ed25519");

    if (!Buffer.isBuffer(rawBody)) {
        return res.sendStatus(500);
    }

    if (!timestamp || !/^\d+$/.test(timestamp) || !signature) {
        return res.sendStatus(401);
    }

    if (
        Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
    ) {
        return res.sendStatus(401);
    }

    const signatureBytes = Buffer.from(signature, "base64");

    if (signatureBytes.length !== 64) {
        return res.sendStatus(401);
    }

    const signedContent = Buffer.concat([
        Buffer.from(`${timestamp}|`, "utf8"),
        rawBody,
    ]);

    if (
        !crypto.verify(
            null,
            signedContent,
            publicKey,
            signatureBytes
        )
    ) {
        return res.sendStatus(401);
    }

    let event;

    try {
        event = JSON.parse(rawBody.toString("utf8"));
    } catch {
        return res.sendStatus(400);
    }

    const eventType = event.data?.event_type;
    const eventId = event.data?.id;

    // Per adesso elaboriamo soltanto gli inbound WABA
    // già verificati con il payload reale Telnyx.
    // Ignoriamo message.received dal Messaging Profile
    // per non generare due risposte allo stesso messaggio.
    if (eventType !== "whatsapp.messages") {
        return res.sendStatus(200);
    }

    const messages = event.data?.payload?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.sendStatus(200);
    }

    // Confermiamo subito la ricezione del webhook.
    res.sendStatus(200);

    for (const message of messages) {
        const messageId = message.id || message.foreign_id;

        if (!messageId || !isNewMessage(messageId)) {
            continue;
        }

        const sender = normalizePhone(message.from);

        if (!sender) continue;

        console.log("[TELNYX WHATSAPP]", {
            eventId,
            messageId,
            messageType: message.type,
        });

        enqueueConversation(sender, () => processMessage(message));
    }
});

module.exports = router;
