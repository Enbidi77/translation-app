import { SerializedError } from '../../shared/types/logging';
import { sanitizeString } from './log-sanitizer';

let currentSessionId: string | null = null;

/**
 * Generate a unique session identifier for the application run.
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  currentSessionId = `sess_${timestamp}_${random}`;
  return currentSessionId;
}

/**
 * Get the active session ID, generating one if not yet initialized.
 */
export function getSessionId(): string {
  if (!currentSessionId) {
    return generateSessionId();
  }
  return currentSessionId;
}

/**
 * Generate a unique request / operation correlation ID.
 */
export function generateRequestId(prefix: string = 'req'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Serializes any thrown error or unknown value into a clean, safe SerializedError.
 * Correctly handles Error, TypeError, DOMException, Axios/Fetch errors, Zod errors,
 * Electron errors, strings, objects, and unknown primitives.
 */
export function serializeError(error: unknown): SerializedError {
  if (error === null || error === undefined) {
    return {
      name: 'UnknownError',
      message: 'Unknown error occurred (null or undefined thrown)',
    };
  }

  // Handle standard JavaScript Error instances (TypeError, RangeError, etc.)
  if (error instanceof Error) {
    const serialized: SerializedError = {
      name: error.name || 'Error',
      message: sanitizeString(error.message || 'No error message provided'),
      stack: error.stack ? sanitizeString(error.stack) : undefined,
    };

    // Check for custom error properties like code or status
    const errObj = error as any;
    if (errObj.code !== undefined) {
      serialized.code = errObj.code;
    }

    // Check for ZodError
    if (Array.isArray(errObj.issues)) {
      serialized.name = 'ZodError';
      try {
        const issuesSummary = errObj.issues
          .map((iss: any) => `${iss.path?.join('.') || 'root'}: ${iss.message}`)
          .join('; ');
        serialized.message = `Validation failed: ${issuesSummary}`;
      } catch {
        // Fallback to error message
      }
    }

    // Check for Axios error
    if (errObj.isAxiosError) {
      serialized.name = 'AxiosError';
      const status = errObj.response?.status;
      const statusText = errObj.response?.statusText;
      if (status) {
        serialized.code = status;
        serialized.message = `${serialized.message} [HTTP ${status} ${statusText || ''}]`;
      }
    }

    // Check for DOMException
    if (typeof (globalThis as any).DOMException !== 'undefined' && error instanceof (globalThis as any).DOMException) {
      serialized.name = `DOMException(${error.name})`;
    }

    return serialized;
  }

  // Handle string thrown values: throw "something went wrong"
  if (typeof error === 'string') {
    return {
      name: 'StringError',
      message: sanitizeString(error),
    };
  }

  // Handle thrown plain objects: throw { code: 500, message: "Server error" }
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name : 'ObjectError';
    const message =
      typeof obj.message === 'string'
        ? obj.message
        : typeof obj.error === 'string'
        ? obj.error
        : JSON.stringify(obj);

    const stack = typeof obj.stack === 'string' ? obj.stack : undefined;
    const code = typeof obj.code === 'string' || typeof obj.code === 'number' ? obj.code : undefined;

    return {
      name,
      message: sanitizeString(message),
      stack: stack ? sanitizeString(stack) : undefined,
      code,
    };
  }

  // Fallback for numbers, booleans, symbols, etc.
  return {
    name: 'PrimitiveError',
    message: String(error),
  };
}
