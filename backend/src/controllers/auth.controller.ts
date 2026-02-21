import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { blacklistToken } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../config/redis';

const REFRESH_COOKIE = 'refreshToken';
const ACCESS_COOKIE = 'token';

/** Shared cookie options for refresh token. */
const refreshCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge,
});

/** Helper: compute remaining seconds until a JWT expires. */
const tokenTtlSeconds = (token: string): number => {
  try {
    const decoded = verifyToken(token);
    if (decoded.exp) {
      return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
    }
  } catch {
    // Token already expired or invalid — no need to blacklist for long
  }
  return 0;
};

export const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new AppError('Email or username already exists', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    status: 'success',
    data: { user },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  // Set access token cookie (backwards compat — frontend may read from body too)
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Set refresh token cookie (long-lived, scoped to auth routes)
  res.cookie(REFRESH_COOKIE, refreshTokenValue, refreshCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token: accessToken,
    },
  });
};

export const logout = async (req: AuthRequest, res: Response) => {
  // Blacklist the access token currently in use
  const accessToken = req.cookies[ACCESS_COOKIE] || req.headers.authorization?.split(' ')[1];
  if (accessToken) {
    const ttl = tokenTtlSeconds(accessToken);
    if (ttl > 0) {
      await blacklistToken(accessToken, ttl);
    }
  }

  // Blacklist the refresh token
  const refreshTokenValue = req.cookies[REFRESH_COOKIE];
  if (refreshTokenValue) {
    const ttl = tokenTtlSeconds(refreshTokenValue);
    if (ttl > 0) {
      await blacklistToken(refreshTokenValue, ttl);
    }
  }

  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ status: 'success', message: 'Logged out successfully' });
};

export const refreshToken = async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies[REFRESH_COOKIE];

  if (!oldRefreshToken) {
    throw new AppError('Refresh token not provided', 401);
  }

  // Check if this refresh token has been blacklisted (token rotation)
  const blacklisted = await isTokenBlacklisted(oldRefreshToken);
  if (blacklisted) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  // Verify the refresh token
  let decoded: { userId: string; email: string; role: string };
  try {
    decoded = verifyToken(oldRefreshToken) as typeof decoded;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  // Token rotation: blacklist the old refresh token
  const oldTtl = tokenTtlSeconds(oldRefreshToken);
  if (oldTtl > 0) {
    await blacklistToken(oldRefreshToken, oldTtl);
  }

  // Issue new token pair
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  res.cookie(ACCESS_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE, newRefreshToken, refreshCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.json({
    status: 'success',
    data: {
      token: newAccessToken,
    },
  });
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    status: 'success',
    data: { user },
  });
};
