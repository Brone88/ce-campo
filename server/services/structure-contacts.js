const fs = require("node:fs/promises");
const path = require("node:path");

const contactsFile = path.join(
    __dirname,
    "../config/structure-contacts.json"
);

function normalizePhone(value) {
    if (typeof value !== "string") return null;

    const phone = value.trim().replace(/[\s().-]/g, "");

    // Prefisso internazionale obbligatorio, senza indovinare il paese.
    return /^\+[1-9]\d{6,14}$/.test(phone) ? phone : null;
}

async function findStructureByPhone(phoneNumber) {
    const phone = normalizePhone(phoneNumber);

    if (!phone) return null;

    const content = await fs.readFile(contactsFile, "utf8");
    const data = JSON.parse(content);

    if (!Array.isArray(data.contacts)) {
        throw new Error("La whitelist deve contenere un array contacts");
    }

    const matches = data.contacts.filter(contact =>
        contact.inboundEnabled === true &&
        normalizePhone(contact.phoneNumber) === phone
    );

    if (matches.length > 1) {
        throw new Error("Numero associato a più contatti abilitati");
    }

    return matches[0] || null;
}

module.exports = { findStructureByPhone };