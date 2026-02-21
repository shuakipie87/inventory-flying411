import jwt, { SignOptions, Secret } from 'jsonwebtoken';

/**
 * Get JWT secret from environment. Throws if not configured.
 */
export const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

/**
 * Generate an access token (short-lived).
 */
export const generateAccessToken = (payload: object): string => {
  const options: SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload, getJwtSecret(), options);
};

/**
 * Generate a refresh token (long-lived).
 */
export const generateRefreshToken = (payload: object): string => {
  const options: SignOptions = { expiresIn: '30d' };
  return jwt.sign(payload, getJwtSecret(), options);
};

/**
 * Verify and decode a JWT token.
 */
export const verifyToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
};
