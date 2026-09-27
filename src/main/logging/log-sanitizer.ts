/**
 * Sensitive Data Sanitizer
 * Recursively inspects metadata, strings, and objects to redact sensitive keys,
 * tokens, credentials, and privacy-sensitive data like screenshots/recordings.
 */

const REDACTED_MARKER = '[REDACTED]';

const SENSITIVE_KEY_PATTERNS = [
  /^password$/i,
  /^passwd$/i,
  /^secret$/i,
  /^token$/i,
  /^accesstoken$/i,
  /^refreshtoken$/i,
  /^apikey$/i,
  /^api_key$/i,
  /^clientsecret$/i,
  /^client_secret$/i,
  /^privatekey$/i,
  /^private_key$/i,
  /^authorization$/i,
  /^cookie$/i,
  /^set-cookie$/i,
  /^credentials?$/i,
  /^auth$/i,
  /^bearer$/i,
  /^creditcard$/i,
  /^credit_card$/i,
  /^cvv$/i,
  /^ssn$/i,
];

// Patterns for tokens and secrets embedded inside strings
const STRING_SECRET_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // OpenAI API Key pattern
  { regex: /sk-[a-zA-Z0-9_-]{20,}/g, replacement: 'sk-[REDACTED]' },
  // Google API Key pattern
  { regex: /AIza[0-9A-Za-z\-_]{20,}/g, replacement: 'AIza[REDACTED]' },
  // Bearer Token pattern
  { regex: /Bearer\s+([a-zA-Z0-9_\-\.+=]{10,})/gi, replacement: 'Bearer [REDACTED]' },
  // JWT tokens (three dot-separated base64-like strings)
  { regex: /ey[a-zA-Z0-9_-]{10,}\.ey[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, replacement: '[JWT_REDACTED]' },
  // GitHub Personal Access Token
  { regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/g, replacement: 'gh_[REDACTED]' },
  // Base64 data URLs (e.g. data:image/png;base64,...)
  { regex: /data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]{50,}/g, replacement: '[IMAGE_DATA_URL_REDACTED]' },
  // Raw base64 audio
  { regex: /data:audio\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]{50,}/g, replacement: '[AUDIO_DATA_URL_REDACTED]' },
];

export function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[-_]/g, '').toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key) || pattern.test(normalized));
}

export function sanitizeString(val: string): string {
  if (!val || typeof val !== 'string') return val;

  let result = val;
  for (const { regex, replacement } of STRING_SECRET_PATTERNS) {
    result = result.replace(regex, replacement);
  }

  // Also prevent storing raw base64 data blobs exceeding 2000 chars that look like base64
  if (result.length > 2048 && /^[A-Za-z0-9+/=\s]{2048,}$/.test(result)) {
    return `[RAW_BINARY_DATA_REDACTED len=${result.length}]`;
  }

  return result;
}

export function sanitizeMetadata<T>(value: T, maxDepth: number = 8, seen: WeakSet<object> = new WeakSet()): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value) as unknown as T;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined as unknown as T;
  }

  if (maxDepth <= 0) {
    return '[DEPTH_LIMIT_REACHED]' as unknown as T;
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[CIRCULAR_REFERENCE]' as unknown as T;
    }
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeMetadata(item, maxDepth - 1, seen)) as unknown as T;
    }

    if (value instanceof Date) {
      return value.toISOString() as unknown as T;
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: sanitizeString(value.message),
        stack: value.stack ? sanitizeString(value.stack) : undefined,
      } as unknown as T;
    }

    const output: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (isSensitiveKey(k)) {
        output[k] = REDACTED_MARKER;
      } else {
        output[k] = sanitizeMetadata(v, maxDepth - 1, seen);
      }
    }
    return output as unknown as T;
  }

  return value;
}
