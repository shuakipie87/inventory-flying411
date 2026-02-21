import { unsplashService } from '../../services/unsplash.service';
import { logger } from '../../utils/logger';

describe('UnsplashService', () => {
    beforeAll(() => {
        // Suppress logs during testing
        jest.spyOn(logger, 'info').mockImplementation();
        jest.spyOn(logger, 'warn').mockImplementation();
        jest.spyOn(logger, 'error').mockImplementation();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('searchPhotos', () => {
        it('should search for aviation photos successfully', async () => {
            // Skip if API key not configured
            if (!process.env.UNSPLASH_ACCESS_KEY) {
                console.warn('⚠️  UNSPLASH_ACCESS_KEY not set - skipping live API test');
                return;
            }

            try {
                const results = await unsplashService.searchPhotos('cessna aircraft', 5);
                
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBe(true);
                
                if (results.length > 0) {
                    const photo = results[0];
                    expect(photo).toHaveProperty('id');
                    expect(photo).toHaveProperty('url');
                    expect(photo).toHaveProperty('thumbUrl');
                    expect(photo).toHaveProperty('smallUrl');
                    expect(photo).toHaveProperty('photographer');
                    expect(photo).toHaveProperty('photographerUrl');
                    expect(photo).toHaveProperty('alt');
                    expect(photo).toHaveProperty('width');
                    expect(photo).toHaveProperty('height');
                    
                    console.log('✅ Unsplash API test passed!');
                    console.log(`   Found ${results.length} photos for "cessna aircraft"`);
                    console.log(`   Sample: "${photo.alt}" by ${photo.photographer}`);
                }
            } catch (error: any) {
                console.error('❌ Unsplash API test failed:', error.message);
                throw error;
            }
        }, 30000); // 30 second timeout

        it('should handle invalid API key gracefully', async () => {
            if (!process.env.UNSPLASH_ACCESS_KEY) {
                await expect(
                    unsplashService.searchPhotos('test')
                ).rejects.toThrow('Unsplash service not configured');
            }
        });
    });

    describe('downloadPhoto', () => {
        it('should download a photo successfully', async () => {
            if (!process.env.UNSPLASH_ACCESS_KEY) {
                console.warn('⚠️  UNSPLASH_ACCESS_KEY not set - skipping download test');
                return;
            }

            try {
                // Use a small test image
                const testUrl = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400';
                const buffer = await unsplashService.downloadPhoto(testUrl);
                
                expect(buffer).toBeDefined();
                expect(Buffer.isBuffer(buffer)).toBe(true);
                expect(buffer.length).toBeGreaterThan(0);
                
                console.log('✅ Photo download test passed!');
                console.log(`   Downloaded ${(buffer.length / 1024).toFixed(2)} KB`);
            } catch (error: any) {
                console.error('❌ Photo download test failed:', error.message);
                throw error;
            }
        }, 30000);
    });
});
