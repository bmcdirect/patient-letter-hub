import pino from 'pino';

export const logger = pino({
  // Use ISO timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Configure transport for pretty printing in development
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
});