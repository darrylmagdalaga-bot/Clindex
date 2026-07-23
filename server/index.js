import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { getDbPool, checkDbHealth } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Render / Proxy headers
app.set('trust proxy', 1);

// Security & Optimization Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Hide Express fingerprint
app.disable('x-powered-by');

// -------------------------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------------------------

// Health Check Endpoint for Render / Load Balancers
app.get('/api/health', async (req, res) => {
  const dbHealthy = await checkDbHealth();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    services: {
      database: {
        target: process.env.DB_SERVER || 'vtsdatabasen.database.windows.net',
        status: dbHealthy ? 'CONNECTED' : 'DISCONNECTED',
      },
      api: {
        status: 'ONLINE',
      },
    },
  });
});

// System Information
app.get('/api/system/info', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query('SELECT TOP 1 * FROM Cloud_SystemVersions ORDER BY VersionID DESC');
    res.json({
      application: 'CLINDEX 2.0',
      version: result.recordset[0] || { VersionNumber: '2.0.0', BuildNumber: '2026.07.23.001' },
      environment: process.env.NODE_ENV || 'production',
      nodeVersion: process.version,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve system info', message: err.message });
  }
});

// Documents API Endpoint
app.get('/api/documents', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT TOP 50 d.DocumentID, d.DocumentCode, d.DocumentTitle, d.DatePassed, d.DocumentYear,
                     t.TypeName, s.StatusName, s.Color AS StatusColor
      FROM Cloud_Documents d
      LEFT JOIN Cloud_DocumentTypes t ON d.DocumentTypeID = t.DocumentTypeID
      LEFT JOIN Cloud_DocumentStatus s ON d.StatusID = s.StatusID
      WHERE d.IsDeleted = 0
      ORDER BY d.CreatedDate DESC
    `);
    res.json({ success: true, count: result.recordset.length, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database Query Failed', message: err.message });
  }
});

// -------------------------------------------------------------------------------
// ERROR HANDLING MIDDLEWARE
// -------------------------------------------------------------------------------

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    error: '404 - Not Found',
    path: req.originalUrl,
    message: 'The requested API endpoint does not exist.',
  });
});

// Global 500 Error Handler
app.use((err, req, res, next) => {
  console.error('[Production Error]:', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
  });
});

// -------------------------------------------------------------------------------
// SERVER LIFECYCLE
// -------------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`[CLINDEX 2.0 Backend] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// Graceful Shutdown
const shutdown = (signal) => {
  console.log(`[CLINDEX 2.0 Backend] ${signal} received. Closing HTTP server...`);
  server.close(() => {
    console.log('[CLINDEX 2.0 Backend] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
