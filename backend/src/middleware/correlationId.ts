import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const HEADER_NAME = 'X-Correlation-ID';

/**
 * Middleware to attach a correlation ID to every request.
 * If the incoming request already carries X-Correlation-ID (e.g. from a
 * reverse proxy or upstream service), that value is reused. Otherwise a
 * new UUID v4 is generated.
 *
 * The ID is stored on `req.correlationId` and echoed back in the response
 * header so clients can reference it in support requests / logs.
 */
export const correlationId = (req: Request, res: Response, next: NextFunction): void => {
  const id = (req.headers[HEADER_NAME.toLowerCase()] as string) || crypto.randomUUID();

  // Attach to request for downstream consumers (logger, controllers, etc.)
  (req as any).correlationId = id;

  // Echo back on the response
  res.setHeader(HEADER_NAME, id);

  next();
};
