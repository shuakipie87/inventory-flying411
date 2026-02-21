import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'price', 'title'] as const;
type SortField = typeof ALLOWED_SORT_FIELDS[number];

const ALLOWED_SORT_DIRS = ['asc', 'desc'] as const;
type SortDir = typeof ALLOWED_SORT_DIRS[number];

const ALLOWED_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SOLD', 'ARCHIVED'] as const;

export const getUserStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [totalListings, draftListings, pendingListings, approvedListings, rejectedListings] = await Promise.all([
    prisma.listing.count({ where: { userId } }),
    prisma.listing.count({ where: { userId, status: 'DRAFT' } }),
    prisma.listing.count({ where: { userId, status: 'PENDING_APPROVAL' } }),
    prisma.listing.count({ where: { userId, status: 'APPROVED' } }),
    prisma.listing.count({ where: { userId, status: 'REJECTED' } }),
  ]);

  res.json({
    status: 'success',
    data: {
      stats: {
        totalListings,
        draftListings,
        pendingListings,
        approvedListings,
        rejectedListings,
      },
    },
  });
};

export const getUserListings = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Parse and validate pagination
  let page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  let limit = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 20)));

  // Parse and validate sort
  const sortParam = String(req.query.sort || 'createdAt');
  const dirParam = String(req.query.dir || 'desc');

  if (!ALLOWED_SORT_FIELDS.includes(sortParam as SortField)) {
    throw new AppError(
      `Invalid sort field: "${sortParam}". Allowed values: ${ALLOWED_SORT_FIELDS.join(', ')}`,
      400
    );
  }
  if (!ALLOWED_SORT_DIRS.includes(dirParam as SortDir)) {
    throw new AppError(
      `Invalid sort direction: "${dirParam}". Allowed values: asc, desc`,
      400
    );
  }

  const sort = sortParam as SortField;
  const dir = dirParam as SortDir;

  // Parse filters
  const { status, category, condition, search } = req.query;

  if (status && !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    throw new AppError(
      `Invalid status: "${status}". Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      400
    );
  }

  // Build where clause
  const where: Prisma.ListingWhereInput = { userId };

  if (status) {
    where.status = status as Prisma.EnumListingStatusFilter;
  }
  if (category && typeof category === 'string') {
    where.category = category;
  }
  if (condition && typeof condition === 'string') {
    where.condition = condition;
  }
  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim();
    const searchFilter = { contains: term, mode: 'insensitive' as const };
    where.OR = [
      { title: searchFilter },
      { description: searchFilter },
      // location exists in schema but generated client may be stale
      { location: searchFilter } as Prisma.ListingWhereInput,
    ];
  }

  // Execute listing query, count, and facets in parallel
  const [listings, total, statusFacets, categoryFacets, conditionFacets] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { images: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: dir },
    }),
    prisma.listing.count({ where }),
    prisma.listing.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ['category'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ['condition'],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  // Transform facet arrays into objects
  const facets = {
    status: Object.fromEntries(statusFacets.map((f) => [f.status, f._count._all])),
    category: Object.fromEntries(categoryFacets.map((f) => [f.category, f._count._all])),
    condition: Object.fromEntries(conditionFacets.map((f) => [f.condition, f._count._all])),
  };

  res.json({
    status: 'success',
    data: {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      facets,
    },
  });
};
