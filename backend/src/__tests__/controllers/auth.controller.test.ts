import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login, logout } from '../../controllers/auth.controller';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;
    let responseCookie: jest.Mock;
    let responseClearCookie: jest.Mock;

    beforeEach(() => {
        responseJson = jest.fn();
        responseStatus = jest.fn().mockReturnThis();
        responseCookie = jest.fn().mockReturnThis();
        responseClearCookie = jest.fn().mockReturnThis();

        mockRequest = {
            body: {},
        };

        mockResponse = {
            json: responseJson,
            status: responseStatus,
            cookie: responseCookie,
            clearCookie: responseClearCookie,
        };

        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            };

            mockRequest.body = userData;

            (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
            (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            (mockPrisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user-id-1',
                email: userData.email,
                username: userData.username,
                role: 'USER',
                createdAt: new Date(),
            });

            await register(mockRequest as Request, mockResponse as Response);

            expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [{ email: userData.email }, { username: userData.username }],
                },
            });
            expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(responseStatus).toHaveBeenCalledWith(201);
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        email: userData.email,
                        username: userData.username,
                    }),
                }),
            });
        });

        it('should throw error if email already exists', async () => {
            mockRequest.body = {
                email: 'existing@example.com',
                username: 'newuser',
                password: 'password123',
            };

            (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
                id: 'existing-user',
                email: 'existing@example.com',
            });

            await expect(
                register(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Email or username already exists');
        });
    });

    describe('login', () => {
        it('should login user successfully with valid credentials', async () => {
            const loginData = {
                email: 'user@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: 'user-id-1',
                email: loginData.email,
                username: 'testuser',
                passwordHash: 'hashedPassword',
                role: 'USER',
                isActive: true,
            };

            mockRequest.body = loginData;

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
            (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);
            (mockJwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

            await login(mockRequest as Request, mockResponse as Response);

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginData.email },
            });
            expect(mockBcrypt.compare).toHaveBeenCalledWith(
                loginData.password,
                mockUser.passwordHash
            );
            expect(mockJwt.sign).toHaveBeenCalled();
            expect(responseCookie).toHaveBeenCalledWith(
                'token',
                'mock-jwt-token',
                expect.any(Object)
            );
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                data: expect.objectContaining({
                    token: 'mock-jwt-token',
                    user: expect.objectContaining({
                        id: mockUser.id,
                        email: mockUser.email,
                    }),
                }),
            });
        });

        it('should throw error for invalid credentials', async () => {
            mockRequest.body = {
                email: 'user@example.com',
                password: 'wrongpassword',
            };

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-id',
                email: 'user@example.com',
                passwordHash: 'hashedPassword',
                isActive: true,
            });
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                login(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Invalid credentials');
        });

        it('should throw error for inactive user', async () => {
            mockRequest.body = {
                email: 'inactive@example.com',
                password: 'password123',
            };

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-id',
                email: 'inactive@example.com',
                passwordHash: 'hashedPassword',
                isActive: false,
            });

            await expect(
                login(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Invalid credentials');
        });

        it('should throw error for non-existent user', async () => {
            mockRequest.body = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                login(mockRequest as Request, mockResponse as Response)
            ).rejects.toThrow('Invalid credentials');
        });
    });

    describe('logout', () => {
        it('should logout user and clear cookie', async () => {
            await logout(mockRequest as Request, mockResponse as Response);

            expect(responseClearCookie).toHaveBeenCalledWith('token');
            expect(responseJson).toHaveBeenCalledWith({
                status: 'success',
                message: 'Logged out successfully',
            });
        });
    });
});
