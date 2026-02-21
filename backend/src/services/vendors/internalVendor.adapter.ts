import { prisma } from '../../config/database';
import { VendorAdapter, VendorInfo, VendorPart, VendorPrice } from './vendorAdapter.interface';

export class InternalVendorAdapter implements VendorAdapter {
  getVendorInfo(): VendorInfo {
    return {
      name: 'Internal Inventory',
      code: 'internal',
      capabilities: ['search', 'price', 'inventory'],
    };
  }

  async searchParts(query: { partNumber?: string; manufacturer?: string }): Promise<VendorPart[]> {
    const where: Record<string, unknown> = { status: 'APPROVED' };

    if (query.partNumber) {
      where.partData = { path: ['partNumber'], string_contains: query.partNumber };
    }
    if (query.manufacturer) {
      where.manufacturer = { contains: query.manufacturer, mode: 'insensitive' };
    }

    // If neither filter was provided, return empty to avoid a full table scan
    if (!query.partNumber && !query.manufacturer) {
      return [];
    }

    const listings = await prisma.listing.findMany({
      where,
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    return listings.map((listing) => {
      const partData = (listing.partData as Record<string, unknown>) || {};
      return {
        vendorPartId: listing.id,
        partNumber: (partData.partNumber as string) || listing.title,
        description: listing.description,
        price: Number(listing.price),
        currency: listing.currency,
        quantity: listing.quantity,
        condition: listing.condition,
      };
    });
  }

  async getPartPrice(partNumber: string): Promise<VendorPrice | null> {
    const listing = await prisma.listing.findFirst({
      where: {
        status: 'APPROVED',
        partData: { path: ['partNumber'], string_contains: partNumber },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!listing) {
      return null;
    }

    return {
      price: Number(listing.price),
      currency: listing.currency,
      quantity: listing.quantity,
      condition: listing.condition,
      lastUpdated: listing.updatedAt,
    };
  }

  async getInventoryCount(partNumber: string): Promise<number> {
    const count = await prisma.listing.count({
      where: {
        status: 'APPROVED',
        partData: { path: ['partNumber'], string_contains: partNumber },
      },
    });
    return count;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
