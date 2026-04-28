const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const errorLogPath = path.join(logsDir, 'error.log');
const combinedLogPath = path.join(logsDir, 'combined.log');

const ensureLogsDir = () => {
    try {
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    } catch (error) {
        // Logging should never crash the app.
    }
};

const serialize = (level, message, meta = {}) => {
    const payload = {
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        timestamp: new Date().toISOString(),
        ...meta
    };
    return JSON.stringify(payload);
};

const writeToFile = (filePath, line) => {
    try {
        ensureLogsDir();
        fs.appendFileSync(filePath, `${line}\n`);
    } catch (error) {
        // Ignore file logging errors silently.
    }
};

const logger = {
    info(message, meta = {}) {
        const line = serialize('info', message, meta);
        console.log(line);
        writeToFile(combinedLogPath, line);
    },
    warn(message, meta = {}) {
        const line = serialize('warn', message, meta);
        console.warn(line);
        writeToFile(combinedLogPath, line);
    },
    error(message, meta = {}) {
        const line = serialize('error', message, meta);
        console.error(line);
        writeToFile(combinedLogPath, line);
        writeToFile(errorLogPath, line);
    },
    debug(message, meta = {}) {
        if (process.env.NODE_ENV === 'production') return;
        const line = serialize('debug', message, meta);
        console.debug(line);
        writeToFile(combinedLogPath, line);
    }
};

module.exports = logger;
