
const {
    TELNYX_API_KEY,
    TELNYX_CALLER_NUMBER,
    TELNYX_WHATSAPP_MESSAGING_PROFILE_ID,
} = process.env;

async function sendWhatsAppMessage(to, text) {
    if (
        !TELNYX_API_KEY ||
        !TELNYX_CALLER_NUMBER ||
        !TELNYX_WHATSAPP_MESSAGING_PROFILE_ID
    ) {
        throw new Error("Missing Telnyx WhatsApp configuration");
    }

    const response = await fetch(
        "https://api.telnyx.com/v2/messages/whatsapp",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${TELNYX_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: TELNYX_CALLER_NUMBER,
                to,
                type: "WHATSAPP",
                messaging_profile_id:
                    TELNYX_WHATSAPP_MESSAGING_PROFILE_ID,
                whatsapp_message: {
                    type: "text",
                    text: {
                        body: text,
                        preview_url: false,
                    },
                },
            }),
            signal: AbortSignal.timeout(15000),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        const error = data.errors?.[0];

        throw new Error(
            `Telnyx WhatsApp ${response.status}: ` +
            `${error?.code || "unknown"} - ` +
            `${error?.title || "Request failed"}`
        );
    }

    return {
        messageId: data.data?.id,
        status: data.data?.to?.[0]?.status,
    };
}

module.exports = { sendWhatsAppMessage };
