import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * HTTP access logging middleware.
 *
 * Logs method, URL, status code, response time (ms), client IP, and
 * correlation ID for every request once the response finishes.
 *
 * Log levels:
 *   - info  : 1xx – 3xx (success / redirect)
 *   - warn  : 4xx (client error)
 *   - error : 5xx (server error)
 */
export const accessLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const statusCode = res.statusCode;

    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      responseTime: `${durationMs.toFixed(2)}ms`,
      ip: req.ip || req.socket.remoteAddress,
      correlationId: (req as any).correlationId,
    };

    const message = `${req.method} ${req.originalUrl} ${statusCode} ${durationMs.toFixed(2)}ms`;

    if (statusCode >= 500) {
      logger.error(message, meta);
    } else if (statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.info(message, meta);
    }
  });

  next();
};
