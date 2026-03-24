const winston = require('winston');
const path = require('path');

const { combine, timestamp, json, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return JSON.stringify({ level, message, timestamp, ...meta });
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'construction-erp' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), printf(({ level, message, timestamp }) =>
        `${timestamp} [${level}]: ${message}`
      )),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: combine(timestamp(), json()),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: combine(timestamp(), json()),
    }),
  ],
});

module.exports = logger;
