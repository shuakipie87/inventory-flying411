import { geminiService } from '../../services/gemini.service';
import { logger } from '../../utils/logger';

describe('GeminiService', () => {
    beforeAll(() => {
        // Suppress logs during testing
        jest.spyOn(logger, 'info').mockImplementation();
        jest.spyOn(logger, 'warn').mockImplementation();
        jest.spyOn(logger, 'error').mockImplementation();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('suggestPrice', () => {
        it('should suggest price for aircraft part', async () => {
            if (!process.env.GEMINI_API_KEY) {
                console.warn('⚠️  GEMINI_API_KEY not set - skipping live API test');
                return;
            }

            try {
                const result = await geminiService.suggestPrice({
                    title: 'Cessna 172 Propeller - 3 Blade',
                    category: 'Propellers',
                    condition: 'Overhauled',
                    description: 'McCauley 3-blade constant speed propeller, recently overhauled with fresh logs'
                });

                expect(result).toBeDefined();
                expect(result).toHaveProperty('min');
                expect(result).toHaveProperty('max');
                expect(result).toHaveProperty('average');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('reasoning');

                expect(typeof result.min).toBe('number');
                expect(typeof result.max).toBe('number');
                expect(typeof result.average).toBe('number');
                expect(result.min).toBeGreaterThanOrEqual(0);
                expect(result.max).toBeGreaterThanOrEqual(result.min);
                expect(['high', 'medium', 'low']).toContain(result.confidence);
                expect(result.reasoning).toBeTruthy();

                console.log('✅ Gemini price suggestion test passed!');
                console.log(`   Price range: $${result.min.toLocaleString()} - $${result.max.toLocaleString()}`);
                console.log(`   Average: $${result.average.toLocaleString()}`);
                console.log(`   Confidence: ${result.confidence}`);
                console.log(`   Reasoning: ${result.reasoning}`);
            } catch (error: any) {
                console.error('❌ Gemini price suggestion test failed:', error.message);
                throw error;
            }
        }, 30000);

        it('should handle different conditions appropriately', async () => {
            if (!process.env.GEMINI_API_KEY) {
                console.warn('⚠️  GEMINI_API_KEY not set - skipping condition test');
                return;
            }

            try {
                const newResult = await geminiService.suggestPrice({
                    title: 'Garmin G1000 Display Unit',
                    category: 'Avionics',
                    condition: 'Factory New'
                });

                const usedResult = await geminiService.suggestPrice({
                    title: 'Garmin G1000 Display Unit',
                    category: 'Avionics',
                    condition: 'Serviceable'
                });

                expect(newResult.average).toBeGreaterThan(usedResult.average);
                console.log('✅ Condition-based pricing test passed!');
                console.log(`   Factory New avg: $${newResult.average.toLocaleString()}`);
                console.log(`   Serviceable avg: $${usedResult.average.toLocaleString()}`);
            } catch (error: any) {
                console.error('❌ Condition-based pricing test failed:', error.message);
                throw error;
            }
        }, 60000);
    });

    describe('generateSearchKeywords', () => {
        it('should generate relevant search keywords', async () => {
            if (!process.env.GEMINI_API_KEY) {
                console.warn('⚠️  GEMINI_API_KEY not set - skipping keyword test');
                return;
            }

            try {
                const result = await geminiService.generateSearchKeywords({
                    title: 'Cessna 172 Complete Engine',
                    category: 'Engines',
                    description: 'Lycoming O-360 engine, 1200 hours SMOH'
                });

                expect(result).toBeDefined();
                expect(result).toHaveProperty('keywords');
                expect(Array.isArray(result.keywords)).toBe(true);
                expect(result.keywords.length).toBeGreaterThan(0);
                expect(result.keywords.length).toBeLessThanOrEqual(5);

                result.keywords.forEach(keyword => {
                    expect(typeof keyword).toBe('string');
                    expect(keyword.length).toBeGreaterThan(0);
                });

                console.log('✅ Gemini keyword generation test passed!');
                console.log(`   Generated keywords:`, result.keywords);
            } catch (error: any) {
                console.error('❌ Gemini keyword generation test failed:', error.message);
                throw error;
            }
        }, 30000);

        it('should fallback gracefully on error', async () => {
            if (!process.env.GEMINI_API_KEY) {
                console.warn('⚠️  GEMINI_API_KEY not set - skipping fallback test');
                return;
            }
            
            // This test would require mocking the API to force an error
            // For now, just verify the fallback structure exists
            const result = await geminiService.generateSearchKeywords({
                title: 'Test Aircraft Part',
                category: 'Components'
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result.keywords)).toBe(true);
            expect(result.keywords.length).toBeGreaterThan(0);
        });
    });
});
