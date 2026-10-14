const WebSocket = require("ws");
const { randomUUID } = require("node:crypto");
const { END_CALL_REASONS } = require("./live-call-tools");
const { createOpeningScreening } = require("./live-call-screening");
const {
    INBOUND_GREETING,
    OUTBOUND_GREETING,
} = require("./live-call-instructions");

const activeSessions = new Map();
const GREETING_FALLBACK_MS = 1500;
const FAREWELL_GRACE_MS = 2000;
const FAREWELL_LIMIT_MS = 8000;

function milliseconds(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value >= 1000 ? value : fallback;
}

function attachLiveCall(sessionId, { direction = "inbound", audioTestOnly = false } = {}) {
    if (!sessionId || !["inbound", "outbound"].includes(direction)) {
        throw new Error("Sessione o direzione non valida");
    }
    if (activeSessions.has(sessionId)) return activeSessions.get(sessionId);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
    const trace = process.env.LIVE_TRACE_EVENTS === "1";
    const logInput = process.env.LIVE_LOG_INPUT_TRANSCRIPTS === "1";
    const logOutput = process.env.LIVE_LOG_OUTPUT_TRANSCRIPTS === "1";
    const stallMs = milliseconds("LIVE_STALL_TIMEOUT_MS", 30000);
    const startedAt = Date.now();
    let answeredAt, firstInputAt, firstOutputAt, lastInputAt, lastOutputAt, endCallAt, pingAt;
    let greetingSent = false, closed = false, disposed = false;
    let endCallRequested = false, hangupInFlight = false, hangupAttempts = 0;
    let hangupReason;
    let ws, resolveDone;
    const done = new Promise(resolve => { resolveDone = resolve; });
    const timers = new Map();
    const sentInstructions = new Map();
    const handledCalls = new Set();
    const delegations = new Map();
    const controller = { hangup, done };
    const screenOutbound = direction === "outbound" && !audioTestOnly
        && process.env.LIVE_SCREEN_OUTBOUND !== "0";
    const screening = createOpeningScreening({
        schedule: later, cancel: clear, log,
        idleMs: milliseconds("LIVE_SCREEN_IDLE_MS", 1000),
        windowMs: milliseconds("LIVE_SCREEN_WINDOW_MS", 12000),
        onDecision: kind => {
            if (endCallRequested || disposed || closed) return;
            if (kind === "machine") void hangup("voicemail_detected");
            else greetOnce();
        },
    });
    activeSessions.set(sessionId, controller);

    function log(event, fields = {}) {
        console.log(JSON.stringify({ at: new Date().toISOString(), sessionId,
            direction, elapsedMs: Date.now() - startedAt,
            answeredMs: answeredAt == null ? null : Date.now() - answeredAt,
            event, ...fields }));
    }
    function clear(name) {
        if (timers.has(name)) clearTimeout(timers.get(name));
        timers.delete(name);
    }
    function later(name, delay, fn) {
        clear(name);
        timers.set(name, setTimeout(() => {
            timers.delete(name);
            if (!disposed && !closed) fn();
        }, delay));
    }
    function finish(result) {
        if (disposed) return;
        screening.stop();
        disposed = true;
        for (const name of timers.keys()) clear(name);
        activeSessions.delete(sessionId);
        resolveDone(result);
    }
    function safeSend(event) {
        if (closed || disposed || ws?.readyState !== WebSocket.OPEN) return false;
        try {
            ws.send(JSON.stringify(event), error => {
                if (error) {
                    log("ws.send_failed", { code: error.code });
                    void hangup("sideband_send_failed");
                }
            });
            return true;
        } catch (error) {
            log("ws.send_failed", { code: error.code });
            void hangup("sideband_send_failed");
            return false;
        }
    }
    function appendInstruction(content, label, delegationId = null) {
        const id = `${label}_${randomUUID()}`;
        sentInstructions.set(id, Date.now());
        log("instruction.sent", { label, eventId: id });
        return safeSend({ type: "session.instructions.append", event_id: id,
            delegation_id: delegationId, content });
    }
    function armStall(context) {
        later("stall", stallMs, () => {
            log("conversation.stalled", { context, timeoutMs: stallMs });
            void hangup("conversation_stalled");
        });
    }
    function speakingRecently() {
        return lastOutputAt != null && Date.now() - lastOutputAt < FAREWELL_GRACE_MS;
    }
    function greetOnce() {
        if (greetingSent || endCallRequested || hangupInFlight) return;
        greetingSent = true;
        answeredAt ??= Date.now();
        if (firstOutputAt != null) {
            log("greeting.skipped", { reason: "already_speaking" });
            armStall("opening_already_spoken");
            return;
        }
        const opening = direction === "inbound" ? INBOUND_GREETING : OUTBOUND_GREETING;
        appendInstruction((screenOutbound ? "Lo screening iniziale è terminato. L'applicazione autorizza " +
            "ora l'apertura e la normale conversazione. Un esito incerto non prova una segreteria. " : "") +
            `La chiamata è stata risposta. Di': "${opening}" Parla ora in italiano, ` +
            "una sola volta, poi ascolta. Se senti pronto o vieni interrotto, " +
            "non ricominciare la presentazione. Il saluto non richiede delega.", "greeting");
        pingAt = Date.now();
        try { ws.ping(); } catch { void hangup("sideband_ping_failed"); }
        armStall("opening_without_output");
    }
    function toolResult(item, output, continueResponse = true) {
        const sent = safeSend({ type: "response.item.create", event_id: `tool_result_${item.call_id}`,
            item: { type: "function_call_output", call_id: item.call_id, output: JSON.stringify(output) } });
        if (sent && continueResponse) safeSend({ type: "response.create", event_id: `continue_${item.call_id}` });
    }
    function handleResponseEvent(envelope) {
        const event = envelope.event;
        if (!event) return;
        if (event.type === "response.created") {
            log(event.type, { delegationId: envelope.delegation_id });
        }
        if (["response.completed", "response.failed", "response.incomplete", "response.cancelled"].includes(event.type)) {
            const start = delegations.get(envelope.delegation_id);
            log(event.type, { delegationId: envelope.delegation_id,
                durationMs: start == null ? null : Date.now() - start, errorCode: event.response?.error?.code });
            delegations.delete(envelope.delegation_id);
        }
        const item = event.item;
        if (event.type !== "response.output_item.done" || item?.type !== "function_call" ||
            !item.call_id || handledCalls.has(item.call_id)) return;
        handledCalls.add(item.call_id);
        let args;
        try {
            args = JSON.parse(item.arguments);
            if (item.name !== "end_call" || !END_CALL_REASONS.includes(args?.reason)) {
                throw new Error("Unsupported function or reason");
            }
        } catch {
            toolResult(item, { status: "error", message: "Unsupported function or reason" }, false);
            return;
        }
        if (endCallRequested) {
            toolResult(item, { status: "already_scheduled" }, false);
            return;
        }
        if (screenOutbound && screening.pending) {
            toolResult(item, { status: "blocked", message: "Lo screening separato decide il riconoscimento " +
                "della segreteria. Durante lo screening non chiudere né parlare." }, false);
            log("screening.delegated_close_blocked", { reason: args.reason });
            return;
        }
        endCallRequested = true;
        endCallAt = Date.now();
        clear("stall"); clear("greeting_fallback");
        log("end_call.requested", { reason: args.reason, speaking: speakingRecently() });
        if (speakingRecently()) {
            log("closing.skipped", { reason: "already_speaking" });
            later("farewell", FAREWELL_GRACE_MS, () => void hangup("farewell_complete"));
        } else {
            appendInstruction('La chiusura è approvata. Pronuncia soltanto "Grazie, buona giornata!" ' +
                "e resta in silenzio. Non fare domande e non annunciare attese o verifiche.", "closing");
        }
        toolResult(item, { status: "scheduled" }, false);
        later("farewell_limit", FAREWELL_LIMIT_MS, () => void hangup("farewell_limit"));
    }
    async function hangup(reason = "operator_requested") {
        if (closed || disposed || hangupInFlight) return;
        hangupInFlight = true;
        screening.stop();
        endCallRequested = true;
        hangupReason ??= reason;
        for (const key of ["stall", "greeting_fallback", "farewell", "farewell_limit", "retry"]) clear(key);
        hangupAttempts++;
        log("hangup.requested", {
            reason: hangupReason,
            attempt: hangupAttempts,
            endCallToHangupMs: endCallAt == null ? null : Date.now() - endCallAt,
        });
        try {
            const response = await fetch(`https://api.openai.com/v1/live/sessions/${encodeURIComponent(sessionId)}/hangup`, {
                method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            log("hangup.accepted");
            if (!closed && !disposed) later("finalization", 30000, () => {
                log("session.finalization_incomplete");
                finish({ finalUsageConfirmed: false, reason: hangupReason });
                ws?.terminate();
            });
        } catch (error) {
            hangupInFlight = false;
            if (closed || disposed) return;
            log("hangup.failed", { message: error.message });
            if (hangupAttempts < 3) later("retry", 1000 * hangupAttempts, () => void hangup(hangupReason));
            else {
                log("hangup.unconfirmed", { action: "Verificare la chiamata nel provider" });
                finish({ finalUsageConfirmed: false, hangupFailed: true });
                ws?.terminate();
            }
        }
    }
    try {
        ws = new WebSocket(`wss://api.openai.com/v1/live/sessions/${encodeURIComponent(sessionId)}/attach`, {
            headers: { Authorization: `Bearer ${apiKey}` }, handshakeTimeout: 10000,
        });
    } catch (error) {
        log("ws.construct_failed", { code: error.code });
        void hangup("sideband_unavailable");
        return controller;
    }
    ws.on("open", () => {
        log("sideband.connected");
        if (direction === "inbound") later("greeting_fallback", GREETING_FALLBACK_MS, greetOnce);
    });
    ws.on("pong", () => log("ws.pong", { roundTripMs: pingAt == null ? null : Date.now() - pingAt }));
    ws.on("message", buffer => {
        let event;
        try { event = JSON.parse(buffer.toString()); } catch { log("event.invalid_json"); return; }
        if (disposed) return;
        switch (event.type) {
            case "transport.ringing": log(event.type); break;
            case "transport.answered":
                answeredAt ??= Date.now();
                log(event.type);
                if (direction === "outbound") {
                    if (screenOutbound) screening.start();
                    else greetOnce();
                }
                break;
            case "session.instructions.appended": {
                const sent = sentInstructions.get(event.client_event_id);
                log(event.type, { eventId: event.client_event_id, ackMs: sent == null ? null : Date.now() - sent });
                sentInstructions.delete(event.client_event_id);
                break;
            }
            case "session.input_transcript.delta":
                if (firstInputAt == null) { firstInputAt = Date.now(); log("input.first_transcript"); }
                lastInputAt = Date.now();
                if (logInput) log("input.transcript", { text: event.delta });
                if (!endCallRequested) {
                    if (direction === "inbound") clear("greeting_fallback");
                    if (screenOutbound && screening.pending) {
                        screening.input(event.delta);
                        break;
                    }
                    armStall("input_without_output");
                }
                break;
            case "session.output_transcript.delta":
                lastOutputAt = Date.now();
                if (firstOutputAt == null) {
                    firstOutputAt = lastOutputAt;
                    log("output.first_transcript", {
                        openingMs: answeredAt == null ? null : firstOutputAt - answeredAt,
                    });
                }
                if (logOutput) log("output.transcript", { text: event.delta });
                if (endCallRequested && !hangupInFlight) {
                    later("farewell", FAREWELL_GRACE_MS, () => void hangup("farewell_complete"));
                } else if (!endCallRequested) {
                    armStall("output_without_followup");
                }
                break;
            case "session.delegation.created": {
                const id = event.delegation?.id || event.delegation_id;
                delegations.set(id, Date.now());
                if (!endCallRequested) armStall("delegation_without_output");
                log(event.type, {
                    delegationId: id,
                    target: event.target || event.delegation?.target,
                    waitMs: lastInputAt == null ? null : Date.now() - lastInputAt,
                });
                if (audioTestOnly) {
                    appendInstruction(
                        "Prova solo audio: continua direttamente la conversazione vocale.",
                        "audio_test",
                        id
                    );
                }
                break;
            }
            case "response.event": handleResponseEvent(event); break;
            case "session.usage.updated": log(event.type, { usage: event.usage }); break;
            case "session.closed":
                closed = true;
                log(event.type, { reason: event.reason || event.close_reason, requestedReason: hangupReason,
                    usage: event.usage, finalUsageConfirmed: Boolean(event.usage) });
                finish({ finalUsageConfirmed: Boolean(event.usage), usage: event.usage, reason: event.reason || event.close_reason });
                ws.close();
                break;
            case "transport.failed":
                log(event.type, { code: event.error?.code });
                void hangup("transport_failed");
                break;
            case "error": log("live.error", { code: event.error?.code || event.code, eventId: event.event_id }); break;
            default:
                if (trace) log("live.event", { type: event.type });
        }
    });
    ws.on("error", error => {
        log("sideband.error", { code: error.code });
        if (!closed && !disposed) void hangup("sideband_error");
    });
    ws.on("close", (code) => {
        log("sideband.disconnected", { code, finalUsageConfirmed: closed });
        if (!closed && !disposed) {
            log("session.finalization_incomplete");
            void hangup("sideband_lost");
        }
    });
    return controller;
}
module.exports = { attachLiveCall };
