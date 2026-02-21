import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Get platform health statistics
 * GET /api/admin/health
 */
export const getPlatformHealth = async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalListings,
            pendingListings,
            approvedToday,
            rejectedToday,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.listing.count(),
            prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
            prisma.listing.count({
                where: {
                    status: 'APPROVED',
                    publishedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            prisma.listing.count({
                where: {
                    status: 'REJECTED',
                    updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
        ]);

        res.json({
            status: 'success',
            data: {
                users: { total: totalUsers, active: activeUsers },
                listings: {
                    total: totalListings,
                    pending: pendingListings,
                    approvedToday,
                    rejectedToday,
                },
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Get analytics data for charts
 * GET /api/admin/analytics
 */
export const getAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { period = '7d' } = req.query;

        // Calculate date range
        const days = period === '30d' ? 30 : period === '7d' ? 7 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get daily listing counts
        const listings = await prisma.listing.groupBy({
            by: ['status'],
            _count: true,
        });

        // Get listings by category
        const byCategory = await prisma.listing.groupBy({
            by: ['category'],
            _count: true,
            orderBy: { _count: { category: 'desc' } },
            take: 10,
        });

        // Get approval rate
        const approvedCount = listings.find((l) => l.status === 'APPROVED')?._count || 0;
        const rejectedCount = listings.find((l) => l.status === 'REJECTED')?._count || 0;
        const totalReviewed = approvedCount + rejectedCount;
        const approvalRate = totalReviewed > 0 ? (approvedCount / totalReviewed) * 100 : 0;

        res.json({
            status: 'success',
            data: {
                period,
                statusBreakdown: listings.map((l) => ({ status: l.status, count: l._count })),
                categoryBreakdown: byCategory.map((c) => ({ category: c.category, count: c._count })),
                approvalRate: approvalRate.toFixed(1),
            },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Get audit log entries
 * GET /api/admin/audit-log
 */
export const getAuditLog = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 20, action, entityType } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({
            status: 'success',
            data: {
                logs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * Export listings as CSV
 * GET /api/admin/export/listings
 */
export const exportListingsCsv = async (req: AuthRequest, res: Response) => {
    try {
        const listings = await prisma.listing.findMany({
            include: { user: { select: { email: true, username: true } } },
            orderBy: { createdAt: 'desc' },
        });

        // Build CSV
        const headers = ['ID', 'Title', 'Price', 'Status', 'Category', 'Seller', 'Created'];
        const rows = listings.map((l) => [
            l.id,
            `"${l.title.replace(/"/g, '""')}"`,
            l.price.toString(),
            l.status,
            l.category,
            l.user.email,
            l.createdAt.toISOString(),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=listings-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        throw error;
    }
};

/**
 * Export audit log as CSV
 * GET /api/admin/export/audit-log
 */
export const exportAuditLogCsv = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1000, // Limit export size
        });

        const headers = ['ID', 'Action', 'Entity Type', 'Entity ID', 'Admin ID', 'Timestamp'];
        const rows = logs.map((l) => [
            l.id,
            l.action,
            l.entityType,
            l.entityId,
            l.adminId,
            l.createdAt.toISOString(),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-log-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        throw error;
    }
};
