import { describe, it, expect } from 'vitest';
import { serializeError, generateRequestId, generateSessionId, getSessionId } from '../main/logging/log-context';
import { z } from 'zod';

describe('Error Serialization and Context', () => {
  it('should serialize standard Error instances with name, message, and stack', () => {
    const error = new Error('Database connection lost');
    const serialized = serializeError(error);

    expect(serialized.name).toBe('Error');
    expect(serialized.message).toBe('Database connection lost');
    expect(serialized.stack).toBeDefined();
  });

  it('should serialize TypeError and custom error codes', () => {
    const typeError = new TypeError('Cannot read property of undefined');
    (typeError as any).code = 'ERR_INVALID_ARG_TYPE';

    const serialized = serializeError(typeError);
    expect(serialized.name).toBe('TypeError');
    expect(serialized.message).toContain('Cannot read property');
    expect(serialized.code).toBe('ERR_INVALID_ARG_TYPE');
  });

  it('should serialize Zod validation errors with clear formatted issues', () => {
    const schema = z.object({
      username: z.string(),
      age: z.number().min(18),
    });

    try {
      schema.parse({ username: 123, age: 10 });
    } catch (zodError) {
      const serialized = serializeError(zodError);
      expect(serialized.name).toBe('ZodError');
      expect(serialized.message).toContain('username');
      expect(serialized.message).toContain('age');
    }
  });

  it('should serialize Axios / HTTP-like errors with status codes', () => {
    const axiosError = new Error('Request failed with status code 401');
    (axiosError as any).isAxiosError = true;
    (axiosError as any).response = { status: 401, statusText: 'Unauthorized' };

    const serialized = serializeError(axiosError);
    expect(serialized.name).toBe('AxiosError');
    expect(serialized.code).toBe(401);
    expect(serialized.message).toContain('401');
  });

  it('should handle thrown raw strings and objects safely', () => {
    const stringErr = serializeError('Something went unexpectedly wrong');
    expect(stringErr.name).toBe('StringError');
    expect(stringErr.message).toBe('Something went unexpectedly wrong');

    const objErr = serializeError({ code: 500, message: 'Internal server error' });
    expect(objErr.name).toBe('ObjectError');
    expect(objErr.message).toBe('Internal server error');
    expect(objErr.code).toBe(500);

    const nullErr = serializeError(null);
    expect(nullErr.name).toBe('UnknownError');
  });

  it('should generate consistent session IDs and unique request IDs', () => {
    const sess1 = getSessionId();
    expect(sess1).toMatch(/^sess_/);
    const sess2 = getSessionId();
    expect(sess2).toBe(sess1);

    const req1 = generateRequestId('ocr');
    const req2 = generateRequestId('ocr');
    expect(req1).toMatch(/^ocr_/);
    expect(req2).toMatch(/^ocr_/);
    expect(req1).not.toBe(req2);
  });
});
