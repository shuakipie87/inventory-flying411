import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { correlationId } from './middleware/correlationId';
import { accessLogger } from './middleware/accessLogger';
import { configureSecurityHeaders } from './config/security';
import { setCsrfToken, validateCsrfToken, getCsrfToken } from './middleware/csrf';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { getRedisClient } from './config/redis';
import authRoutes from './routes/auth.routes';
import listingRoutes from './routes/listing.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import dashboardRoutes from './routes/dashboard.routes';
import webhookRoutes from './routes/webhook.routes';
import syncRoutes from './routes/sync.routes';
import partsRoutes from './routes/parts.routes';
import aiRoutes from './routes/ai.routes';
import uploadRoutes from './routes/upload.routes';
import { initScheduler } from './jobs/scheduler';

dotenv.config();

// Validate critical environment variables before starting
const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'CORS_ORIGIN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ FATAL ERROR: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📋 Required environment variables:');
  console.error('   DATABASE_URL=postgresql://user:pass@host:5432/dbname');
  console.error('   REDIS_URL=redis://host:6379');
  console.error('   JWT_SECRET=your-secret-key-min-32-chars');
  console.error('   CORS_ORIGIN=https://your-frontend-domain.com');
  console.error('   APP_BASE_URL=https://your-backend-domain.com (Recommended for sync)');
  console.error('\n💡 Check COOLIFY_DEPLOYMENT_CHECKLIST.md or coolifySetup.md for complete setup guide');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Correlation ID — must be the very first middleware so every downstream
// handler and log entry can reference it
app.use(correlationId);

// Access logging — immediately after correlation ID so it captures timing
app.use(accessLogger);

// Security headers (replaces bare helmet())
configureSecurityHeaders(app);

// CORS — flexible configuration for multiple origins
// Supports comma-separated origins or wildcard pattern
const corsOriginEnv = process.env.CORS_ORIGIN || '';
let corsOrigin: string | string[] | boolean = false;

if (corsOriginEnv) {
  // Support comma-separated origins (e.g., "http://domain1.com,http://domain2.com")
  if (corsOriginEnv.includes(',')) {
    corsOrigin = corsOriginEnv.split(',').map(origin => origin.trim());
    logger.info(`CORS enabled for multiple origins: ${corsOrigin.join(', ')}`);
  }
  // Support wildcard for all origins (use with caution)
  else if (corsOriginEnv === '*') {
    corsOrigin = true;
    logger.warn('CORS enabled for ALL origins (*) - this is insecure for production');
  }
  // Single origin
  else {
    corsOrigin = corsOriginEnv;
    logger.info(`CORS enabled for origin: ${corsOrigin}`);
  }
} else if (process.env.NODE_ENV !== 'production') {
  // Development fallback
  corsOrigin = 'http://localhost:5173';
  logger.info(`CORS enabled for development: ${corsOrigin}`);
} else {
  logger.warn('CORS_ORIGIN is not set in production — CORS will reject all cross-origin requests');
}

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400, // 24 hours
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection: set token cookie on every request, validate on state-changing requests
app.use(setCsrfToken);
app.use(validateCsrfToken);

// Global rate limiting for all /api routes
app.use('/api', apiLimiter);

// CSRF token endpoint (must be before route mounts)
app.get('/api/csrf-token', getCsrfToken);

// Static files
app.use('/uploads', express.static('uploads'));

// Health check — verifies database and Redis connectivity
app.get('/health', async (_req, res) => {
  const checks: Record<string, { status: string; latency?: number }> = {};
  let allHealthy = true;

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    checks.database = { status: 'healthy', latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: 'unhealthy', latency: Date.now() - dbStart };
    allHealthy = false;
  }

  // Redis check
  const redisStart = Date.now();
  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = { status: 'healthy', latency: Date.now() - redisStart };
  } catch {
    checks.redis = { status: 'unhealthy', latency: Date.now() - redisStart };
    allHealthy = false;
  }

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/sync', syncRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(errorHandler);

// Initialize scheduled jobs
initScheduler();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (err) {
    logger.error('Error during shutdown:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
