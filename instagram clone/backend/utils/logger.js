// Simple configurable logger for the backend
const LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  requests: 5, // special: enables request-level logs via request()
};

const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLevelName = envLevel in LEVELS ? envLevel : 'info';

function shouldLogFor(levelName) {
  if (currentLevelName === 'silent') return false;
  if (levelName === 'request') {
    // Allow request logs when LOG_LEVEL is 'requests' or 'debug', or when LOG_REQUESTS env var is set
    if (process.env.LOG_REQUESTS === 'true') return true;
    return currentLevelName === 'requests' || currentLevelName === 'debug';
  }
  const level = LEVELS[levelName] || LEVELS.info;
  const current = LEVELS[currentLevelName] || LEVELS.info;
  return level <= current;
}

function timestamp() {
  return new Date().toISOString();
}

function error(...args) {
  if (!shouldLogFor('error')) return;
  console.error(`[ERROR] ${timestamp()} -`, ...args);
}

function warn(...args) {
  if (!shouldLogFor('warn')) return;
  console.warn(`[WARN] ${timestamp()} -`, ...args);
}

function info(...args) {
  if (!shouldLogFor('info')) return;
  console.info(`[INFO] ${timestamp()} -`, ...args);
}

function debug(...args) {
  if (!shouldLogFor('debug')) return;
  console.debug(`[DEBUG] ${timestamp()} -`, ...args);
}

function _redactObject(obj) {
  const SENSITIVE_KEYS = ['authorization', 'cookie', 'set-cookie', 'password', 'token', 'access_token', 'refresh_token', 'auth'];
  const seen = new WeakSet();

  function redact(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') return val;
    if (typeof val !== 'object') return val;
    if (seen.has(val)) return '[Circular]';
    seen.add(val);
    if (Array.isArray(val)) {
      return val.map(redact);
    }
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }

  try {
    return redact(obj);
  } catch (e) {
    return '[UNREDACTABLE]';
  }
}

function _safeStringify(obj) {
  const seen = new Set();
  return JSON.stringify(obj, function(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  }, 2);
}

function request(req) {
  if (!shouldLogFor('request')) return;
  const ip = req.ip || req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress) || 'unknown';
  const base = {
    ts: timestamp(),
    method: req.method,
    url: req.originalUrl,
    ip
  };

  // Redact headers and body to avoid logging secrets
  const headers = req.headers ? _redactObject(req.headers) : undefined;
  const query = req.query ? _redactObject(req.query) : undefined;
  const params = req.params ? _redactObject(req.params) : undefined;
  const body = req.body ? _redactObject(req.body) : undefined;

  const payload = { ...base, headers, query, params, body };

  // Log as structured JSON so it's easy to parse in tooling
  try {
    console.log('[REQUEST]', _safeStringify(payload));
  } catch (e) {
    console.log('[REQUEST] ' + base.method + ' ' + base.url + ' from ' + ip);
  }
}

function getLevel() {
  return currentLevelName;
}

module.exports = { error, warn, info, debug, request, getLevel };
