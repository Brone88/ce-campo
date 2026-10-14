
require("dotenv").config();

const {
    TELNYX_API_KEY,
    TELNYX_VERIFY_PROFILE_ID,
    TEST_PHONE_NUMBER,
} = process.env;

const required = {
    TELNYX_API_KEY,
    TELNYX_VERIFY_PROFILE_ID,
    TEST_PHONE_NUMBER,
};

for (const [key, value] of Object.entries(required)) {
    if (!value) {
        console.error(`Missing env variable: ${key}`);
        process.exit(1);
    }
}

const BASE_URL = "https://api.telnyx.com/v2";

async function telnyxRequest(path, body) {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${TELNYX_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(JSON.stringify(result, null, 2));
    }

    return result;
}

async function main() {
    const [action, code] = process.argv.slice(2);
    const phone = TEST_PHONE_NUMBER;

    if (!["send", "verify"].includes(action) || !/^\+39\d{9,10}$/.test(phone)) {
        console.error("Uso: npm run test-otp");
        console.error("     npm run test-otp-verify -- 123456");
        console.error("Il numero arriva da TEST_PHONE_NUMBER nel .env");
        process.exit(1);
    }

    if (action === "send") {
        const payload = {
            phone_number: phone,
            verify_profile_id: process.env.TELNYX_VERIFY_PROFILE_ID.trim(),
        };

        console.log("Request:", payload);

        const result = await telnyxRequest(
            "/verifications/sms",
            payload
        );

        console.log("Response:", JSON.stringify(result, null, 2));
    } else {
        if (!/^\d{4,8}$/.test(code || "")) {
            throw new Error("Codice OTP non valido");
        }

        const result = await telnyxRequest(
            `/verifications/by_phone_number/${encodeURIComponent(phone)}/actions/verify`,
            {
                code,
                verify_profile_id: TELNYX_VERIFY_PROFILE_ID,
            }
        );

        console.log("Verifica:", result.data?.response_code);
    }
}

main().catch((error) => {
    console.error("Errore Telnyx:", error.message);
    process.exitCode = 1;
});
