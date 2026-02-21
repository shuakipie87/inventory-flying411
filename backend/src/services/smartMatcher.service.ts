import { Part, Aircraft, Engine } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PartMatchResult {
  partId: string;
  confidence: number;
  matchType: 'exact' | 'normalized' | 'fuzzy';
  partNumber: string;
}

export interface AircraftMatchResult {
  aircraftId: string;
  confidence: number;
}

export interface EngineMatchResult {
  engineId: string;
  confidence: number;
}

export interface MatchResult {
  partMatch: PartMatchResult | null;
  aircraftMatch: AircraftMatchResult | null;
  engineMatch: EngineMatchResult | null;
  enrichedData: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a part number by stripping dashes, spaces, and leading zeros.
 * Used on both the input and DB values so they can be compared apples-to-apples.
 */
function normalizePartNumber(raw: string): string {
  return raw
    .replace(/[-\s]/g, '')  // strip dashes and spaces
    .replace(/^0+/, '')     // strip leading zeros
    .toUpperCase();
}

/**
 * Very lightweight similarity score between two lowercase strings.
 * Returns a value between 0 and 1.
 */
function simpleSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;

  // If the shorter string is fully contained in the longer one, score based
  // on length ratio so that closer lengths score higher.
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SmartMatcherService {
  // In-memory caches for batch processing – populated by prefetch()
  private partsCache: Part[] | null = null;
  private aircraftCache: Aircraft[] | null = null;
  private enginesCache: Engine[] | null = null;

  // Lookup maps built during prefetch for O(1) exact / normalized matching
  private partByExact: Map<string, Part> = new Map();
  private partByNormalized: Map<string, Part> = new Map();
  private partByAlternate: Map<string, Part> = new Map();
  private partByAlternateNormalized: Map<string, Part> = new Map();

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Match a single mapped row against the Part, Aircraft, and Engine tables.
   */
  async matchRow(mappedData: Record<string, string>): Promise<MatchResult> {
    // Ensure caches are populated
    await this.prefetch();

    const partMatch = this.matchPart(mappedData);
    const aircraftMatch = this.matchAircraft(mappedData);
    const engineMatch = this.matchEngine(mappedData);

    const enrichedData: Record<string, any> = { ...mappedData };

    if (partMatch) {
      const part = this.getPartById(partMatch.partId);
      if (part) {
        if (!enrichedData.description) enrichedData.description = part.description;
        if (!enrichedData.category) enrichedData.category = part.category;
        if (!enrichedData.manufacturer) enrichedData.manufacturer = part.manufacturer;
        if (part.model && !enrichedData.model) enrichedData.model = part.model;
      }
    }

    return { partMatch, aircraftMatch, engineMatch, enrichedData };
  }

  /**
   * Batch-match an array of rows. Pre-fetches all reference data once and then
   * performs in-memory matching for each row.
   */
  async matchRows(rows: Record<string, string>[]): Promise<MatchResult[]> {
    await this.prefetch();

    const results: MatchResult[] = [];
    for (const row of rows) {
      const partMatch = this.matchPart(row);
      const aircraftMatch = this.matchAircraft(row);
      const engineMatch = this.matchEngine(row);

      const enrichedData: Record<string, any> = { ...row };

      if (partMatch) {
        const part = this.getPartById(partMatch.partId);
        if (part) {
          if (!enrichedData.description) enrichedData.description = part.description;
          if (!enrichedData.category) enrichedData.category = part.category;
          if (!enrichedData.manufacturer) enrichedData.manufacturer = part.manufacturer;
          if (part.model && !enrichedData.model) enrichedData.model = part.model;
        }
      }

      results.push({ partMatch, aircraftMatch, engineMatch, enrichedData });
    }

    return results;
  }

  /**
   * Clear the in-memory caches so the next call re-fetches from the DB.
   */
  clearCache(): void {
    this.partsCache = null;
    this.aircraftCache = null;
    this.enginesCache = null;
    this.partByExact.clear();
    this.partByNormalized.clear();
    this.partByAlternate.clear();
    this.partByAlternateNormalized.clear();
  }

  // ------------------------------------------------------------------
  // Prefetch
  // ------------------------------------------------------------------

  private async prefetch(): Promise<void> {
    if (this.partsCache && this.aircraftCache && this.enginesCache) {
      return; // already loaded
    }

    logger.info('SmartMatcher: prefetching reference data');

    const [parts, aircraft, engines] = await Promise.all([
      prisma.part.findMany(),
      prisma.aircraft.findMany(),
      prisma.engine.findMany(),
    ]);

    this.partsCache = parts;
    this.aircraftCache = aircraft;
    this.enginesCache = engines;

    // Build lookup maps
    this.partByExact.clear();
    this.partByNormalized.clear();
    this.partByAlternate.clear();
    this.partByAlternateNormalized.clear();

    for (const part of parts) {
      // Primary part number
      this.partByExact.set(part.partNumber.toUpperCase(), part);
      this.partByNormalized.set(normalizePartNumber(part.partNumber), part);

      // Alternate part numbers
      if (part.alternates && part.alternates.length > 0) {
        for (const alt of part.alternates) {
          const altUpper = alt.toUpperCase();
          if (!this.partByAlternate.has(altUpper)) {
            this.partByAlternate.set(altUpper, part);
          }
          const altNormalized = normalizePartNumber(alt);
          if (!this.partByAlternateNormalized.has(altNormalized)) {
            this.partByAlternateNormalized.set(altNormalized, part);
          }
        }
      }
    }

    logger.info(
      `SmartMatcher: loaded ${parts.length} parts, ${aircraft.length} aircraft, ${engines.length} engines`
    );
  }

  // ------------------------------------------------------------------
  // Part matching
  // ------------------------------------------------------------------

  private matchPart(row: Record<string, string>): PartMatchResult | null {
    const rawPartNumber = (row.partNumber || row.part_number || row.pn || '').trim();
    if (!rawPartNumber) return null;

    const rowManufacturer = (
      row.manufacturer || row.mfg || row.mfr || ''
    ).trim().toUpperCase();

    // --- (a) Exact match on primary part number ---
    const exactKey = rawPartNumber.toUpperCase();
    const exactHit = this.partByExact.get(exactKey);
    if (exactHit) {
      return {
        partId: exactHit.id,
        confidence: 1.0,
        matchType: 'exact',
        partNumber: exactHit.partNumber,
      };
    }

    // Also check alternates for exact match
    const altExactHit = this.partByAlternate.get(exactKey);
    if (altExactHit) {
      return {
        partId: altExactHit.id,
        confidence: 0.95,
        matchType: 'exact',
        partNumber: altExactHit.partNumber,
      };
    }

    // --- (b) Normalized match ---
    const normalizedKey = normalizePartNumber(rawPartNumber);
    if (normalizedKey.length > 0) {
      const normalizedHit = this.partByNormalized.get(normalizedKey);
      if (normalizedHit) {
        return {
          partId: normalizedHit.id,
          confidence: 0.9,
          matchType: 'normalized',
          partNumber: normalizedHit.partNumber,
        };
      }

      // Alternates – normalized
      const altNormalizedHit = this.partByAlternateNormalized.get(normalizedKey);
      if (altNormalizedHit) {
        return {
          partId: altNormalizedHit.id,
          confidence: 0.85,
          matchType: 'normalized',
          partNumber: altNormalizedHit.partNumber,
        };
      }
    }

    // --- (c) Fuzzy / contains match ---
    return this.fuzzyMatchPart(rawPartNumber, rowManufacturer);
  }

  /**
   * Attempt a fuzzy match using substring containment. If a manufacturer is
   * available, matches that also agree on manufacturer get a higher confidence
   * score.
   */
  private fuzzyMatchPart(
    rawPartNumber: string,
    rowManufacturer: string
  ): PartMatchResult | null {
    if (!this.partsCache) return null;

    const normalizedInput = normalizePartNumber(rawPartNumber);
    if (normalizedInput.length < 3) return null; // too short for fuzzy matching

    let bestPart: Part | null = null;
    let bestScore = 0;

    for (const part of this.partsCache) {
      const normalizedDb = normalizePartNumber(part.partNumber);
      const sim = simpleSimilarity(normalizedInput, normalizedDb);
      if (sim <= 0) continue;

      let score = sim;

      // Boost score if manufacturer matches
      if (rowManufacturer && part.manufacturer.toUpperCase().includes(rowManufacturer)) {
        score = Math.min(score + 0.15, 0.75);
      }

      if (score > bestScore) {
        bestScore = score;
        bestPart = part;
      }
    }

    if (!bestPart || bestScore < 0.3) return null;

    // Clamp confidence to 0.5–0.7 range for fuzzy matches
    const confidence = Math.min(Math.max(bestScore, 0.5), 0.7);

    return {
      partId: bestPart.id,
      confidence: Number(confidence.toFixed(2)),
      matchType: 'fuzzy',
      partNumber: bestPart.partNumber,
    };
  }

  // ------------------------------------------------------------------
  // Aircraft matching
  // ------------------------------------------------------------------

  private matchAircraft(row: Record<string, string>): AircraftMatchResult | null {
    const applicability = (
      row.aircraftApplicability || row.aircraft_applicability || row.aircraft || ''
    ).trim();
    if (!applicability || !this.aircraftCache) return null;

    const inputUpper = applicability.toUpperCase();

    // Try to extract manufacturer and model from the applicability string.
    // Common formats: "Cessna 172", "Boeing 737-800", "Piper PA-28"
    let bestMatch: Aircraft | null = null;
    let bestConfidence = 0;

    for (const ac of this.aircraftCache) {
      const acMfg = ac.manufacturer.toUpperCase();
      const acModel = ac.model.toUpperCase();

      // Best case: both manufacturer and model appear in the input
      if (inputUpper.includes(acMfg) && inputUpper.includes(acModel)) {
        const confidence = 0.95;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = ac;
        }
        continue;
      }

      // Model-only match (common when manufacturer is implied)
      if (inputUpper.includes(acModel) && acModel.length >= 2) {
        const confidence = 0.7;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = ac;
        }
        continue;
      }

      // Check type designator if available
      if (ac.typeDesignator) {
        const td = ac.typeDesignator.toUpperCase();
        if (inputUpper.includes(td) && td.length >= 3) {
          const confidence = 0.8;
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = ac;
          }
        }
      }
    }

    if (!bestMatch || bestConfidence < 0.5) return null;

    return {
      aircraftId: bestMatch.id,
      confidence: bestConfidence,
    };
  }

  // ------------------------------------------------------------------
  // Engine matching
  // ------------------------------------------------------------------

  private matchEngine(row: Record<string, string>): EngineMatchResult | null {
    const applicability = (
      row.engineApplicability || row.engine_applicability || row.engine || ''
    ).trim();
    if (!applicability || !this.enginesCache) return null;

    const inputUpper = applicability.toUpperCase();

    let bestMatch: Engine | null = null;
    let bestConfidence = 0;

    for (const eng of this.enginesCache) {
      const engMfg = eng.manufacturer.toUpperCase();
      const engModel = eng.model.toUpperCase();

      if (inputUpper.includes(engMfg) && inputUpper.includes(engModel)) {
        const confidence = 0.95;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = eng;
        }
        continue;
      }

      if (inputUpper.includes(engModel) && engModel.length >= 2) {
        const confidence = 0.7;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = eng;
        }
        continue;
      }

      if (eng.typeDesignator) {
        const td = eng.typeDesignator.toUpperCase();
        if (inputUpper.includes(td) && td.length >= 3) {
          const confidence = 0.8;
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = eng;
          }
        }
      }
    }

    if (!bestMatch || bestConfidence < 0.5) return null;

    return {
      engineId: bestMatch.id,
      confidence: bestConfidence,
    };
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  private getPartById(id: string): Part | null {
    if (!this.partsCache) return null;
    return this.partsCache.find((p) => p.id === id) ?? null;
  }
}

export const smartMatcherService = new SmartMatcherService();
