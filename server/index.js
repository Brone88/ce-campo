const http = require("http");
const express = require('express');
const crypto = require("crypto");

require("dotenv").config();

const app = express();
const pendingSpidVerifications = new Map();
const completedSpidVerifications = new Map();

/*
 * SPID reverse proxy.
 *
 * Essendo montato su /spid, Express rimuove automaticamente
 * il prefisso prima di arrivare qui:
 *
 * /spid/login  -> /login
 * /spid/acs    -> /acs
 */
app.use("/spid", (req, res) => {
    const proxyReq = http.request(
        {
            hostname: "spid-express-app",
            port: 3000,
            path: req.url,
            method: req.method,
            headers: {
                ...req.headers,
                host: "spid-express-app:3000",
                "x-forwarded-host": req.headers.host,
                "x-forwarded-proto": "https",
            },
        },
        (proxyRes) => {
            res.writeHead(
                proxyRes.statusCode || 502,
                proxyRes.headers
            );

            proxyRes.pipe(res);
        }
    );

    proxyReq.on("error", (error) => {
        console.error("SPID proxy error:", error);

        if (!res.headersSent) {
            res.status(502).json({
                error: "SPID service unavailable",
            });
        }
    });

    req.pipe(proxyReq);
});

app.use(
    "/webhooks/openai-live",
    express.text({ type: "application/json" }),
    require("./routes/openai-live")
);
app.use(
    "/webhooks/telnyx-whatsapp",
    express.raw({ type: "application/json" }),
    require("./routes/telnyx-whatsapp")
);

app.use(express.json());

app.use("/webhooks/telegram", require("./routes/telegram"));
app.use(
    "/demo/telegram",
    require("./routes/demo-telegram")
);

app.use("/auth/email", require("./routes/email"));
app.use("/demo/whatsapp", require("./routes/demo-whatsapp"));
app.get("/identity/spid/start", (req, res) => {
    const token = crypto.randomBytes(32).toString("hex");

    pendingSpidVerifications.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
    });

    res.setHeader(
        "Set-Cookie",
        `spid_pending=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    );

    res.redirect(
        "/spid/login?entityID=xx_testenv2"
    );
});
app.post("/internal/identity/spid", (req, res) => {
    if (
        !process.env.SPID_INTERNAL_SECRET ||
        req.headers["x-spid-internal-secret"] !==
        process.env.SPID_INTERNAL_SECRET
    ) {
        return res.sendStatus(401);
    }

    const {
        resultToken,
        name,
        familyName,
        fiscalNumber,
    } = req.body;

    completedSpidVerifications.set(resultToken, {
        name,
        familyName,
        fiscalNumber,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
    });

    res.json({ ok: true });
});

app.get("/identity/spid/complete", (req, res) => {
    const cookies = Object.fromEntries(
        (req.headers.cookie || "")
            .split(";")
            .map(cookie => cookie.trim())
            .filter(Boolean)
            .map(cookie => {
                const index = cookie.indexOf("=");

                return [
                    cookie.slice(0, index),
                    decodeURIComponent(cookie.slice(index + 1)),
                ];
            })
    );

    const pendingToken = cookies.spid_pending;
    const resultToken = req.query.result;

    if (!pendingToken || !resultToken) {
        return res.status(400).json({
            error: "Missing SPID verification tokens",
        });
    }

    const pending = pendingSpidVerifications.get(pendingToken);
    const verified = completedSpidVerifications.get(resultToken);

    if (!pending || !verified) {
        return res.status(400).json({
            error: "Invalid SPID verification",
        });
    }

    const now = Date.now();

    if (
        pending.expiresAt < now ||
        verified.expiresAt < now
    ) {
        pendingSpidVerifications.delete(pendingToken);
        completedSpidVerifications.delete(resultToken);

        return res.status(400).json({
            error: "SPID verification expired",
        });
    }

    const identityKey = crypto
        .createHmac(
            "sha256",
            process.env.SPID_IDENTITY_SECRET
        )
        .update(verified.fiscalNumber)
        .digest("hex");

    // Entrambi sono monouso.
    pendingSpidVerifications.delete(pendingToken);
    completedSpidVerifications.delete(resultToken);

    // Eliminiamo anche il cookie dal browser.
    res.setHeader(
        "Set-Cookie",
        "spid_pending=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );

    console.log("=== SPID VERIFICATION COMPLETED ===");
    console.log({
        identityKey,
        name: verified.name,
        familyName: verified.familyName,
    });

    res.json({
        verified: true,
        provider: "spid",
        name: verified.name,
        familyName: verified.familyName,
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

module.exports = app;
