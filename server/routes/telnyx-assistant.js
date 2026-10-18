
const express = require("express");
const crypto = require("node:crypto");

const router = express.Router();

const activeCalls = new Map();
const CALL_TTL_MS = 30 * 60 * 1000;

const EXPECTED_ASSISTANT_ID =
    process.env.TELNYX_ASSISTANT_ID;

// Carichiamo la chiave pubblica per verificare le firme.
function loadPublicKey() {
    const encoded = process.env.TELNYX_PUBLIC_KEY;

    if (!encoded) return null;

    const key = Buffer.from(encoded.trim(), "base64");

    if (key.length !== 32) return null;

    try {
        return crypto.createPublicKey({
            key: Buffer.concat([
                Buffer.from(
                    "302a300506032b6570032100",
                    "hex"
                ),
                key
            ]),
            format: "der",
            type: "spki"
        });
    } catch {
        return null;
    }
}

const publicKey = loadPublicKey();

// Verifica l'autenticità della richiesta Telnyx.
function verifySignature(req) {
    if (!publicKey || !Buffer.isBuffer(req.body)) {
        return false;
    }

    const timestamp = req.get("telnyx-timestamp");
    const signature = req.get(
        "telnyx-signature-ed25519"
    );

    if (!timestamp || !signature) return false;

    const seconds = Number(timestamp);

    if (!Number.isSafeInteger(seconds)) {
        return false;
    }

    // Tolleranza massima: 5 minuti.
    if (Math.abs(Date.now() / 1000 - seconds) > 300) {
        return false;
    }

    const signedData = Buffer.concat([
        Buffer.from(`${timestamp}|`, "utf8"),
        req.body
    ]);

    const signatureBytes = Buffer.from(
        signature,
        "base64"
    );

    if (signatureBytes.length !== 64) {
        return false;
    }

    return crypto.verify(
        null,
        signedData,
        publicKey,
        signatureBytes
    );
}

function verifyToolAuthorization(req) {
    const secret = process.env.DEMO_API_SECRET;
    const authorization = req.get("authorization") || "";

    if (!secret || !authorization.startsWith("Bearer ")) {
        return false;
    }

    const received = Buffer.from(
        authorization.slice(7),
        "utf8"
    );

    const expected = Buffer.from(secret, "utf8");

    return received.length === expected.length &&
        crypto.timingSafeEqual(received, expected);
}

router.use((req, res, next) => {
    if (req.path.startsWith("/tools/")) {
        console.log("[TELNYX TOOL] Request received", {
            method: req.method,
            path: req.path,
            hasAuthorization: Boolean(
                req.get("authorization")
            ),
            callToken: req.get("x-call-token")
                ? "PRESENT"
                : "MISSING",
            rawBody: Buffer.isBuffer(req.body)
        });

        res.on("finish", () => {
            console.log(
                "[TELNYX TOOL] HTTP status:",
                res.statusCode
            );
        });
    }

    next();
});

// Inizializzazione della conversazione.
router.post("/init", (req, res) => {
    if (!publicKey || !EXPECTED_ASSISTANT_ID) {
        return res.sendStatus(503);
    }

    if (!verifySignature(req)) {
        return res.sendStatus(403);
    }

    let event;

    try {
        event = JSON.parse(req.body.toString("utf8"));
    } catch {
        return res.sendStatus(400);
    }

    if (
        event?.data?.event_type !==
        "assistant.initialization"
    ) {
        return res.sendStatus(400);
    }

    const payload = event.data.payload;

    if (
        payload?.assistant_id !== EXPECTED_ASSISTANT_ID ||
        payload?.telnyx_conversation_channel !==
        "phone_call" ||
        !payload?.call_control_id
    ) {
        return res.sendStatus(403);
    }

    const callToken = crypto.randomBytes(32).toString("hex");

    const now = Date.now();

    for (const [token, call] of activeCalls) {
        if (now - call.createdAt > CALL_TTL_MS) {
            activeCalls.delete(token);
        }
    }

    activeCalls.set(callToken, {
        callId: payload.call_control_id,
        assistantId: payload.assistant_id,
        createdAt: now,
        result: null
    });

    console.log("Telnyx AI initialization", {
        callId: payload.call_control_id,
        assistantId: payload.assistant_id
    });

    return res.json({
        dynamic_variables: {
            service_name: "C'è Campo",
            call_mode: "inbound",
            demo_mode: "true",
            opening_line:
                "Buongiorno, sono Orietta, " +
                "l'assistente virtuale di C'è Campo. " +
                "Come posso aiutarla?",
            call_token: callToken
        }
    });
});

router.post(
    "/tools/record-structure-response",
    (req, res) => {
        if (!verifyToolAuthorization(req)) {
            return res.sendStatus(401);
        }

        const callToken = req.get("x-call-token");

        if (!callToken) {
            return res.sendStatus(400);
        }

        const call = activeCalls.get(callToken);

        // Da qui rimangono i controlli esistenti
        // su chiamata, scadenza, duplicati e body.
        if (
            !call ||
            Date.now() - call.createdAt > CALL_TTL_MS
        ) {
            return res.status(404).json({
                ok: false,
                error: "CALL_NOT_FOUND"
            });
        }

        if (call.result) {
            return res.json({
                ok: true,
                duplicate: true,
                message: "Risultato già registrato"
            });
        }

        let input;

        try {
            input = JSON.parse(req.body.toString("utf8"));
        } catch {
            return res.status(400).json({
                ok: false,
                error: "INVALID_JSON"
            });
        }

        const {
            availability,
            price_eur,
            alternative,
            notes
        } = input ?? {};

        const validAvailability = [
            "available",
            "unavailable",
            "unknown"
        ].includes(availability);

        const validPrice =
            price_eur == null ||
            (
                typeof price_eur === "number" &&
                Number.isFinite(price_eur) &&
                price_eur >= 0 &&
                price_eur <= 1000
            );

        const validAlternative =
            alternative == null ||
            (
                typeof alternative === "string" &&
                alternative.length <= 500
            );

        const validNotes =
            notes == null ||
            (
                typeof notes === "string" &&
                notes.length <= 1000
            );

        if (
            !validAvailability ||
            !validPrice ||
            !validAlternative ||
            !validNotes
        ) {
            return res.status(422).json({
                ok: false,
                error: "INVALID_PARAMETERS"
            });
        }

        call.result = {
            availability,
            price_eur: price_eur ?? null,
            alternative: alternative ?? "",
            notes: notes ?? "",
            recordedAt: new Date().toISOString()
        };

        console.log("=== TELNYX STRUCTURE RESPONSE ===");
        console.log({
            callId: call.callId,
            ...call.result
        });

        return res.json({
            ok: true,
            demo: true,
            message:
                "Risposta registrata. " +
                "Nessuna prenotazione confermata."
        });
    }
);

module.exports = router;
