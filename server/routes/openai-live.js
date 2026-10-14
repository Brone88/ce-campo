const express = require("express");
const OpenAI = require("openai");
const {
    findStructureByPhone,
} = require("../services/structure-contacts");
const { attachLiveCall } = require("../services/live-call-session");
const { buildLiveSession } = require("../services/live-call-instructions");

const router = express.Router();
// Demo: process-local deduplication. Production needs a durable/shared store.
const decisions = new Map();
const DECISION_TTL_MS = 10 * 60 * 1000;

function normalizeSipPhone(value) {
    if (!value) return null;

    const phone = value.replace(/[\s().-]/g, "");

    if (phone.startsWith("+")) return phone;
    if (phone.startsWith("00")) return phone.replace(/^00/, "+");

    // Demo italiana: numero nazionale senza prefisso.
    if (/^\d+$/.test(phone)) return `+39${phone}`;

    return null;
}


router.post("/", async (req, res) => {
    const secret = process.env.OPENAI_WEBHOOK_SECRET;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!secret || !apiKey) {
        console.error("[OpenAI webhook] Configurazione mancante");
        return res.sendStatus(503);
    }

    let event;

    try {
        const client = new OpenAI({ apiKey });

        event = await client.webhooks.unwrap(
            req.body,
            req.headers,
            secret
        );
    } catch (error) {
        console.error("[OpenAI webhook] Verifica non riuscita");
        return res.sendStatus(400);
    }

    console.log("[OpenAI webhook] Evento verificato:", event.type);

    if (
        event.type !== "live.transport.incoming" ||
        event.data?.type !== "sip"
    ) {
        return res.sendStatus(200);
    }

    const sessionId = event.data.session_id;
    if (typeof sessionId !== "string" || !sessionId) return res.sendStatus(400);
    for (const [key, value] of decisions) {
        if (value.finishedAt && Date.now() - value.finishedAt > DECISION_TTL_MS) decisions.delete(key);
    }
    if (!decisions.has(sessionId)) {
        const entry = { finishedAt: null };
        entry.promise = handleIncoming(event, apiKey).then(status => {
            if (status >= 500) decisions.delete(sessionId);
            else entry.finishedAt = Date.now();
            return status;
        }).catch(error => {
            decisions.delete(sessionId);
            console.error("[OpenAI webhook] Decisione fallita:", error.message);
            return 503;
        });
        decisions.set(sessionId, entry);
    }
    const status = await decisions.get(sessionId).promise;
    return res.sendStatus(status);
});

async function handleIncoming(event, apiKey) {
    const headers = Array.isArray(event.data.sip_headers) ? event.data.sip_headers : [];

    const from = headers.find(
        header => typeof header?.name === "string" && ["from", "f"].includes(header.name.toLowerCase())
    )?.value || "";

    // Estrae il numero dall'indirizzo SIP, non dal nome visualizzato.
    const privacy = headers.some(header => typeof header?.name === "string" && header.name.toLowerCase() === "privacy" &&
        /(?:^|[;,\s])(id|user|header)(?:$|[;,\s])/i.test(String(header.value)));
    const caller = !privacy && typeof from === "string" ? from.match(/sips?:([^@;>\s]+)@/i)?.[1] : null;

    const phone = normalizeSipPhone(caller);

    try {
        const structure = await findStructureByPhone(phone);

        console.log(
            "[OpenAI webhook] Struttura:",
            structure ? structure.structureName : "NON AUTORIZZATA"
        );

        if (!structure) {
            const sessionId = event.data.session_id;

            const response = await fetch(
                `https://api.openai.com/v1/live/sessions/${encodeURIComponent(sessionId)}/reject`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status_code: 603 }),
                    signal: AbortSignal.timeout(5000),
                }
            );

            if (!response.ok) {
                const details = await response.json().catch(() => null);

                // Una consegna duplicata può riferirsi a una chiamata
                // sulla quale abbiamo già preso una decisione.
                if (details?.error?.code !== "decision_already_made") {
                    throw new Error(`Rifiuto chiamata: HTTP ${response.status}`);
                }
            }

            console.log("[OpenAI webhook] Chiamata non autorizzata: rifiutata");
            return 200;
        }

        const sessionId = event.data.session_id;

        const response = await fetch(
            `https://api.openai.com/v1/live/sessions/${encodeURIComponent(sessionId)}/accept`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    session: buildLiveSession({
                        direction: "inbound",
                        structureName: structure.structureName,
                    }),
                }),
                signal: AbortSignal.timeout(10000),
            }
        );

        if (!response.ok) {
            const details = await response.json().catch(() => null);

            if (details?.error?.code === "decision_already_made") {
                return 200;
            }

            throw new Error(
                `Accettazione: HTTP ${response.status} - ${details?.error?.message || "Errore senza dettagli"
                }`
            );
        }

        console.log("[OpenAI webhook] Chiamata accettata");

        attachLiveCall(sessionId, { direction: "inbound" });

    } catch (error) {
        console.error("[OpenAI webhook] Gestione chiamata fallita:", error.message);
        return 503;
    }

    return 200;
}

module.exports = router;
