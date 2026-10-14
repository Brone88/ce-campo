require("dotenv").config();
const { classifyOpening } = require("../services/live-call-screening");
const cases = [
    { name: "segreteria operatore", text: "Il cliente da lei chiamato non è al momento raggiungibile. Lasci un messaggio dopo il segnale acustico.", expected: "machine" },
    { name: "segreteria personale", text: "Ciao, sono Marco. Non posso rispondere adesso, lascia nome e numero dopo il bip e ti richiamerò.", expected: "machine" },
    { name: "persona presente", text: "Pronto, sono Luca. Chi parla? Sto aspettando la vostra chiamata per la prova audio.", expected: "human" },
    { name: "persona che cita la segreteria", text: "Prima partiva la segreteria, adesso ho risposto io. Sono Marco, dimmi pure.", expected: "human" },
    { name: "frammento ambiguo", text: "Il cliente", expected: "unknown" },
    { name: "filtro chiamate", text: "Indica il tuo nome e il motivo della chiamata, verificherò se la persona è disponibile.", expected: "unknown" },
];
async function main() {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
    let passed = 0;
    for (const item of cases) {
        const result = await classifyOpening(item.text, { signal: AbortSignal.timeout(15000) });
        const ok = result.kind === item.expected && (result.kind === "unknown" || result.certainty === "high");
        passed += Number(ok);
        console.log(JSON.stringify({ case: item.name, expected: item.expected, ...result, passed: ok }));
    }
    console.log(`Screening: ${passed}/${cases.length}. Esempi testuali sintetici, non accuratezza su audio reale.`);
    if (passed !== cases.length) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
