const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return stack
        ? `${timestamp} ${level}: ${message} ${metaString}\n${stack}`
        : `${timestamp} ${level}: ${message}${metaString}`;
    })
  ),
  transports: [
    new transports.Console(),
  ],
});

module.exports = { logger };




