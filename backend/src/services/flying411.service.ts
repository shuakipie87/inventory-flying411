import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { transformListing } from './syncTransformer';

interface Flying411Listing {
    externalId?: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    images: string[];
    quantity: number;
    manufacturer?: string;
    serialNumber?: string;
    registrationNo?: string;
    city?: string;
    state?: string;
    country?: string;
    currency?: string;
    year?: number;
    totalTime?: string;
    engineInfo?: string;
    subcategory?: string;
    productType?: string;
}

interface Flying411Response {
    success: boolean;
    data?: any;
    error?: string;
    externalId?: string;
}

interface SyncResult {
    listingId: string;
    externalId: string | null;
    status: 'success' | 'failed';
    error?: string;
}

export class Flying411Service {
    private client: AxiosInstance;
    private apiUrl: string;
    private apiKey: string;
    private maxRetries: number = 3;
    private retryDelay: number = 1000;

    constructor() {
        this.apiUrl = process.env.FLYING411_API_URL || 'https://api.flying411.com/v1';
        this.apiKey = process.env.FLYING411_API_KEY || '';

        this.client = axios.create({
            baseURL: this.apiUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
                'User-Agent': 'Flying411-Inventory/1.0',
            },
        });

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.info(`Flying411 API: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
                return response;
            },
            (error: AxiosError) => {
                logger.error(`Flying411 API Error: ${error.message}`, {
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data,
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Retry wrapper for API calls with exponential backoff
     */
    private async withRetry<T>(fn: () => Promise<T>, retries: number = this.maxRetries): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0 && this.isRetryable(error)) {
                const delay = this.retryDelay * Math.pow(2, this.maxRetries - retries);
                logger.warn(`Retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.withRetry(fn, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Check if error is retryable (network errors, 5xx status codes)
     */
    private isRetryable(error: any): boolean {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return true;
        }
        const status = error.response?.status;
        return status >= 500 && status < 600;
    }

    /**
     * Create a new listing on Flying411
     */
    async createListing(listing: Flying411Listing): Promise<Flying411Response> {
        try {
            const response = await this.withRetry(() =>
                this.client.post('/sync', listing)
            );

            return {
                success: true,
                data: response.data,
                externalId: response.data.id || response.data.externalId,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }

    /**
     * Update an existing listing on Flying411
     */
    async updateListing(externalId: string, listing: Partial<Flying411Listing>): Promise<Flying411Response> {
        try {
            const response = await this.withRetry(() =>
                this.client.put(`/sync/${externalId}`, listing)
            );

            return {
                success: true,
                data: response.data,
                externalId,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }

    /**
     * Delete a listing from Flying411
     */
    async deleteListing(externalId: string): Promise<Flying411Response> {
        try {
            await this.withRetry(() => this.client.delete(`/sync/${externalId}`));

            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }

    /**
     * Get listing status from Flying411
     */
    async getListingStatus(externalId: string): Promise<Flying411Response> {
        try {
            const response = await this.withRetry(() =>
                this.client.get(`/listings/${externalId}`)
            );

            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }

    /**
     * Sync an approved listing to Flying411
     */
    async syncListing(listingId: string): Promise<SyncResult> {
        const startTime = Date.now();
        try {
            const listing = await prisma.listing.findUnique({
                where: { id: listingId },
                include: { images: true },
            });

            if (!listing) {
                return { listingId, externalId: null, status: 'failed', error: 'Listing not found' };
            }

            if (listing.status !== 'APPROVED') {
                return { listingId, externalId: null, status: 'failed', error: 'Listing not approved' };
            }

            // Update sync status to SYNCING
            await prisma.listing.update({
                where: { id: listingId },
                data: {
                    syncStatus: 'SYNCING',
                    syncAttempts: { increment: 1 },
                    lastSyncAttemptAt: new Date(),
                },
            });

            const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4001';
            const transformed = transformListing(listing, baseUrl);
            if (!transformed) {
                const error = `Unsupported category: ${listing.category}`;
                await this.updateSyncFailed(listingId, error);
                return { listingId, externalId: null, status: 'failed', error };
            }

            const syncPayload = {
                prisma_uuid: listing.id,
                product_type: transformed.type,
                data: transformed.data,
            };

            let result: Flying411Response;

            if (listing.flying411ListingId) {
                result = await this.updateListing(listing.flying411ListingId, syncPayload as any);
            } else {
                result = await this.createListing(syncPayload as any);
            }

            const duration = Date.now() - startTime;

            if (result.success && result.externalId) {
                await prisma.listing.update({
                    where: { id: listingId },
                    data: {
                        flying411ListingId: result.externalId,
                        syncStatus: 'SYNCED',
                        syncError: null,
                        syncedAt: new Date(),
                    },
                });

                await prisma.syncLog.create({
                    data: {
                        listingId,
                        action: 'sync',
                        direction: 'outbound',
                        status: 'success',
                        externalId: result.externalId,
                        duration,
                    },
                });

                return { listingId, externalId: result.externalId, status: 'success' };
            }

            await this.updateSyncFailed(listingId, result.error || 'Unknown error');
            await prisma.syncLog.create({
                data: {
                    listingId,
                    action: 'sync',
                    direction: 'outbound',
                    status: 'failed',
                    error: result.error,
                    duration,
                },
            });

            return { listingId, externalId: null, status: 'failed', error: result.error };
        } catch (error: any) {
            const duration = Date.now() - startTime;
            logger.error(`Sync failed for listing ${listingId}:`, error);
            await this.updateSyncFailed(listingId, error.message).catch(() => {});
            await prisma.syncLog.create({
                data: {
                    listingId,
                    action: 'sync',
                    direction: 'outbound',
                    status: 'failed',
                    error: error.message,
                    duration,
                },
            }).catch(() => {});
            return { listingId, externalId: null, status: 'failed', error: error.message };
        }
    }

    private async updateSyncFailed(listingId: string, error: string): Promise<void> {
        await prisma.listing.update({
            where: { id: listingId },
            data: {
                syncStatus: 'SYNC_FAILED',
                syncError: error,
            },
        });
    }

    /**
     * Batch sync multiple listings
     */
    async syncMultipleListings(listingIds: string[]): Promise<SyncResult[]> {
        const results: SyncResult[] = [];

        for (const id of listingIds) {
            const result = await this.syncListing(id);
            results.push(result);
            // Small delay between requests to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        return results;
    }

    /**
     * Fetch market pricing data from Flying411 for a given part number
     */
    async fetchMarketPricing(partNumber: string): Promise<{ price: number; quantity: number; condition: string }[]> {
        try {
            const response = await this.withRetry(() =>
                this.client.get('/market/pricing', { params: { partNumber } })
            );

            if (response.data && Array.isArray(response.data.data)) {
                return response.data.data.map((item: any) => ({
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 0,
                    condition: String(item.condition || 'unknown'),
                }));
            }

            return [];
        } catch (error: any) {
            logger.warn(`Failed to fetch market pricing for ${partNumber}: ${error.message}`);
            return [];
        }
    }

    /**
     * Fetch inventory count from Flying411 for a given part number
     */
    async fetchInventoryCounts(partNumber: string): Promise<number> {
        try {
            const response = await this.withRetry(() =>
                this.client.get('/market/inventory', { params: { partNumber } })
            );

            if (response.data && typeof response.data.count === 'number') {
                return response.data.count;
            }

            return 0;
        } catch (error: any) {
            logger.warn(`Failed to fetch inventory count for ${partNumber}: ${error.message}`);
            return 0;
        }
    }

    /**
     * Verify API connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
        } catch {
            return false;
        }
    }
}

export const flying411Service = new Flying411Service();
