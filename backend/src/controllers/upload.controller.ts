import { Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { fileParserService } from '../services/fileParser.service';
import { columnMapperService } from '../services/columnMapper.service';
import { smartMatcherService } from '../services/smartMatcher.service';
import { logger } from '../utils/logger';
import { UploadStatus, UploadRowStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// POST /api/upload/session  — Create upload session (multipart file)
// ---------------------------------------------------------------------------
export const createSession = async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new AppError('No file uploaded', 400);
  }

  const session = await prisma.uploadSession.create({
    data: {
      userId: req.user!.id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: UploadStatus.PENDING,
    },
  });

  logger.info(`Upload session created: ${session.id} by user ${req.user!.id}`);

  res.status(201).json({
    status: 'success',
    data: {
      sessionId: session.id,
      filename: session.originalName,
      mimeType: session.mimeType,
      fileSize: session.fileSize,
    },
  });
};

// ---------------------------------------------------------------------------
// POST /api/upload/session/:id/parse  — Parse uploaded file
// ---------------------------------------------------------------------------
export const parseSession = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);

  if (session.status !== UploadStatus.PENDING) {
    throw new AppError(`Cannot parse session in status ${session.status}`, 400);
  }

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: { status: UploadStatus.PARSING },
  });

  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const filePath = `${uploadDir}/${session.filename}`;

  try {
    const result = await fileParserService.parseFile(filePath, session.mimeType);

    await prisma.uploadSession.update({
      where: { id: session.id },
      data: {
        status: UploadStatus.MAPPING,
        totalRows: result.totalRows,
      },
    });

    res.json({
      status: 'success',
      data: {
        headers: result.headers,
        sampleRows: result.rows.slice(0, 5),
        totalRows: result.totalRows,
        parseWarnings: result.parseWarnings,
      },
    });
  } catch (error: any) {
    await prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: UploadStatus.FAILED },
    });
    throw new AppError(`File parsing failed: ${error.message}`, 400);
  }
};

// ---------------------------------------------------------------------------
// POST /api/upload/session/:id/map  — AI column mapping
// ---------------------------------------------------------------------------
export const mapColumns = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);

  if (session.status !== UploadStatus.MAPPING) {
    throw new AppError(`Cannot map columns in status ${session.status}`, 400);
  }

  const { headers, sampleRows } = req.body;
  if (!Array.isArray(headers) || !Array.isArray(sampleRows)) {
    throw new AppError('headers and sampleRows arrays are required', 400);
  }

  const mapping = await columnMapperService.mapColumns(headers, sampleRows);

  res.json({
    status: 'success',
    data: mapping,
  });
};

// ---------------------------------------------------------------------------
// PUT /api/upload/session/:id/mapping  — Save confirmed mapping
// ---------------------------------------------------------------------------
export const saveMapping = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);

  if (session.status !== UploadStatus.MAPPING) {
    throw new AppError(`Cannot save mapping in status ${session.status}`, 400);
  }

  const { mappings } = req.body;
  if (!Array.isArray(mappings)) {
    throw new AppError('mappings array is required', 400);
  }

  const avgConfidence =
    mappings.length > 0
      ? mappings.reduce((sum: number, m: any) => sum + (m.confidence ?? 0), 0) / mappings.length
      : 0;

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: {
      columnMapping: mappings,
      aiMappingConfidence: avgConfidence,
      status: UploadStatus.REVIEWING,
    },
  });

  res.json({
    status: 'success',
    data: { message: 'Column mapping saved' },
  });
};

// ---------------------------------------------------------------------------
// POST /api/upload/session/:id/match  — Run smart matching
// ---------------------------------------------------------------------------
export const matchRows = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);

  if (session.status !== UploadStatus.REVIEWING) {
    throw new AppError(`Cannot match rows in status ${session.status}`, 400);
  }

  const columnMapping = session.columnMapping as any[];
  if (!columnMapping || !Array.isArray(columnMapping)) {
    throw new AppError('Column mapping not set. Save mapping first.', 400);
  }

  // Re-parse file to get all rows
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const filePath = `${uploadDir}/${session.filename}`;
  const parsed = await fileParserService.parseFile(filePath, session.mimeType);

  let matchedCount = 0;
  let unmatchedCount = 0;
  let errorCount = 0;

  // Process rows in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < parsed.rows.length; i += BATCH_SIZE) {
    const batch = parsed.rows.slice(i, i + BATCH_SIZE);
    const rowRecords = [];

    for (let j = 0; j < batch.length; j++) {
      const rawRow = batch[j];
      const rowNumber = i + j + 1;

      // Apply column mapping to convert raw data to mapped data
      const mappedData: Record<string, string> = {};
      for (const mapping of columnMapping) {
        if (mapping.sourceColumn && mapping.targetField) {
          mappedData[mapping.targetField] = rawRow[mapping.sourceColumn] ?? '';
        }
      }

      try {
        const matchResult = await smartMatcherService.matchRow(mappedData);
        const bestConfidence = matchResult.partMatch?.confidence ?? 0;
        const status: UploadRowStatus =
          matchResult.partMatch && bestConfidence >= 0.5
            ? UploadRowStatus.MATCHED
            : UploadRowStatus.UNMATCHED;

        if (status === UploadRowStatus.MATCHED) matchedCount++;
        else unmatchedCount++;

        rowRecords.push({
          sessionId: session.id,
          rowNumber,
          rawData: rawRow,
          mappedData: { ...mappedData, ...matchResult.enrichedData },
          status,
          matchConfidence: bestConfidence,
          matchedPartId: matchResult.partMatch?.partId ?? null,
        });
      } catch (error: any) {
        errorCount++;
        rowRecords.push({
          sessionId: session.id,
          rowNumber,
          rawData: rawRow,
          mappedData,
          status: UploadRowStatus.ERROR,
          matchConfidence: null,
          matchedPartId: null,
          errors: { message: error.message },
        });
      }
    }

    // Bulk create rows
    await prisma.uploadSessionRow.createMany({ data: rowRecords });
  }

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: {
      processedRows: matchedCount + unmatchedCount + errorCount,
      errorRows: errorCount,
    },
  });

  res.json({
    status: 'success',
    data: {
      totalRows: parsed.rows.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
      errors: errorCount,
    },
  });
};

