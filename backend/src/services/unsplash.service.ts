import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface UnsplashPhoto {
    id: string;
    url: string;
    thumbUrl: string;
    smallUrl: string;
    photographer: string;
    photographerUrl: string;
    downloadUrl: string;
    alt: string;
    width: number;
    height: number;
}

export class UnsplashService {
    private client: AxiosInstance | null = null;

    constructor() {
        const accessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (accessKey) {
            this.client = axios.create({
                baseURL: 'https://api.unsplash.com',
                timeout: 15000,
                headers: {
                    Authorization: `Client-ID ${accessKey}`,
                    'Accept-Version': 'v1',
                },
            });
            logger.info('Unsplash service initialized');
        } else {
            logger.warn('UNSPLASH_ACCESS_KEY not set - image suggestions will be unavailable');
        }
    }

    async searchPhotos(query: string, perPage: number = 8): Promise<UnsplashPhoto[]> {
        if (!this.client) {
            throw new Error('Unsplash service not configured. Set UNSPLASH_ACCESS_KEY environment variable.');
        }

        try {
            const response = await this.client.get('/search/photos', {
                params: {
                    query,
                    per_page: perPage,
                    orientation: 'landscape',
                    content_filter: 'high',
                },
            });

            const results = response.data.results || [];

            return results.map((photo: any) => ({
                id: photo.id,
                url: photo.urls.regular,
                thumbUrl: photo.urls.thumb,
                smallUrl: photo.urls.small,
                photographer: photo.user.name,
                photographerUrl: photo.user.links.html,
                downloadUrl: photo.urls.regular,
                alt: photo.alt_description || photo.description || query,
                width: photo.width,
                height: photo.height,
            }));
        } catch (error: any) {
            logger.error('Unsplash search failed:', error.message);
            if (error.response?.status === 403) {
                throw new Error('Unsplash API rate limit exceeded. Please try again later.');
            }
            throw new Error(`Image search failed: ${error.message}`);
        }
    }

    async downloadPhoto(imageUrl: string): Promise<Buffer> {
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
            });
            return Buffer.from(response.data);
        } catch (error: any) {
            logger.error('Image download failed:', error.message);
            throw new Error(`Failed to download image: ${error.message}`);
        }
    }
}

export const unsplashService = new UnsplashService();
