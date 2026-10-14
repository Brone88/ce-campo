require("dotenv").config();

const { sendEmail } = require("../services/email");

async function main() {
    const result = await sendEmail({
        to: process.env.TEST_EMAIL_ADDRESS,
        subject: "Digital Mop - Test Resend",
        html: `
            <h1>Ciao da Digital Mop!</h1>
            <p>Il servizio email funziona correttamente.</p>
        `,
    });

    console.log("Email inviata:", result);
}

main().catch(console.error);