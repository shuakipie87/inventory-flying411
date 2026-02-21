// Jest global setup
import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Mock environment variables (only if not already set)
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret';
}
if (!process.env.JWT_EXPIRES_IN) {
    process.env.JWT_EXPIRES_IN = '7d';
}
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
}

// Increase test timeout for async operations
jest.setTimeout(10000);

// Mock Prisma client
jest.mock('../config/database', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        listing: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        listingImage: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        $transaction: jest.fn(),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    },
}));

// Global teardown
afterAll(async () => {
    // Cleanup if needed
});
