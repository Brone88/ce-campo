const END_CALL_REASONS = [
    "test_completed",
    "user_requested",
];

const endCallTool = {
    type: "function",
    name: "end_call",
    description:
        "Programma la fine della chiamata dopo il saluto, " +
        "quando il test è concluso o la persona vuole terminare.",
    strict: true,
    parameters: {
        type: "object",
        properties: {
            reason: {
                type: "string",
                enum: END_CALL_REASONS,
            },
        },
        required: ["reason"],
        additionalProperties: false,
    },
};

module.exports = { endCallTool, END_CALL_REASONS };
