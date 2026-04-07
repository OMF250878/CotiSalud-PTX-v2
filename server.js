const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_COTIZAR = process.env.UPSTREAM_WEBHOOK;
const WEBHOOK_EMAIL   = process.env.UPSTREAM_WEBHOOK_EMAIL;

// ── Body parser ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Estáticos ────────────────────────────────────────────────
app.use(express.static(__dirname));

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 20,               // máx 20 requests por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' }
});
app.use('/api/', limiter);

// ── Healthcheck ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Proxy: cotización ────────────────────────────────────────
app.post('/api/cotizar', async (req, res) => {
  if (!WEBHOOK_COTIZAR) return res.status(500).json({ error: 'UPSTREAM_WEBHOOK no configurado' });
  try {
    const r = await fetch(WEBHOOK_COTIZAR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    res.status(502).json({ error: 'Error proxy cotizar', detail: String(err) });
  }
});

// ── Proxy: email ─────────────────────────────────────────────
app.post('/api/email', async (req, res) => {
  if (!WEBHOOK_EMAIL) return res.status(500).json({ error: 'UPSTREAM_WEBHOOK_EMAIL no configurado' });
  try {
    const r = await fetch(WEBHOOK_EMAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    res.status(502).json({ error: 'Error proxy email', detail: String(err) });
  }
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
