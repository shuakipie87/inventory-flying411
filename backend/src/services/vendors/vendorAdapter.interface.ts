export interface VendorInfo {
  name: string;
  code: string;
  capabilities: string[];
}

export interface VendorPart {
  vendorPartId: string;
  partNumber: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  condition?: string;
  sourceUrl?: string;
}

export interface VendorPrice {
  price: number;
  currency: string;
  quantity: number;
  condition?: string;
  lastUpdated: Date;
}

export interface VendorAdapter {
  getVendorInfo(): VendorInfo;
  searchParts(query: { partNumber?: string; manufacturer?: string }): Promise<VendorPart[]>;
  getPartPrice(partNumber: string): Promise<VendorPrice | null>;
  getInventoryCount(partNumber: string): Promise<number>;
  testConnection(): Promise<boolean>;
}
