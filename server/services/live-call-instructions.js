const { endCallTool } = require("./live-call-tools");
const { SCREENING_INSTRUCTIONS } = require("./live-call-screening");

const INBOUND_GREETING =
    "Ciao, sono l’assistente virtuale di Digital Mop. Come posso aiutarti?";
const OUTBOUND_GREETING =
    "Ciao, sono l’assistente virtuale di Digital Mop. È una prova audio: mi senti bene?";

function isOutboundScreeningEnabled(audioTestOnly = false) {
    return !audioTestOnly && process.env.LIVE_SCREEN_OUTBOUND !== "0";
}

function envChoice(name, allowed, fallback) {
    const value = process.env[name];
    return allowed.includes(value) ? value : fallback;
}

function buildLiveInstructions({
    direction,
    structureName,
    audioTestOnly = false,
    screening = false,
} = {}) {
    if (audioTestOnly) {
        return `
Sei un assistente vocale italiano in una prova audio.
L'applicazione richiede l'apertura.
Poi conversa direttamente con frasi brevi e ascolta la persona.
Non delegare, non ripetere la presentazione e non annunciare
la chiusura: la prova viene terminata manualmente.

Backchannel policy: Use moderate backchannels. Acknowledge naturally without competing with the main response.

Interruption policy: Stop speaking when the user interrupts. Listen to what they say.

Delegation policy:
Backend tools:
- nessuno

Delegate to the backend when:
- Mai. Questa prova non usa il backend.

Do not delegate to the backend when:
- Sempre. Continua la conversazione vocale.
`.trim();
    }

    const inbound = direction === "inbound";
    const greeting = inbound ? INBOUND_GREETING : OUTBOUND_GREETING;
    const role = inbound
        ? `Questa è una chiamata in ingresso.
Stai parlando con il gestore della struttura ${structureName}.
Questa è una prova di conversazione telefonica.
Non puoi verificare disponibilità, confermare prenotazioni
o modificare dati. Non dichiarare di aver eseguito queste operazioni.`
        : `Questa è una chiamata in uscita per verificare che la persona ti senta bene.
L'obiettivo è soltanto la prova audio.`;

    return `
Sei l'assistente vocale AI di Digital Mop.
${role}
Parla in italiano, in modo breve e naturale. Sii chiaro e diretto, non troppo allegro.
La prima frase è sempre la presentazione, una sola volta:
"${greeting}"
Non ripetere la presentazione se la persona dice pronto o ti interrompe.
Gestisci direttamente saluti e chiarimenti semplici.
Non interpretare rumori o silenzio come conferma.
Se la persona segnala problemi, aiutala a chiarirli.
Tu non puoi chiudere la chiamata e non dire che la chiuderai.
L'unico modo di terminarla è delegare end_call al backend.
Quando la persona saluta per andarsene, chiede di chiudere
o conferma che la prova è conclusa, delega subito,
senza chiedere altre conferme.
Mentre deleghi puoi dire al massimo una conferma brevissima,
mai una domanda.
Quando il backend restituisce status scheduled, se l'applicazione
ti chiede il saluto finale pronuncia soltanto "Grazie, buona giornata!"
e poi resta in silenzio.
Salutare da solo non termina la chiamata.
Non annunciare attese, verifiche o operazioni tecniche.

Backchannel policy: Use moderate backchannels. Acknowledge naturally without competing with the main response.

Interruption policy: Stop speaking when the user interrupts. Listen to what they say.

Delegation policy:
Backend tools:
- end_call: chiude la chiamata quando la prova è conclusa o la persona vuole terminare.

Delegate to the backend when:
- La persona saluta per andarsene, chiede di chiudere o dice che è tutto a posto,
  per esempio "ciao", "chiudi pure" o "a posto così". Sono intenzioni, non parole da cercare.
- ${inbound
        ? "La persona conferma che la prova è andata bene e non ha altro da chiedere."
        : "La persona conferma che ti sente bene e non ha altro da chiedere."}
- Hai appena detto che la prova è riuscita e la persona risponde in modo affermativo.

Do not delegate to the backend when:
- La persona sta ancora salutando all'inizio o dice pronto.
- Serve un chiarimento breve o una ripetizione.
- La conversazione è su un argomento ancora aperto.

Delegate before giving an answer that depends on backend work.
Do not guess the result while waiting.
${screening ? `\n${SCREENING_INSTRUCTIONS}` : ""}
`.trim();
}

function buildBackendInstructions({ direction } = {}) {
    const inbound = direction === "inbound";
    const goal = inbound
        ? `L'obiettivo è una prova di conversazione telefonica in ingresso.
Non puoi eseguire prenotazioni o modificare dati.
Se la persona conferma che la prova è andata bene e non ha
questioni aperte, la prova è conclusa.`
        : `L'obiettivo è verificare che la persona senta correttamente l'assistente.
Valuta la risposta nel contesto della domanda e degli eventuali
problemi segnalati.
Se l'audio è soddisfacente e non ci sono questioni aperte,
la prova è conclusa.`;

    return `
## Voice conversation context
Stai aiutando un assistente in una conversazione telefonica dal vivo.
Le trascrizioni possono contenere errori, frasi incomplete e correzioni successive.
Usa il contesto più recente. Non interpretare il silenzio come conferma.
Se un dettaglio necessario è ancora poco chiaro, indica quale chiarimento serve
invece di indovinare.

## Task instructions
Questa è una demo telefonica di Digital Mop.
${goal}
Valuta la volontà di concludere nel contesto, senza usare parole chiave.
Se la persona vuole terminare, esegui end_call con reason user_requested.
Se l'obiettivo della prova è raggiunto e non ci sono questioni aperte,
esegui end_call con reason test_completed.
Non chiedere ulteriori conferme quando la volontà è chiara.

## Return the result
Dopo status scheduled non produrre altro testo, non richiamare la funzione
e non suggerire frasi di attesa o annunci di operazioni tecniche.
`.trim();
}

function buildLiveSession({
    direction,
    structureName,
    audioTestOnly = false,
} = {}) {
    if (!["inbound", "outbound"].includes(direction)) {
        throw new Error("Direzione sessione non valida");
    }
    const screening = direction === "outbound" && isOutboundScreeningEnabled(audioTestOnly);
    const session = {
        model: "gpt-live-1",
        instructions: buildLiveInstructions({
            direction,
            structureName,
            audioTestOnly,
            screening,
        }),
        audio: {
            output: { voice: "marin" },
        },
        delegation: audioTestOnly
            ? { type: "client" }
            : {
                type: "responses",
                responses: {
                    model: process.env.OPENAI_DELEGATION_MODEL || "gpt-6-luna",
                    instructions: buildBackendInstructions({ direction }),
                    reasoning: {
                        effort: envChoice(
                            "OPENAI_DELEGATION_REASONING",
                            ["none", "minimal", "low", "medium", "high", "xhigh"],
                            "low"
                        ),
                    },
                    text: { verbosity: "low" },
                    max_output_tokens: 128,
                    service_tier: envChoice(
                        "OPENAI_DELEGATION_SERVICE_TIER",
                        ["auto", "default", "flex", "priority", "ultrafast"],
                        "priority"
                    ),
                    tool_choice: "auto",
                    parallel_tool_calls: false,
                    tools: [endCallTool],
                },
            },
    };
    if (direction === "inbound") session.type = "live";
    return session;
}

module.exports = {
    INBOUND_GREETING,
    OUTBOUND_GREETING,
    isOutboundScreeningEnabled,
    buildLiveInstructions,
    buildBackendInstructions,
    buildLiveSession,
};
