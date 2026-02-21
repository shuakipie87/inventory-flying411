import helmet from 'helmet';
import { Express } from 'express';

/**
 * Security headers configuration
 * Applies comprehensive security headers to all responses
 */

export const configureSecurityHeaders = (app: Express) => {
    // Basic Helmet configuration
    app.use(
        helmet({
            // Content Security Policy
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
                    fontSrc: ["'self'", 'fonts.gstatic.com'],
                    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                    connectSrc: ["'self'", process.env.VITE_API_URL || 'http://localhost:3000'],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                },
            },
            // Cross-Origin headers
            crossOriginEmbedderPolicy: false, // Needed for external images
            crossOriginResourcePolicy: { policy: 'cross-origin' },

            // Strict Transport Security
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true,
            },

            // Prevent clickjacking
            frameguard: { action: 'deny' },

            // Hide X-Powered-By header
            hidePoweredBy: true,

            // Prevent MIME type sniffing
            noSniff: true,

            // XSS filter (legacy browsers)
            xssFilter: true,

            // Referrer policy
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        })
    );

    // Additional custom headers
    app.use((req, res, next) => {
        // Permissions Policy (formerly Feature Policy)
        res.setHeader(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
        );

        // X-Content-Type-Options
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // X-Frame-Options (redundant with helmet but explicit)
        res.setHeader('X-Frame-Options', 'DENY');

        next();
    });
};

/**
 * Security checklist for audits
 */
export const securityChecklist = {
    headers: [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
    ],
    features: [
        'Rate limiting on auth endpoints',
        'Rate limiting on listing creation',
        'CSRF protection',
        'XSS sanitization',
        'SQL injection prevention (Prisma)',
        'Secure cookie settings',
        'Password hashing (bcrypt)',
        'JWT token security',
    ],
};
