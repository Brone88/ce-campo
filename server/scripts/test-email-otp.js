const {
    generateOtp,
    saveOtp,
    verifyOtp,
} = require("../services/emailOtp");

const email = "test@example.com";

const code = generateOtp();

console.log("OTP generato:", code);

saveOtp(email, code);

console.log("Codice errato:", verifyOtp(email, "999999"));
console.log("Codice corretto:", verifyOtp(email, code));
console.log("Codice riutilizzato:", verifyOtp(email, code));