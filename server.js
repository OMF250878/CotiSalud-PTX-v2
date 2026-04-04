const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const UPSTREAM = process.env.UPSTREAM_WEBHOOK;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/cotizar", async (req, res) => {
  if (!UPSTREAM) return res.status(500).json({ error: "UPSTREAM_WEBHOOK no esta configurada" });
  try {
    const r = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status);
    res.set("Content-Type", r.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: "Error proxy", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
