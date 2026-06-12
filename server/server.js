// server/server.js
// PRD v2 §10.3 — CORS: origin=CLIENT_URL, credentials=true, methods=GET,POST,PUT,PATCH,DELETE
// PRD v2 §10.1 — PORT=8000
// PRD v2 §5.4  — GET /api/v1/health
// PRD v2 §8    — helmet, rate-limit, 10kb body limit

const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv       = require('dotenv');
const connectDB    = require('./config/db');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);

// PRD v2 §10.3 — CORS must allow credentials (httpOnly cookie cross-origin)
const corsOptions = {
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,                                           // required for httpOnly cookie
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],     // PRD v2 §10.3
};

const io = new Server(server, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST'], // Socket.IO handshake only needs GET/POST
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());                                // PRD v2 §8 — insecure headers mitigation
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));        // PRD v2 §8 — large payload protection
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate Limiting — PRD v2 §8 ───────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      100,
  message:  { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  message:  { success: false, message: 'Too many requests. Please try again later.' },
});

app.use('/api/', globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authLimiter, require('./routes/auth.routes'));
app.use('/api/v1/users',                      require('./routes/user.routes'));
app.use('/api/v1/jobs',                       require('./routes/job.routes'));
app.use('/api/v1/applications',               require('./routes/application.routes'));
app.use('/api/v1/companies',                  require('./routes/company.routes'));
app.use('/api/v1/notifications',              require('./routes/notification.routes'));

// PRD v2 §5.4 — GET /api/v1/health (Public)
app.get('/api/v1/health', (req, res) =>
  res.json({
    success:   true,
    status:    'ok',
    timestamp: new Date().toISOString(),
    version:   'v1.0',
    env:       process.env.NODE_ENV,
  })
);

// ─── Socket.IO setup ──────────────────────────────────────────────────────────
app.set('io', io);
require('./socket/socket')(io);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// PRD v2 §9.3 — catches all unhandled promise rejections
app.use(require('./middleware/errorHandler'));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;   // PRD v2 §10.1 — default 8000
server.listen(PORT, () => {
  console.log(`\n🚀 CareerConnect API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/v1/health\n`);
});
