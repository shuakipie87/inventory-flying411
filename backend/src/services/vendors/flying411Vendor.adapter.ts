import { Flying411Service } from '../flying411.service';
import { VendorAdapter, VendorInfo, VendorPart, VendorPrice } from './vendorAdapter.interface';
import { logger } from '../../utils/logger';

export class Flying411VendorAdapter implements VendorAdapter {
  private service: Flying411Service;

  constructor(service?: Flying411Service) {
    this.service = service || new Flying411Service();
  }

  getVendorInfo(): VendorInfo {
    return {
      name: 'Flying411 Marketplace',
      code: 'flying411',
      capabilities: ['search', 'price', 'inventory'],
    };
  }

  async searchParts(_query: { partNumber?: string; manufacturer?: string }): Promise<VendorPart[]> {
    // The Flying411 API does not currently expose a part search endpoint.
    // Return empty results until the upstream API adds support.
    logger.debug('Flying411 searchParts: not yet supported by upstream API');
    return [];
  }

  async getPartPrice(_partNumber: string): Promise<VendorPrice | null> {
    // The Flying411 API does not currently expose a price lookup endpoint.
    logger.debug('Flying411 getPartPrice: not yet supported by upstream API');
    return null;
  }

  async getInventoryCount(_partNumber: string): Promise<number> {
    // The Flying411 API does not currently expose an inventory count endpoint.
    logger.debug('Flying411 getInventoryCount: not yet supported by upstream API');
    return 0;
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.service.healthCheck();
    } catch (err) {
      logger.warn('Flying411 connection test failed', { error: (err as Error).message });
      return false;
    }
  }
}