// ---------------------------------------------------------------------------
// GET /api/upload/session/:id/rows  — Paginated rows
// ---------------------------------------------------------------------------
export const getRows = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const statusFilter = req.query.status as string | undefined;

  const where: any = { sessionId: session.id };
  if (statusFilter && Object.values(UploadRowStatus).includes(statusFilter as UploadRowStatus)) {
    where.status = statusFilter;
  }

  const [rows, total] = await Promise.all([
    prisma.uploadSessionRow.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { rowNumber: 'asc' },
    }),
    prisma.uploadSessionRow.count({ where }),
  ]);

  res.json({
    status: 'success',
    data: {
      rows,
      pagination: { page, limit, total },
    },
  });
};

// ---------------------------------------------------------------------------
// PUT /api/upload/session/:id/rows/:rowId  — Edit a row
// ---------------------------------------------------------------------------
export const editRow = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);
  const { rowId } = req.params;

  const row = await prisma.uploadSessionRow.findFirst({
    where: { id: rowId, sessionId: session.id },
  });

  if (!row) {
    throw new AppError('Row not found', 404);
  }

  const { mappedData } = req.body;
  if (!mappedData || typeof mappedData !== 'object') {
    throw new AppError('mappedData object is required', 400);
  }

  const updated = await prisma.uploadSessionRow.update({
    where: { id: rowId },
    data: { mappedData },
  });

  res.json({
    status: 'success',
    data: { row: updated },
  });
};

// ---------------------------------------------------------------------------
// POST /api/upload/session/:id/import  — Import rows as listings
// ---------------------------------------------------------------------------
export const importRows = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);

  if (session.status !== UploadStatus.REVIEWING) {
    throw new AppError(`Cannot import in status ${session.status}`, 400);
  }

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: { status: UploadStatus.IMPORTING },
  });

  // Get all importable rows (matched + unmatched, not error)
  const rows = await prisma.uploadSessionRow.findMany({
    where: {
      sessionId: session.id,
      status: { in: [UploadRowStatus.MATCHED, UploadRowStatus.UNMATCHED] },
    },
    orderBy: { rowNumber: 'asc' },
  });

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const mapped = row.mappedData as Record<string, any> | null;
    if (!mapped) {
      skipped++;
      continue;
    }

    try {
      const listing = await prisma.listing.create({
        data: {
          title: mapped.description || mapped.partNumber || 'Untitled',
          description: mapped.description || '',
          price: parseFloat(mapped.price) || 0,
          category: mapped.category || 'Parts',
          condition: mapped.condition || 'As Removed',
          quantity: parseInt(mapped.quantity, 10) || 1,
          manufacturer: mapped.manufacturer || null,
          serialNumber: mapped.partNumber || null,
          location: mapped.location || null,
          userId: req.user!.id,
          status: 'DRAFT',
          partData: mapped.certificationStatus
            ? { certificationStatus: mapped.certificationStatus }
            : undefined,
        },
      });

      await prisma.uploadSessionRow.update({
        where: { id: row.id },
        data: {
          status: UploadRowStatus.IMPORTED,
          listingId: listing.id,
        },
      });

      imported++;
    } catch (error: any) {
      logger.error(`Import row ${row.rowNumber} failed:`, error.message);
      await prisma.uploadSessionRow.update({
        where: { id: row.id },
        data: {
          status: UploadRowStatus.ERROR,
          errors: { message: error.message },
        },
      });
      errors++;
    }
  }

  const finalStatus = errors > 0 && imported === 0 ? UploadStatus.FAILED : UploadStatus.COMPLETED;

  await prisma.uploadSession.update({
    where: { id: session.id },
    data: { status: finalStatus },
  });

  res.json({
    status: 'success',
    data: { imported, skipped, errors },
  });
};

// ---------------------------------------------------------------------------
// GET /api/upload/sessions  — List user's sessions
// ---------------------------------------------------------------------------
export const listSessions = async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const where = { userId: req.user!.id };

  const [sessions, total] = await Promise.all([
    prisma.uploadSession.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { rows: true } } },
    }),
    prisma.uploadSession.count({ where }),
  ]);

  res.json({
    status: 'success',
    data: {
      sessions,
      pagination: { page, limit, total },
    },
  });
};

// ---------------------------------------------------------------------------
// GET /api/upload/session/:id  — Get session details
// ---------------------------------------------------------------------------
export const getSession = async (req: AuthRequest, res: Response) => {
  const session = await getOwnSession(req);

  const statusCounts = await prisma.uploadSessionRow.groupBy({
    by: ['status'],
    where: { sessionId: session.id },
    _count: true,
  });

  res.json({
    status: 'success',
    data: {
      session,
      rowStatusCounts: statusCounts.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count }),
        {} as Record<string, number>
      ),
    },
  });
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOwnSession(req: AuthRequest) {
  const { id } = req.params;
  if (!id) {
    throw new AppError('Session ID is required', 400);
  }

  const session = await prisma.uploadSession.findUnique({ where: { id } });

  if (!session) {
    throw new AppError('Upload session not found', 404);
  }

  if (session.userId !== req.user!.id) {
    throw new AppError('Not authorized to access this session', 403);
  }

  return session;
}
