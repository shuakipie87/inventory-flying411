import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AppError } from './errorHandler';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new AppError(`File extension "${ext}" is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`, 400), false);
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.', 400), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
});

// Document upload (CSV, Excel, PDF, Pages) for bulk upload feature
const DOCUMENT_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf', '.pages'];
const DOCUMENT_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/pdf',
  'application/x-iwork-pages-sffpages',
];

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const documentFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!DOCUMENT_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(
        `File extension "${ext}" is not allowed. Accepted: ${DOCUMENT_EXTENSIONS.join(', ')}`,
        400
      ),
      false
    );
  }

  if (!DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new AppError(
        `Invalid file type "${file.mimetype}". Only CSV, Excel, PDF, and Pages files are allowed.`,
        400
      ),
      false
    );
  }

  cb(null, true);
};

const maxUploadSize = parseInt(process.env.MAX_UPLOAD_SIZE || '25', 10) * 1024 * 1024;

export const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: maxUploadSize,
  },
});
