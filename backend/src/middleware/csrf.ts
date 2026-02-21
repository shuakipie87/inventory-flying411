import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware
 * 
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export const generateCsrfToken = (): string => {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
};

/**
 * Middleware to set CSRF token cookie
 */
export const setCsrfToken = (req: Request, res: Response, next: NextFunction) => {
    // Only set token if not already present
    if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false, // Must be readable by JS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }
    next();
};

/**
 * Middleware to validate CSRF token
 * Applies to state-changing methods (POST, PUT, DELETE, PATCH)
 */
export const validateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
    // Skip for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // Skip for specific routes (webhooks, auth)
    const excludePaths = ['/api/webhooks', '/api/auth/login', '/api/auth/register'];
    if (excludePaths.some((path) => req.path.startsWith(path))) {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid CSRF token',
        });
    }

    next();
};

/**
 * Route to get a new CSRF token
 */
export const getCsrfToken = (req: Request, res: Response) => {
    let token = req.cookies[CSRF_COOKIE_NAME];

    if (!token) {
        token = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
        });
    }

    res.json({ csrfToken: token });
};
