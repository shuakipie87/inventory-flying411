import { logger } from '../utils/logger';
import { geminiService } from './gemini.service';

export interface ColumnMappingEntry {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

export interface ColumnMapping {
  mappings: ColumnMappingEntry[];
  unmappedSource: string[];
  unmappedTarget: string[];
  aiUsed: boolean;
}

const TARGET_FIELDS = [
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
] as const;

type TargetField = (typeof TARGET_FIELDS)[number];

// Common aliases for each target field (all lowercase for comparison)
const ALIAS_MAP: Record<TargetField, string[]> = {
  partNumber: [
    'p/n', 'pn', 'part no', 'part no.', 'part_no', 'part_number', 'part number',
    'part#', 'part #', 'partnumber', 'partno', 'item number', 'item no', 'item no.',
    'item#', 'item #', 'sku', 'stock number', 'stock no',
  ],
  description: [
    'desc', 'desc.', 'item description', 'item desc', 'product description',
    'part description', 'title', 'name', 'item name', 'product name', 'part name',
  ],
  condition: [
    'cond', 'cond.', 'item condition', 'part condition', 'status',
    'condition code', 'cond code',
  ],
  quantity: [
    'qty', 'qty.', 'quantity', 'qty available', 'quantity available',
    'stock', 'stock qty', 'on hand', 'count', 'units',
  ],
  price: [
    'unit price', 'price', 'unit cost', 'cost', 'amount', 'rate',
    'selling price', 'list price', 'sale price', 'usd', 'price (usd)',
    'price usd', 'unit_price',
  ],
  manufacturer: [
    'mfg', 'mfg.', 'mfr', 'mfr.', 'manufacturer', 'oem', 'make', 'brand',
    'vendor', 'supplier', 'produced by', 'manufacturer name',
  ],
  category: [
    'cat', 'cat.', 'type', 'item type', 'product type', 'part type',
    'classification', 'class',
  ],
  aircraftApplicability: [
    'aircraft', 'a/c', 'aircraft type', 'aircraft applicability',
    'aircraft application', 'applies to aircraft', 'a/c type', 'airframe',
    'aircraft model',
  ],
  engineApplicability: [
    'engine', 'engine type', 'engine applicability', 'engine application',
    'applies to engine', 'engine model', 'power plant',
  ],
  location: [
    'loc', 'loc.', 'warehouse', 'warehouse location', 'storage',
    'storage location', 'bin', 'shelf', 'rack', 'site',
  ],
  notes: [
    'note', 'remarks', 'remark', 'comment', 'comments', 'additional info',
    'additional notes', 'memo', 'details',
  ],
  certificationStatus: [
    'cert', 'cert.', 'certification', 'cert status', 'certificate',
    'trace', 'traceability', '8130', 'easa form 1', 'serviceable tag',
    'tag', 'release', 'document',
  ],
};

export class ColumnMapperService {

