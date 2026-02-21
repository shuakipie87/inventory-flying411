import fs from 'fs/promises';
import { parse as csvParse } from 'csv-parse';
import * as XLSX from 'xlsx';
import pdf from 'pdf-parse';
import { Readable } from 'stream';
import { logger } from '../utils/logger';
import { geminiService } from './gemini.service';

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  parseWarnings: string[];
}

interface ParseOptions {
  maxFileSizeBytes?: number;
  maxRows?: number;
  sheetName?: string;
}

const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const DEFAULT_MAX_ROWS = 10_000;

export class FileParserService {
  private maxFileSizeBytes: number;
  private maxRows: number;

  constructor(options?: ParseOptions) {
    this.maxFileSizeBytes = options?.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE;
    this.maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS;
  }

  async parseFile(filePath: string, mimeType: string, options?: ParseOptions): Promise<ParseResult> {
    const stat = await fs.stat(filePath);
    const maxSize = options?.maxFileSizeBytes ?? this.maxFileSizeBytes;
    if (stat.size > maxSize) {
      throw new Error(`File exceeds maximum allowed size of ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    const effectiveMime = mimeType.toLowerCase();

    if (effectiveMime === 'text/csv' || effectiveMime === 'application/csv') {
      return this.parseCsv(filePath, options);
    }

    if (
      effectiveMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      effectiveMime === 'application/vnd.ms-excel'
    ) {
      return this.parseExcel(filePath, options);
    }

    if (effectiveMime === 'application/pdf') {
      return this.parsePdf(filePath, options);
    }

    if (effectiveMime === 'application/x-iwork-pages-sffpages') {
      return this.parsePages(filePath, options);
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  private async parseCsv(filePath: string, options?: ParseOptions): Promise<ParseResult> {
    const maxRows = options?.maxRows ?? this.maxRows;
    const warnings: string[] = [];

    const rawBuffer = await fs.readFile(filePath);
    const content = this.stripBom(rawBuffer);

    return new Promise<ParseResult>((resolve, reject) => {
      const records: string[][] = [];
      let headers: string[] = [];

      const parser = csvParse({
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      parser.on('readable', () => {
        let record: string[];
        while ((record = parser.read()) !== null) {
          if (headers.length === 0) {
            headers = record.map((h) => h.trim());
          } else {
            records.push(record);
          }
        }
      });

      parser.on('error', (err) => {
        logger.error('CSV parse error:', err.message);
        reject(new Error(`CSV parsing failed: ${err.message}`));
      });

      parser.on('end', () => {
        if (headers.length === 0) {
          reject(new Error('CSV file is empty or contains no headers'));
          return;
        }

        if (records.length > maxRows) {
          warnings.push(`File contains ${records.length} rows; truncated to ${maxRows}`);
        }

        const truncated = records.slice(0, maxRows);
        const rows = truncated.map((record, rowIndex) => {
          const row: Record<string, string> = {};
          if (record.length !== headers.length) {
            warnings.push(`Row ${rowIndex + 2} has ${record.length} columns, expected ${headers.length}`);
          }
          for (let i = 0; i < headers.length; i++) {
            row[headers[i]] = (record[i] ?? '').trim();
          }
          return row;
        });

        resolve({
          headers,
          rows,
          totalRows: records.length,
          parseWarnings: warnings,
        });
      });

      const stream = Readable.from(content);
      stream.pipe(parser);
    });
  }

  private async parseExcel(filePath: string, options?: ParseOptions): Promise<ParseResult> {
    const maxRows = options?.maxRows ?? this.maxRows;
    const warnings: string[] = [];

    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheetName = options?.sheetName ?? workbook.SheetNames[0];
    if (!sheetName || !workbook.SheetNames.includes(sheetName)) {
      throw new Error(
        `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Filter out completely empty rows
    const nonEmptyData = rawData.filter((row) => row.some((cell) => String(cell).trim() !== ''));

    if (nonEmptyData.length === 0) {
      throw new Error('Excel sheet is empty');
    }

    const headers = nonEmptyData[0].map((h) => String(h).trim());
    const dataRows = nonEmptyData.slice(1);

    if (dataRows.length > maxRows) {
      warnings.push(`Sheet contains ${dataRows.length} rows; truncated to ${maxRows}`);
    }

    const truncated = dataRows.slice(0, maxRows);
    const rows = truncated.map((record, rowIndex) => {
      const row: Record<string, string> = {};
      if (record.length !== headers.length) {
        warnings.push(`Row ${rowIndex + 2} has ${record.length} columns, expected ${headers.length}`);
      }
      for (let i = 0; i < headers.length; i++) {
        row[headers[i]] = String(record[i] ?? '').trim();
      }
      return row;
    });

    return {
      headers,
      rows,
      totalRows: dataRows.length,
      parseWarnings: warnings,
    };
  }

  private async parsePdf(filePath: string, options?: ParseOptions): Promise<ParseResult> {
    const maxRows = options?.maxRows ?? this.maxRows;
    const warnings: string[] = [];

    const buffer = await fs.readFile(filePath);
    const pdfData = await pdf(buffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('PDF contains no extractable text');
    }

    // Try simple tabular extraction first (tab or multi-space delimited lines)
    const tabularResult = this.tryTabularExtraction(pdfData.text, maxRows);
    if (tabularResult) {
      tabularResult.parseWarnings.push('Extracted tabular data from PDF text');
      return tabularResult;
    }

    // Fall back to AI extraction via Gemini
    warnings.push('PDF does not contain obvious tabular data; using AI extraction');
    return this.extractWithAi(pdfData.text, maxRows, warnings);
  }

  private async parsePages(filePath: string, options?: ParseOptions): Promise<ParseResult> {
    const maxRows = options?.maxRows ?? this.maxRows;
    const warnings: string[] = [];
    warnings.push('Pages file detected; using AI extraction (limited support)');

    // Pages files are zip archives. Try to read any embedded text content.
    let textContent = '';
    try {
      const buffer = await fs.readFile(filePath);
      // Attempt to find readable text strings in the binary content
      textContent = buffer
        .toString('utf-8')
        .replace(/[^\x20-\x7E\n\t]/g, ' ')
        .replace(/\s{3,}/g, '\n')
        .trim();
    } catch {
      throw new Error('Unable to read Pages file content');
    }

    if (textContent.length < 10) {
      throw new Error('Pages file contains no extractable text content');
    }

    return this.extractWithAi(textContent, maxRows, warnings);
  }

  private tryTabularExtraction(text: string, maxRows: number): ParseResult | null {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return null;

    // Detect delimiter: tab first, then multi-space
    let delimiter: RegExp;
    const tabCount = (lines[0].match(/\t/g) || []).length;
    if (tabCount >= 2) {
      delimiter = /\t+/;
    } else {
      const multiSpaceCount = (lines[0].match(/ {2,}/g) || []).length;
      if (multiSpaceCount >= 2) {
        delimiter = / {2,}/;
      } else {
        return null;
      }
    }

    const headers = lines[0].split(delimiter).map((h) => h.trim());
    if (headers.length < 2) return null;

    const warnings: string[] = [];
    const dataLines = lines.slice(1);

    // Verify that a reasonable fraction of rows match the header column count
    const matchCount = dataLines.filter(
      (line) => Math.abs(line.split(delimiter).length - headers.length) <= 1
    ).length;
    if (matchCount < dataLines.length * 0.5) return null;

    if (dataLines.length > maxRows) {
      warnings.push(`PDF contains ${dataLines.length} rows; truncated to ${maxRows}`);
    }

    const truncated = dataLines.slice(0, maxRows);
    const rows = truncated.map((line, rowIndex) => {
      const cells = line.split(delimiter);
      const row: Record<string, string> = {};
      if (cells.length !== headers.length) {
        warnings.push(`Row ${rowIndex + 2} has ${cells.length} columns, expected ${headers.length}`);
      }
      for (let i = 0; i < headers.length; i++) {
        row[headers[i]] = (cells[i] ?? '').trim();
      }
      return row;
    });

    return {
      headers,
      rows,
      totalRows: dataLines.length,
      parseWarnings: warnings,
    };
  }

  private async extractWithAi(
    text: string,
    maxRows: number,
    warnings: string[]
  ): Promise<ParseResult> {
    // Truncate very long text to avoid exceeding AI context limits
    const truncatedText = text.length > 15_000 ? text.slice(0, 15_000) : text;
    if (text.length > 15_000) {
      warnings.push('Text content truncated to 15,000 characters for AI processing');
    }

    const prompt = `You are a data extraction specialist for an aviation parts inventory system.

Extract structured tabular data from the following text. Identify column headers and data rows.

TEXT:
${truncatedText}

Rules:
1. Identify the most likely column headers from the text
2. Extract each data row as an object with those headers as keys
3. Clean up values (trim whitespace, normalize formatting)
4. If the text contains aviation inventory data (parts, aircraft, engines), prioritize those fields
5. Maximum ${maxRows} rows

Respond with ONLY valid JSON, no markdown formatting, no code blocks:
{"headers": ["col1", "col2", ...], "rows": [{"col1": "val1", "col2": "val2"}, ...]}`;

    try {
      const model = (geminiService as any).getModel();
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const jsonStr = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed.headers) || !Array.isArray(parsed.rows)) {
        throw new Error('AI response missing headers or rows');
      }

      const headers: string[] = parsed.headers.map((h: unknown) => String(h));
      const rawRows: Record<string, string>[] = parsed.rows.slice(0, maxRows).map(
        (r: Record<string, unknown>) => {
          const row: Record<string, string> = {};
          for (const h of headers) {
            row[h] = String(r[h] ?? '');
          }
          return row;
        }
      );

      warnings.push('Data extracted using AI — please verify accuracy');

      return {
        headers,
        rows: rawRows,
        totalRows: rawRows.length,
        parseWarnings: warnings,
      };
    } catch (error: any) {
      logger.error('AI text extraction failed:', error.message);
      throw new Error(`Failed to extract structured data: ${error.message}`);
    }
  }

  private stripBom(buffer: Buffer): string {
    const str = buffer.toString('utf-8');
    // Remove UTF-8 BOM if present
    if (str.charCodeAt(0) === 0xfeff) {
      return str.slice(1);
    }
    return str;
  }
}

export const fileParserService = new FileParserService();
