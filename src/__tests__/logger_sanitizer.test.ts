import { describe, it, expect } from 'vitest';
import { sanitizeMetadata, sanitizeString, isSensitiveKey } from '../main/logging/log-sanitizer';

describe('Log Sanitizer', () => {
  it('should identify sensitive keys correctly regardless of case or hyphenation', () => {
    expect(isSensitiveKey('password')).toBe(true);
    expect(isSensitiveKey('PassWord')).toBe(true);
    expect(isSensitiveKey('apiKey')).toBe(true);
    expect(isSensitiveKey('api_key')).toBe(true);
    expect(isSensitiveKey('token')).toBe(true);
    expect(isSensitiveKey('accessToken')).toBe(true);
    expect(isSensitiveKey('access_token')).toBe(true);
    expect(isSensitiveKey('authorization')).toBe(true);
    expect(isSensitiveKey('clientSecret')).toBe(true);
    expect(isSensitiveKey('cookie')).toBe(true);
    expect(isSensitiveKey('set-cookie')).toBe(true);

    // Non-sensitive keys
    expect(isSensitiveKey('username')).toBe(false);
    expect(isSensitiveKey('category')).toBe(false);
    expect(isSensitiveKey('language')).toBe(false);
    expect(isSensitiveKey('durationMs')).toBe(false);
  });

  it('should redact sensitive keys in nested metadata objects', () => {
    const rawMetadata = {
      user: 'learner123',
      apiKey: 'sk-1234567890abcdef1234567890abcdef',
      config: {
        password: 'SuperSecretPassword!',
        token: 'eyJh...jwtToken...',
        safeSetting: true,
        credentials: 'some-credential-string',
        authOptions: {
          clientSecret: 'topsecret',
        },
      },
      tags: ['test', 'learning'],
    };

    const sanitized = sanitizeMetadata(rawMetadata);

    expect(sanitized.user).toBe('learner123');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.config.password).toBe('[REDACTED]');
    expect(sanitized.config.token).toBe('[REDACTED]');
    expect(sanitized.config.safeSetting).toBe(true);
    expect(sanitized.config.credentials).toBe('[REDACTED]');
    expect(sanitized.config.authOptions.clientSecret).toBe('[REDACTED]');
    expect(sanitized.tags).toEqual(['test', 'learning']);
  });

  it('should redact common secret patterns embedded inside arbitrary strings', () => {
    const openaiKey = 'sk-proj-12345678901234567890abcdef';
    expect(sanitizeString(`Failed with key ${openaiKey}`)).toContain('sk-[REDACTED]');

    const googleKey = 'AIzaSyA1234567890123456789012345678901';
    expect(sanitizeString(`Google error with ${googleKey}`)).toContain('AIza[REDACTED]');

    const bearerHeader = 'Authorization: Bearer abcdef1234567890xyz';
    expect(sanitizeString(bearerHeader)).toContain('Bearer [REDACTED]');
  });

  it('should redact raw base64 data URLs for images and audio', () => {
    const dataUrl = 'data:image/png;base64,' + 'A'.repeat(100);
    const sanitized = sanitizeString(`Received image ${dataUrl}`);
    expect(sanitized).toContain('[IMAGE_DATA_URL_REDACTED]');
  });

  it('should handle circular references safely without throwing', () => {
    const circularObj: any = { name: 'circularTest' };
    circularObj.self = circularObj;

    expect(() => {
      const sanitized = sanitizeMetadata(circularObj);
      expect(sanitized.name).toBe('circularTest');
      expect(sanitized.self).toBe('[CIRCULAR_REFERENCE]');
    }).not.toThrow();
  });
});