  async mapColumns(
    headers: string[],
    sampleRows: Record<string, string>[]
  ): Promise<ColumnMapping> {
    const mappings: ColumnMappingEntry[] = [];
    const mappedSources = new Set<string>();
    const mappedTargets = new Set<string>();
    let aiUsed = false;

    // Phase 1: Exact match (case-insensitive)
    for (const header of headers) {
      const normalized = header.toLowerCase().trim();
      for (const field of TARGET_FIELDS) {
        if (mappedTargets.has(field)) continue;
        if (normalized === field.toLowerCase()) {
          mappings.push({ sourceColumn: header, targetField: field, confidence: 1.0 });
          mappedSources.add(header);
          mappedTargets.add(field);
          break;
        }
      }
    }

    // Phase 2: Alias match
    for (const header of headers) {
      if (mappedSources.has(header)) continue;
      const normalized = header.toLowerCase().trim();
      for (const field of TARGET_FIELDS) {
        if (mappedTargets.has(field)) continue;
        const aliases = ALIAS_MAP[field];
        if (aliases.some((alias) => alias === normalized)) {
          mappings.push({ sourceColumn: header, targetField: field, confidence: 0.95 });
          mappedSources.add(header);
          mappedTargets.add(field);
          break;
        }
      }
    }

    // Phase 3: AI mapping for remaining unmapped columns
    const unmappedHeaders = headers.filter((h) => !mappedSources.has(h));
    const unmappedTargetFields = TARGET_FIELDS.filter((f) => !mappedTargets.has(f));

    if (unmappedHeaders.length > 0 && unmappedTargetFields.length > 0) {
      try {
        const aiResult = await geminiService.mapColumns(unmappedHeaders, sampleRows);
        aiUsed = true;

        for (const mapping of aiResult.mappings) {
          if (mappedSources.has(mapping.source) || mappedTargets.has(mapping.target)) continue;
          if (!TARGET_FIELDS.includes(mapping.target as TargetField)) continue;
          if (!unmappedHeaders.includes(mapping.source)) continue;

          mappings.push({
            sourceColumn: mapping.source,
            targetField: mapping.target,
            confidence: mapping.confidence,
          });
          mappedSources.add(mapping.source);
          mappedTargets.add(mapping.target);
        }
      } catch (error: any) {
        logger.warn('AI column mapping failed, falling back to fuzzy match:', error.message);
      }
    }

    // Phase 4: Fuzzy match for any remaining
    const stillUnmappedHeaders = headers.filter((h) => !mappedSources.has(h));
    const stillUnmappedTargets = TARGET_FIELDS.filter((f) => !mappedTargets.has(f));

    for (const header of stillUnmappedHeaders) {
      if (stillUnmappedTargets.length === 0) break;
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      let bestMatch: TargetField | null = null;
      let bestScore = 0;

      for (const field of stillUnmappedTargets) {
        if (mappedTargets.has(field)) continue;
        const normalizedField = field.toLowerCase();

        // Check against field name and all aliases
        const candidates = [normalizedField, ...ALIAS_MAP[field].map((a) => a.replace(/[^a-z0-9]/g, ''))];

        for (const candidate of candidates) {
          const score = this.fuzzyScore(normalizedHeader, candidate);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = field;
          }
        }
      }

      // Only accept fuzzy matches with reasonable similarity
      if (bestMatch && bestScore >= 0.6) {
        const confidence = 0.5 + (bestScore - 0.6) * 0.5; // Map 0.6-1.0 -> 0.5-0.7
        mappings.push({
          sourceColumn: header,
          targetField: bestMatch,
          confidence: Math.min(0.7, Math.max(0.5, Number(confidence.toFixed(2)))),
        });
        mappedSources.add(header);
        mappedTargets.add(bestMatch);
        stillUnmappedTargets.splice(stillUnmappedTargets.indexOf(bestMatch), 1);
      }
    }

    const unmappedSource = headers.filter((h) => !mappedSources.has(h));
    const unmappedTarget = TARGET_FIELDS.filter((f) => !mappedTargets.has(f));

    logger.info(
      `Column mapping: ${mappings.length} mapped, ${unmappedSource.length} unmapped source, ${unmappedTarget.length} unmapped target, AI used: ${aiUsed}`
    );

    return {
      mappings,
      unmappedSource,
      unmappedTarget: [...unmappedTarget],
      aiUsed,
    };
  }

  /**
   * Normalized Levenshtein-based similarity score between two strings.
   * Returns a value between 0 (no match) and 1 (exact match).
   */
  private fuzzyScore(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const maxLen = Math.max(a.length, b.length);
    const distance = this.levenshtein(a, b);
    return 1 - distance / maxLen;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[] = new Array(n + 1);

    for (let j = 0; j <= n; j++) dp[j] = j;

    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        if (a[i - 1] === b[j - 1]) {
          dp[j] = prev;
        } else {
          dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
        }
        prev = temp;
      }
    }

    return dp[n];
  }
}

export const columnMapperService = new ColumnMapperService();
