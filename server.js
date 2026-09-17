const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
    console.error("ERROR: BACKEND_URL environment variable is not configured.");
    process.exit(1);
}

app.use(express.json({ limit: "1mb" }));

// Serve frontend files
app.use(express.static(__dirname));

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "AuraOS Frontend"
    });
});

// Proxy chat request to AWS backend
app.post("/api/chat", async (req, res) => {

    try {

        console.log("Forwarding request to:", `${BACKEND_URL}/chat`);

        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {

            const data = await response.json();

            return res.status(response.status).json(data);

        } else {

            const text = await response.text();

            return res.status(response.status).send(text);
        }

    } catch (error) {

        console.error("Backend request failed:", error);

        return res.status(502).json({
            error: "Unable to connect to AuraOS backend"
        });
    }
});

// Make sure index.html is returned for the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {

    console.log(`AuraOS frontend running on port ${PORT}`);

    console.log(
        `Backend configured: ${BACKEND_URL}`
    );

});