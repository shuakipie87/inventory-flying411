import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { username },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new AppError('Invalid current password', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash },
    });

    res.json({ status: 'success', message: 'Password updated successfully' });
  } catch (error) {
    throw error;
  }
};
