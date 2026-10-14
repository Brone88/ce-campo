require("dotenv").config();

const { attachLiveCall } = require("../services/live-call-session");
const { buildLiveSession } = require("../services/live-call-instructions");
const audioTestOnly = process.argv.includes("--audio-test");

console.log("[DEBUG avvio]", {
    file: __filename,
    audioTestOnly,
    gestioneChiamata: "servizio condiviso",
});

const {
    OPENAI_API_KEY,
    TELNYX_SIP_USERNAME,
    TELNYX_SIP_PASSWORD,
    TELNYX_CALLER_NUMBER,
    TEST_PHONE_NUMBER,
} = process.env;

const required = {
    OPENAI_API_KEY,
    TELNYX_SIP_USERNAME,
    TELNYX_SIP_PASSWORD,
    TELNYX_CALLER_NUMBER,
    TEST_PHONE_NUMBER,
};

for (const [key, value] of Object.entries(required)) {
    if (!value) {
        console.error(`Missing env variable: ${key}`);
        process.exit(1);
    }
}

let sessionId;
let activeCall;
let stopRequested = false;

async function createCall() {
    if (audioTestOnly) console.log("🧪 Prova solo audio: backend escluso. Termina con Ctrl+C.");
    console.log(`📞 Calling ${TEST_PHONE_NUMBER}...`);

    const response = await fetch(
        "https://api.openai.com/v1/live/sessions",
        {
            method: "POST",
            signal: AbortSignal.timeout(30000),
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                session: buildLiveSession({
                    direction: "outbound",
                    audioTestOnly,
                }),

                transport: {
                    type: "sip",

                    destination: TEST_PHONE_NUMBER,

                    trunk: {
                        provider_url: "sips:sip.telnyx.com:5061",

                        auth: {
                            type: "digest",
                            username: TELNYX_SIP_USERNAME,
                            password: TELNYX_SIP_PASSWORD,
                        },

                        caller_number: TELNYX_CALLER_NUMBER,
                    },
                },
            }),
        }
    );

    const text = await response.text();

    if (!response.ok) {
        console.error("\n❌ OpenAI error");
        console.error(`HTTP ${response.status}`);
        console.error(text);
        process.exit(1);
    }

    const result = JSON.parse(text);

    sessionId = result.session.id;

    console.log("✅ Session created");
    console.log(`Session ID: ${sessionId}`);

    activeCall = attachLiveCall(sessionId, {
        direction: "outbound",
        audioTestOnly,
    });

    if (stopRequested) {
        await activeCall.hangup();
    }
    const outcome = await activeCall.done;
    if (!outcome.finalUsageConfirmed) process.exitCode = 1;
}

process.on("SIGINT", () => {
    stopRequested = true;

    if (activeCall) {
        void activeCall.hangup();
    } else {
        console.log(
            "Chiusura richiesta: attendo l'ID della chiamata."
        );
    }
});

createCall().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});
