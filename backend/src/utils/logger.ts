import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const errorRotateTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '50m',
  maxFiles: '30d',
  zippedArchive: true,
});

const combinedRotateTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '14d',
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    errorRotateTransport,
    combinedRotateTransport,
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export { logger };
