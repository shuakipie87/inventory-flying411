export const LISTING_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ListingStatus = (typeof LISTING_STATUS)[keyof typeof LISTING_STATUS];

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  [LISTING_STATUS.DRAFT]: 'Draft',
  [LISTING_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [LISTING_STATUS.APPROVED]: 'Approved',
  [LISTING_STATUS.REJECTED]: 'Rejected',
  [LISTING_STATUS.ARCHIVED]: 'Archived',
};

export const LISTING_CATEGORIES = [
  'Aircraft',
  'Engines',
  'Parts',
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_CONDITIONS = [
  'Factory New',
  'New',
  'Like New',
  'Overhauled',
  'Serviceable',
  'As Removed',
  'Good',
  'Excellent',
  'Fair',
] as const;

export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SORT_FIELDS = ['createdAt', 'updatedAt', 'price', 'title'] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortDir = 'asc' | 'desc';
