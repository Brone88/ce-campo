require("dotenv").config();
const OpenAI = require("openai");

const { OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
    console.error("Missing env variable: OPENAI_API_KEY");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_DELEGATION_MODEL || "gpt-6-luna";
const MAX_TOOL_ROUNDS = 8;

const INSTRUCTIONS = `
Sei l'assistente di un servizio per la prenotazione di campi sportivi.

Questa è una demo.

Rispondi in italiano, in modo breve e naturale.
Interpreta ciò che vuole l'utente e porta avanti la conversazione
facendo una domanda utile per arrivare a una prenotazione.

Per ora NON puoi realmente verificare disponibilità e NON puoi
confermare prenotazioni.
`.trim();

// definition: schema inviato al modello; execute: effetto locale.
// Il registro parte vuoto: i provider non eseguono tool di canale.
const tools = [];

const conversationsById = new Map();
const tailsById = new Map();

function enqueue(conversationId, task) {
    const previous = tailsById.get(conversationId) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(task);
    const settled = current.then(() => {}, () => {});
    tailsById.set(conversationId, settled);
    settled.then(() => {
        if (tailsById.get(conversationId) === settled) {
            tailsById.delete(conversationId);
        }
    });
    return current;
}

function toolDefinitions() {
    return tools.map((tool) => tool.definition);
}

async function executeTool(name, args, context) {
    const tool = tools.find((entry) => entry.definition.name === name);
    if (!tool) {
        return { status: "error", message: `Unknown tool: ${name}` };
    }
    return tool.execute(args, context);
}

async function toolOutput(call, context) {
    try {
        const args = call.arguments ? JSON.parse(call.arguments) : {};
        return await executeTool(call.name, args, context);
    } catch (error) {
        return { status: "error", message: error.message };
    }
}

async function ensureConversation({ channel, userId, conversationId }) {
    const existing = conversationsById.get(conversationId);
    if (existing) return existing;

    const conversation = await openai.conversations.create({
        metadata: {
            channel,
            userId,
            conversationId,
        },
    });

    conversationsById.set(conversationId, conversation.id);
    console.log(`Nuova conversation ${conversation.id} per ${conversationId}`);
    return conversation.id;
}

async function createResponse(openaiConversationId, input) {
    const request = {
        model: MODEL,
        instructions: INSTRUCTIONS,
        conversation: openaiConversationId,
        input,
    };

    const definitions = toolDefinitions();
    if (definitions.length > 0) {
        request.tools = definitions;
        request.tool_choice = "auto";
        request.parallel_tool_calls = false;
    }

    return openai.responses.create(request);
}

async function completeTurn(openaiConversationId, input, context) {
    let response = await createResponse(openaiConversationId, input);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const calls = (response.output ?? []).filter((item) => item.type === "function_call");
        if (calls.length === 0) {
            return { text: response.output_text ?? "" };
        }

        const outputs = [];
        for (const call of calls) {
            const output = await toolOutput(call, context);
            outputs.push({
                type: "function_call_output",
                call_id: call.call_id,
                output: JSON.stringify(output),
            });
        }

        response = await createResponse(openaiConversationId, outputs);
    }

    throw new Error(`Tool loop exceeded ${MAX_TOOL_ROUNDS} rounds`);
}

async function handleTurn({ channel, userId, conversationId, text }) {
    const openaiConversationId = await ensureConversation({
        channel,
        userId,
        conversationId,
    });

    return completeTurn(
        openaiConversationId,
        [{ role: "user", content: text }],
        { channel, userId, conversationId },
    );
}

function handle({ channel, userId, conversationId, text }) {
    return enqueue(conversationId, () => handleTurn({
        channel,
        userId,
        conversationId,
        text,
    }));
}

module.exports = { handle };
