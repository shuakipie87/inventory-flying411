import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

interface PriceSuggestionInput {
    title: string;
    category: string;
    condition: string;
    description?: string;
}

interface PriceSuggestionResult {
    min: number;
    max: number;
    average: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
}

interface ImageKeywordsResult {
    keywords: string[];
}

export interface AiColumnMapping {
    source: string;
    target: string;
    confidence: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private modelName = 'gemini-2.0-flash';

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            logger.info('Gemini AI service initialized');
        } else {
            logger.warn('GEMINI_API_KEY not set - AI features will be unavailable');
        }
    }

    private getModel() {
        if (!this.genAI) {
            throw new Error('Gemini AI service not configured. Set GEMINI_API_KEY environment variable.');
        }
        return this.genAI.getGenerativeModel({ model: this.modelName });
    }

    async suggestPrice(input: PriceSuggestionInput): Promise<PriceSuggestionResult> {
        const model = this.getModel();

        const prompt = `You are a senior aviation parts pricing analyst with 20+ years of experience in the aircraft aftermarket. You have deep knowledge of current market values for aircraft, engines, and components.

Analyze the following aviation listing and provide an accurate fair market price estimate in USD:

**Listing Details:**
- Title: ${input.title}
- Category: ${input.category}
- Condition: ${input.condition}
${input.description ? `- Description: ${input.description}` : ''}

**Pricing Guidelines:**
1. Factor in the condition hierarchy: Factory New (highest) > New > Like New > Excellent > Overhauled > Good > Serviceable > As Removed > Fair (lowest)
2. Consider current aviation aftermarket trends and typical price ranges for ${input.category.toLowerCase()}
3. For complete aircraft, prices range from $50,000 to $50,000,000+ depending on type
4. For engines, prices range from $10,000 to $10,000,000+ depending on type and hours
5. For parts/components, prices range from $50 to $500,000+ depending on criticality
6. If the item is extremely rare or typically sold via negotiation only, use 0.01 for all prices (indicates "Call For Price")
7. Set confidence to "high" if you recognize the specific part/model, "medium" for general category estimates, "low" if highly uncertain

Respond with ONLY valid JSON, no markdown formatting, no code blocks:
{"min": <number>, "max": <number>, "average": <number>, "confidence": "<high|medium|low>", "reasoning": "<1-2 sentence explanation>"}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            // Strip markdown code blocks if present
            const jsonStr = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(jsonStr);

            // Validate the response
            if (typeof parsed.min !== 'number' || typeof parsed.max !== 'number' || typeof parsed.average !== 'number') {
                throw new Error('Invalid price format in AI response');
            }

            return {
                min: Math.max(0, parsed.min),
                max: Math.max(parsed.min, parsed.max),
                average: Math.max(0, parsed.average),
                confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
                reasoning: parsed.reasoning || 'Price estimate based on market analysis.',
            };
        } catch (error: any) {
            logger.error('Gemini price suggestion failed:', error.message);
            throw new Error(`AI price suggestion failed: ${error.message}`);
        }
    }

    async generateSearchKeywords(input: { title: string; category: string; description?: string }): Promise<ImageKeywordsResult> {
        const model = this.getModel();

        const prompt = `You are helping find relevant stock photography for an aviation marketplace listing.

**Listing Details:**
- Title: ${input.title}
- Category: ${input.category}
${input.description ? `- Description: ${input.description}` : ''}

Generate 4 optimized search queries for finding relevant FREE stock photos on Unsplash. The queries should:
1. Focus on the specific aircraft/engine/part type mentioned
2. Include aviation-related visual terms (cockpit, hangar, runway, maintenance, etc.)
3. Be broad enough to return results but specific enough to be relevant
4. Prioritize professional, high-quality aviation imagery

Respond with ONLY valid JSON, no markdown formatting, no code blocks:
{"keywords": ["query1", "query2", "query3", "query4"]}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            const jsonStr = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(jsonStr);

            if (!Array.isArray(parsed.keywords) || parsed.keywords.length === 0) {
                throw new Error('Invalid keywords format in AI response');
            }

            return { keywords: parsed.keywords.slice(0, 5) };
        } catch (error: any) {
            logger.error('Gemini keyword generation failed:', error.message);
            // Fallback to basic keywords
            return {
                keywords: [
                    `${input.category.toLowerCase()} aviation`,
                    `${input.title.split(' ').slice(0, 3).join(' ')}`,
                    'aircraft maintenance',
                    'aviation parts',
                ],
            };
        }
    }
    async mapColumns(
        headers: string[],
        sampleRows: Record<string, string>[]
    ): Promise<{ mappings: AiColumnMapping[] }> {
        const model = this.getModel();

        const targetFields = [
            'partNumber',
            'description',
            'condition',
            'quantity',
            'price',
            'manufacturer',
            'category',
            'aircraftApplicability',
            'engineApplicability',
            'location',
            'notes',
            'certificationStatus',
        ];

        const sampleData = sampleRows.slice(0, 3).map((row) => {
            const obj: Record<string, string> = {};
            for (const h of headers) {
                obj[h] = row[h] ?? '';
            }
            return obj;
        });

        const prompt = `You are a data mapping specialist for an aviation parts inventory system.

Given these column headers and sample data from an uploaded file, map each source column to the most appropriate target field.

**Source columns:** ${JSON.stringify(headers)}

**Sample data (up to 3 rows):**
${JSON.stringify(sampleData, null, 2)}

**Target fields (our system):**
- partNumber: Part number / P/N
- description: Item description / title
- condition: Item condition (New, Overhauled, Serviceable, As Removed, etc.)
- quantity: Quantity available
- price: Unit price in USD
- manufacturer: Manufacturer / OEM name
- category: Category (Aircraft, Engines, Parts, etc.)
- aircraftApplicability: Aircraft types this part fits
- engineApplicability: Engine types this part fits
- location: Physical location / warehouse
- notes: Additional notes or remarks
- certificationStatus: Certification status (8130, EASA Form 1, etc.)

Rules:
1. Map each source column to at most one target field
2. Only map if there's reasonable evidence from headers and data
3. Set confidence between 0.6 and 0.9 based on how certain you are
4. Leave unmapped any columns that don't match a target field
5. Do NOT map multiple source columns to the same target

Respond with ONLY valid JSON, no markdown formatting, no code blocks:
{"mappings": [{"source": "column_name", "target": "targetField", "confidence": 0.8}, ...]}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            const jsonStr = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(jsonStr);

            if (!Array.isArray(parsed.mappings)) {
                throw new Error('AI response missing mappings array');
            }

            const validMappings: AiColumnMapping[] = parsed.mappings
                .filter(
                    (m: any) =>
                        typeof m.source === 'string' &&
                        typeof m.target === 'string' &&
                        typeof m.confidence === 'number' &&
                        headers.includes(m.source) &&
                        targetFields.includes(m.target)
                )
                .map((m: any) => ({
                    source: m.source,
                    target: m.target,
                    confidence: Math.min(0.9, Math.max(0.6, m.confidence)),
                }));

            return { mappings: validMappings };
        } catch (error: any) {
            logger.error('Gemini column mapping failed:', error.message);
            return { mappings: [] };
        }
    }
}

export const geminiService = new GeminiService();
