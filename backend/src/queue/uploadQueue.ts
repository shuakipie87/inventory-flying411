import Queue from 'bull';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { fileParserService } from '../services/fileParser.service';
import { smartMatcherService } from '../services/smartMatcher.service';
import { UploadStatus, UploadRowStatus } from '@prisma/client';

// Redis connection for job queue
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create upload processing queue
export const uploadQueue = new Queue('upload-processing', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 50,
    },
});

// ---------------------------------------------------------------------------
// Job type interfaces
// ---------------------------------------------------------------------------

interface ParseJob {
    type: 'parse';
    sessionId: string;
}

interface MatchJob {
    type: 'match';
    sessionId: string;
}

interface ImportJob {
    type: 'import';
    sessionId: string;
    userId: string;
}

type UploadJob = ParseJob | MatchJob | ImportJob;

// ---------------------------------------------------------------------------
// Helper functions to add jobs
// ---------------------------------------------------------------------------

export const addParseJob = async (sessionId: string) => {
    const job = await uploadQueue.add('parse', {
        type: 'parse',
        sessionId,
    } as ParseJob);
    logger.info(`Parse job queued: session=${sessionId}, job=${job.id}`);
    return job;
};

export const addMatchJob = async (sessionId: string) => {
    const job = await uploadQueue.add('match', {
        type: 'match',
        sessionId,
    } as MatchJob);
    logger.info(`Match job queued: session=${sessionId}, job=${job.id}`);
    return job;
};

export const addImportJob = async (sessionId: string, userId: string) => {
    const job = await uploadQueue.add('import', {
        type: 'import',
        sessionId,
        userId,
    } as ImportJob);
    logger.info(`Import job queued: session=${sessionId}, job=${job.id}`);
    return job;
};

// ---------------------------------------------------------------------------
// Process: parse
// ---------------------------------------------------------------------------

uploadQueue.process('parse', async (job) => {
    const { sessionId } = job.data as ParseJob;
    logger.info(`Processing parse job: session=${sessionId}`);

    const session = await prisma.uploadSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error(`Upload session not found: ${sessionId}`);

    await prisma.uploadSession.update({
        where: { id: sessionId },
        data: { status: UploadStatus.PARSING },
    });

    try {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = `${uploadDir}/${session.filename}`;

        const result = await fileParserService.parseFile(filePath, session.mimeType);
        await job.progress(100);

        await prisma.uploadSession.update({
            where: { id: sessionId },
            data: {
                status: UploadStatus.MAPPING,
                totalRows: result.totalRows,
            },
        });

        logger.info(`Parse complete: session=${sessionId}, rows=${result.totalRows}`);
        return {
            sessionId,
            headers: result.headers,
            totalRows: result.totalRows,
            parseWarnings: result.parseWarnings,
        };
    } catch (error: any) {
        await prisma.uploadSession.update({
            where: { id: sessionId },
            data: { status: UploadStatus.FAILED },
        });
        throw error;
    }
});

// ---------------------------------------------------------------------------
// Process: match
// ---------------------------------------------------------------------------

uploadQueue.process('match', async (job) => {
    const { sessionId } = job.data as MatchJob;
    logger.info(`Processing match job: session=${sessionId}`);

    const session = await prisma.uploadSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error(`Upload session not found: ${sessionId}`);

    const columnMapping = session.columnMapping as any[];
    if (!columnMapping || !Array.isArray(columnMapping)) {
        throw new Error('Column mapping not set');
    }

    // Re-parse file
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = `${uploadDir}/${session.filename}`;
    const parsed = await fileParserService.parseFile(filePath, session.mimeType);

    let matchedCount = 0;
    let unmatchedCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < parsed.rows.length; i += BATCH_SIZE) {
        const batch = parsed.rows.slice(i, i + BATCH_SIZE);
        const rowRecords = [];

        for (let j = 0; j < batch.length; j++) {
            const rawRow = batch[j];
            const rowNumber = i + j + 1;

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
                    sessionId,
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
                    sessionId,
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

        await prisma.uploadSessionRow.createMany({ data: rowRecords });

        const progress = Math.round(((i + batch.length) / parsed.rows.length) * 100);
        await job.progress(progress);
    }

    await prisma.uploadSession.update({
        where: { id: sessionId },
        data: {
            processedRows: matchedCount + unmatchedCount + errorCount,
            errorRows: errorCount,
        },
    });

    logger.info(
        `Match complete: session=${sessionId}, matched=${matchedCount}, unmatched=${unmatchedCount}, errors=${errorCount}`
    );

    return { sessionId, matched: matchedCount, unmatched: unmatchedCount, errors: errorCount };
});

// ---------------------------------------------------------------------------
// Process: import
// ---------------------------------------------------------------------------

uploadQueue.process('import', async (job) => {
    const { sessionId, userId } = job.data as ImportJob;
    logger.info(`Processing import job: session=${sessionId}`);

    await prisma.uploadSession.update({
        where: { id: sessionId },
        data: { status: UploadStatus.IMPORTING },
    });

    const rows = await prisma.uploadSessionRow.findMany({
        where: {
            sessionId,
            status: { in: [UploadRowStatus.MATCHED, UploadRowStatus.UNMATCHED] },
        },
        orderBy: { rowNumber: 'asc' },
    });

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
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
                    userId,
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

        const progress = Math.round(((i + 1) / rows.length) * 100);
        await job.progress(progress);
    }

    const finalStatus = errors > 0 && imported === 0 ? UploadStatus.FAILED : UploadStatus.COMPLETED;

    await prisma.uploadSession.update({
        where: { id: sessionId },
        data: { status: finalStatus },
    });

    logger.info(`Import complete: session=${sessionId}, imported=${imported}, skipped=${skipped}, errors=${errors}`);
    return { sessionId, imported, skipped, errors };
});

// ---------------------------------------------------------------------------
// Queue event handlers
// ---------------------------------------------------------------------------

uploadQueue.on('completed', (job, result) => {
    logger.info(`Upload job ${job.id} (${job.name}) completed:`, result);
});

uploadQueue.on('failed', (job, err) => {
    logger.error(`Upload job ${job.id} (${job.name}) failed:`, err.message);
});

uploadQueue.on('stalled', (job) => {
    logger.warn(`Upload job ${job.id} stalled`);
});

// ---------------------------------------------------------------------------
// Queue health & shutdown
// ---------------------------------------------------------------------------

export const getUploadQueueHealth = async () => {
    const [waiting, active, completed, failed] = await Promise.all([
        uploadQueue.getWaitingCount(),
        uploadQueue.getActiveCount(),
        uploadQueue.getCompletedCount(),
        uploadQueue.getFailedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        isPaused: await uploadQueue.isPaused(),
    };
};

export const closeUploadQueue = async () => {
    await uploadQueue.close();
};
