require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const connectDB  = require('./config/db');

const authRoutes   = require('./routes/auth');
const elevesRoutes = require('./routes/eleves');
const notesRoutes  = require('./routes/notes');
const profsRoutes  = require('./routes/professeurs');
const absRoutes    = require('./routes/absences');
const edtRoutes    = require('./routes/emploiDuTemps');
const dashRoutes   = require('./routes/dashboard');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Sécurité ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// ── Parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Statique frontend ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Logging dev ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes API ────────────────────────────────────────────────
app.use('/api',                  authRoutes);
app.use('/api/eleves',           elevesRoutes);
app.use('/api/notes',            notesRoutes);
app.use('/api/professeurs',      profsRoutes);
app.use('/api/absences',         absRoutes);
app.use('/api/emploi-du-temps',  edtRoutes);
app.use('/api',                  dashRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', uptime: Math.floor(process.uptime()) });
});

// ── Fallback SPA ──────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `Route introuvable : ${req.path}` });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Erreurs globales ──────────────────────────────────────────
app.use(errorHandler);

// ── Démarrage ─────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║     🏫 École Excellence — v3.0.0         ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`  ✅ API      : http://localhost:${PORT}/api`);
    console.log(`  ✅ Frontend : http://localhost:${PORT}`);
    console.log(`  🌍 Env      : ${process.env.NODE_ENV || 'development'}\n`);
  });
});
