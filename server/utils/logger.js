const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const formatDate = () => {
  return new Date().toISOString();
};

const writeLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: formatDate(),
    level,
    message,
    ...meta
  };

  const logString = JSON.stringify(logEntry) + '\n';
  
  // Write to console
  console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`);
  
  // Write to file
  const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logString);
};

const logger = {
  info: (message, meta) => writeLog('info', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta)
};

module.exports = { logger };