import xss from 'xss';

/**
 * Input sanitization middleware and utilities
 * Prevents XSS attacks by sanitizing user input
 */

// XSS options for different contexts
const htmlOptions = {
    whiteList: {}, // Strip all HTML tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
};

const richTextOptions = {
    whiteList: {
        a: ['href', 'title', 'target'],
        b: [],
        i: [],
        br: [],
        p: [],
        strong: [],
        em: [],
        ul: [],
        ol: [],
        li: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    onTagAttr: (tag: string, name: string, value: string): string | void => {
        if (name === 'href' && /^\s*javascript\s*:/i.test(value)) {
            return '';
        }
    },
};

/**
 * Sanitize plain text input (strips all HTML)
 */
export const sanitizeText = (input: string): string => {
    if (typeof input !== 'string') return input;
    return xss(input, htmlOptions);
};

/**
 * Sanitize rich text (allows limited HTML)
 */
export const sanitizeRichText = (input: string): string => {
    if (typeof input !== 'string') return input;
    return xss(input, richTextOptions);
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeText(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
                typeof item === 'string'
                    ? sanitizeText(item)
                    : typeof item === 'object' && item !== null
                        ? sanitizeObject(item)
                        : item
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
};

/**
 * Express middleware to sanitize request body
 */
export const sanitizeBody = (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
};

/**
 * Express middleware to sanitize query params
 */
export const sanitizeQuery = (req: any, res: any, next: any) => {
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    next();
};
