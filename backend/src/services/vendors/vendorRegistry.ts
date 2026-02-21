import { VendorAdapter } from './vendorAdapter.interface';
import { logger } from '../../utils/logger';

class VendorRegistry {
  private adapters: Map<string, VendorAdapter> = new Map();

  register(adapter: VendorAdapter): void {
    const info = adapter.getVendorInfo();
    if (this.adapters.has(info.code)) {
      logger.warn(`Vendor adapter "${info.code}" is already registered — replacing`);
    }
    this.adapters.set(info.code, adapter);
    logger.info(`Vendor adapter registered: ${info.name} (${info.code})`);
  }

  getAdapter(code: string): VendorAdapter | undefined {
    return this.adapters.get(code);
  }

  getAllAdapters(): VendorAdapter[] {
    return Array.from(this.adapters.values());
  }

  async getActiveAdapters(): Promise<VendorAdapter[]> {
    const results: VendorAdapter[] = [];
    for (const adapter of this.adapters.values()) {
      try {
        const alive = await adapter.testConnection();
        if (alive) {
          results.push(adapter);
        }
      } catch {
        // adapter failed connection test — skip it
      }
    }
    return results;
  }
}

export const vendorRegistry = new VendorRegistry();
